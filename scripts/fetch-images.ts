// Builds the bundled pictures from the owner's picks (src/images/picks.json):
// downloads each picture, crops it to 4:3, scales it to 480×360 and writes
// WebP to public/images/, then rewrites the credits in src/images/images.json.
// Dev only: the extension itself never downloads anything.
//
//   pnpm images:fetch            fetch new or changed picks, write the manifest
//   pnpm images:fetch --plan     list the picks and what would change; no network
//   pnpm images:fetch --prune    also delete files in public/images/ the manifest no longer uses
//
// Picks are keyed by the Dutch the picture shows, as the learner sees it:
//   "de fiets":  { "commons": "File:Omafiets.jpg", "focus": [0.5, 0.6] }
//       Wikimedia Commons: the author and license are read from Commons and checked.
//   "het brood": { "file": "photos/brood.jpg", "author": "Your name" }
//       The owner's own photo (a path from the repository root), credited as "Own photo".
//   "de kat":    { "url": "https://…/kat.jpg", "source": "https://…", "author": "…", "license": "CC BY 4.0", "licenseUrl": "https://…" }
//       Anywhere else, credit given by hand.
// `focus` moves the crop towards a point (fractions of width and height; default the centre).
//
// Only CC0, public domain and CC BY are accepted: the pictures are cropped (so
// no ND), NC is unclear for a free extension, and SA would bind the crops.
// Commons files marked with personality or trademark restrictions are refused
// too (no identifiable faces, no logos). Needs ffprobe and cwebp on the PATH
// (brew install ffmpeg webp). Photos must be upright: EXIF rotation is not applied.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { normalizeAnswer, stripAccents } from '../src/engine/answers.ts';
import { coverCrop, PICTURE_SIZE } from '../src/images/crop.ts';
import type { ImageCredit, ImageManifest } from '../src/images/manifest.ts';

export type Pick = {
  commons?: string;
  file?: string;
  url?: string;
  source?: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  focus?: [number, number];
};

/** Bump when the crop or encoding changes, so every picture is rebuilt. */
const ENCODE_VERSION = 2;
/** cwebp searches for the quality that lands near this size (bytes). */
const TARGET_BYTES = 25_000;
const USER_AGENT = 'TaalNudge-fetch-images/1.0 (dev script for a language-learning browser extension)';

/** Commons license codes we accept, with how they are credited. */
const LICENSES: Record<string, { name: (version: string) => string; url: (version: string) => string }> = {
  cc0: { name: () => 'CC0 1.0', url: () => 'https://creativecommons.org/publicdomain/zero/1.0/' },
  pd: { name: () => 'Public domain', url: () => '' },
  'cc-by': { name: (version) => `CC BY ${version}`, url: (version) => `https://creativecommons.org/licenses/by/${version}/` },
};

/**
 * The credit for a Commons file from its extmetadata, or why it cannot be
 * used. License codes look like "cc0", "pd", "cc-by-4.0", "cc-by-sa-3.0".
 */
export function commonsCredit(meta: Record<string, { value?: string } | undefined>, page: string): Omit<ImageCredit, 'file'> | { refused: string } {
  const code = (meta.License?.value ?? '').toLowerCase();
  const restrictions = (meta.Restrictions?.value ?? '').trim();
  if (restrictions) return { refused: `restricted (${restrictions})` };
  const match = /^(cc0|pd|cc-by)(?:-(\d\.\d))?$/.exec(code);
  const license = match && LICENSES[match[1]!];
  if (!match || !license || (match[1] === 'cc-by' && !match[2])) return { refused: `license "${meta.LicenseShortName?.value ?? code}" is not CC0, public domain or CC BY` };
  const version = match[2] ?? '';
  const author = plainText(meta.Artist?.value ?? '');
  if (!author && match[1] === 'cc-by') return { refused: 'CC BY without an author to credit' };
  return { author: author || 'Unknown author', source: page, license: license.name(version), licenseUrl: license.url(version) };
}

/** Commons artist fields are HTML ("<a href=…>Name</a>"): the text only. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "de fiets" → "fiets-<hash>.webp": readable, and new whenever the pick changes. */
export function fileNameFor(dutch: string, pick: Pick): string {
  const slug = stripAccents(normalizeAnswer(dutch).replace(/^(de|het|een) /, ''))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const hash = createHash('sha1').update(JSON.stringify([pick, PICTURE_SIZE, TARGET_BYTES, ENCODE_VERSION])).digest('hex').slice(0, 6);
  return `${slug}-${hash}.webp`;
}

/** What is wrong with a pick before anything is fetched. */
export function checkPick(dutch: string, pick: Pick): string | undefined {
  if (normalizeAnswer(dutch) !== dutch) return 'key must be lower case without punctuation, as normalizeAnswer writes it';
  const sources = [pick.commons, pick.file, pick.url].filter(Boolean);
  if (sources.length !== 1) return 'give exactly one of commons, file or url';
  if (pick.commons && !/^File:.+\.(jpe?g|png|webp|tiff?)$/i.test(pick.commons)) return 'commons must be a file title like "File:Omafiets.jpg"';
  if (pick.url && !(pick.source && pick.author && pick.license && /^(CC0 1\.0|Public domain|CC BY \d\.\d)$/.test(pick.license))) {
    return 'a url pick needs source, author and a CC0, public domain or CC BY license';
  }
  if (pick.focus && !pick.focus.every((value) => value >= 0 && value <= 1)) return 'focus values go from 0 to 1';
  return undefined;
}

// Resolved when the script runs (tests import this file).
let root = '';
const run = promisify(execFile);

type Fetched = { input: string; credit: Omit<ImageCredit, 'file'> };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Commons limits bursts: on 429 or 503 wait as asked (or a little longer each time) and try again. */
async function politeFetch(url: string | URL): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if ((response.status !== 429 && response.status !== 503) || attempt === 4) return response;
    const seconds = Number(response.headers.get('retry-after')) || 5 * 2 ** attempt;
    console.log(`           Commons asked to slow down; waiting ${seconds} s`);
    await wait(seconds * 1000);
  }
}

async function download(url: string, to: string): Promise<void> {
  const response = await politeFetch(url);
  if (!response.ok) throw new Error(`download failed: ${response.status} ${url}`);
  await writeFile(to, Buffer.from(await response.arrayBuffer()));
}

async function fromCommons(title: string, to: string): Promise<Fetched | { refused: string }> {
  const query = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [key, value] of Object.entries({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1280', titles: title })) {
    query.searchParams.set(key, value);
  }
  const response = await politeFetch(query);
  if (!response.ok) throw new Error(`Commons said ${response.status}`);
  const data = (await response.json()) as { query?: { pages?: Record<string, { missing?: string; imageinfo?: Array<{ url: string; thumburl?: string; descriptionurl: string; extmetadata: Record<string, { value?: string }> }> }> } };
  const info = Object.values(data.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info) return { refused: `${title} was not found on Commons` };
  const credit = commonsCredit(info.extmetadata, info.descriptionurl);
  if ('refused' in credit) return credit;
  await download(info.thumburl ?? info.url, to);
  return { input: to, credit };
}

async function resolvePick(dutch: string, pick: Pick, work: string): Promise<Fetched | { refused: string }> {
  const raw = path.join(work, `${createHash('sha1').update(dutch).digest('hex').slice(0, 8)}.src`);
  if (pick.commons) return fromCommons(pick.commons, raw);
  if (pick.file) {
    const input = path.resolve(root, pick.file);
    if (!existsSync(input)) return { refused: `${pick.file} does not exist` };
    return { input, credit: { author: pick.author ?? 'TaalNudge', source: '', license: 'Own photo', licenseUrl: '' } };
  }
  await download(pick.url!, raw);
  return { input: raw, credit: { author: pick.author!, source: pick.source!, license: pick.license!, licenseUrl: pick.licenseUrl ?? '' } };
}

async function encode(input: string, out: string, focus: [number, number] | undefined): Promise<void> {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', input]);
  const [width, height] = stdout.trim().split(',').map(Number);
  if (!width || !height) throw new Error(`could not read the size of ${input}`);
  const box = coverCrop(width, height, focus);
  await run('cwebp', [
    '-quiet',
    '-metadata', 'none',
    '-crop', String(box.x), String(box.y), String(box.width), String(box.height),
    '-resize', String(PICTURE_SIZE.width), String(PICTURE_SIZE.height),
    '-size', String(TARGET_BYTES),
    '-pass', '6',
    '-m', '6',
    '-sharp_yuv',
    input,
    '-o', out,
  ]);
}

async function main() {
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2);
  const planOnly = args.includes('--plan');
  const picksPath = path.join(root, 'src/images/picks.json');
  const manifestPath = path.join(root, 'src/images/images.json');
  const folder = path.join(root, 'public/images');
  const picks = JSON.parse(await readFile(picksPath, 'utf8')) as Record<string, Pick>;
  const previous = existsSync(manifestPath) ? (JSON.parse(await readFile(manifestPath, 'utf8')) as ImageManifest) : {};
  const work = path.join(os.tmpdir(), 'taalnudge-images');
  await mkdir(work, { recursive: true });
  await mkdir(folder, { recursive: true });

  const manifest: ImageManifest = {};
  const problems: Array<string> = [];
  for (const dutch of Object.keys(picks).sort()) {
    const pick = picks[dutch]!;
    const issue = checkPick(dutch, pick);
    if (issue) {
      problems.push(`${dutch}: ${issue}`);
      continue;
    }
    const file = fileNameFor(dutch, pick);
    const out = path.join(folder, file);
    const kept = previous[dutch]?.file === file && existsSync(out) ? previous[dutch] : undefined;
    if (planOnly) {
      console.log(`${kept ? 'unchanged' : 'fetch    '}  ${dutch}  ${pick.commons ?? pick.file ?? pick.url}`);
      if (kept) manifest[dutch] = kept;
      continue;
    }
    if (kept) {
      manifest[dutch] = kept;
      continue;
    }
    try {
      const fetched = await resolvePick(dutch, pick, work);
      if ('refused' in fetched) {
        problems.push(`${dutch}: ${fetched.refused}`);
        continue;
      }
      await encode(fetched.input, out, pick.focus);
      manifest[dutch] = { file, ...fetched.credit };
      console.log(`made       ${dutch}  ${file}  ${((await stat(out)).size / 1024).toFixed(1)} KB  ${fetched.credit.license}, ${fetched.credit.author}`);
    } catch (error) {
      problems.push(`${dutch}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (planOnly) {
    console.log(`${Object.keys(picks).length} picks, ${Object.keys(manifest).length} unchanged. No files written.`);
  } else {
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Wrote ${Object.keys(manifest).length} pictures to src/images/images.json.`);
    if (args.includes('--prune')) {
      const used = new Set(Object.values(manifest).map((credit) => credit.file));
      for (const file of await readdir(folder)) {
        if (!used.has(file) && !file.startsWith('.')) {
          await rm(path.join(folder, file));
          console.log(`pruned     ${file}`);
        }
      }
    }
  }
  if (problems.length > 0) {
    console.error(`\n${problems.length} picks were left out:\n${problems.map((problem) => `  ${problem}`).join('\n')}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
