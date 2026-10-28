// Human recordings of the minimal pairs (docs/fluent-forever-plan.md, Phase 7,
// step 4). A speaker's raw takes go in recordings/<speaker>/, one file per
// text, named after what it says ("maan.wav"). `pnpm audio:generate --recorded`
// runs them through the generated clips' ffmpeg chain into
// public/audio/recorded/<speaker>/ and lists them in src/audio/recorded.json,
// which speech.ts plays before any generated clip. No API calls.
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { clipKey, type RecordedManifest } from '../src/audio/speech.ts';

/** Raw takes, a folder per speaker. Nothing in it ships: only the processed MP3s do. */
export const TAKES_DIR = 'recordings';
/** Processed takes, under public/. The generated clips' --prune only looks at files directly in public/audio/. */
export const RECORDED_DIR = 'audio/recorded';
export const RECORDED_MANIFEST = 'src/audio/recorded.json';
const AUDIO_FILES = /\.(wav|aiff?|flac|m4a|caf|mp3|ogg|opus|webm)$/i;
const CONCURRENCY = 4;

/** A name that is safe in a file path and a URL: "Één" is "een", "de vork" is "de-vork". */
export function fileSlug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const loose = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Finds the text a take says from its file name: exactly ("maan.wav"), or
 * ignoring case and punctuation when only one text fits ("hoe_gaat_het.m4a"
 * for "Hoe gaat het?").
 */
export function takeMatcher(texts: Iterable<string>): (file: string) => string | undefined {
  const exact = new Set(texts);
  const byLoose = new Map<string, Array<string>>();
  for (const text of exact) {
    const key = loose(text);
    byLoose.set(key, [...(byLoose.get(key) ?? []), text]);
  }
  return (file) => {
    const name = clipKey(path.parse(file).name.normalize('NFC').replace(/_/g, ' '));
    if (exact.has(name)) return name;
    const fits = byLoose.get(loose(name)) ?? [];
    return fits.length === 1 ? fits[0] : undefined;
  };
}

export async function readRecorded(root: string): Promise<RecordedManifest> {
  const file = path.join(root, RECORDED_MANIFEST);
  const manifest = existsSync(file) ? (JSON.parse(await readFile(file, 'utf8')) as Partial<RecordedManifest>) : {};
  return { takes: manifest.takes ?? {} };
}

export type RecordingsReport = {
  manifest: RecordedManifest;
  /** Takes processed in this run, as paths from the root. */
  processed: Array<string>;
  /** Takes whose name is not a text the course plays. */
  unknown: Array<string>;
  failed: Array<{ take: string; error: string }>;
  /** Texts with earlier takes that the course no longer plays, left out of the manifest. */
  stale: Array<string>;
};

/**
 * Processes every raw take and rewrites the manifest. Earlier takes stay while
 * their MP3 is there, so the raw takes need not be kept in the repository; to
 * drop a take, delete its MP3 and run again.
 */
export async function processRecordings({
  root,
  texts,
  convert,
}: {
  root: string;
  /** Every text the course plays, keyed by clipKey(). */
  texts: Iterable<string>;
  /** The ffmpeg chain: a raw take in, a processed MP3 out. */
  convert: (raw: string, out: string) => Promise<void>;
}): Promise<RecordingsReport> {
  const known = new Set(texts);
  const match = takeMatcher(known);
  const jobs: Array<{ take: string; text: string; file: string }> = [];
  const unknown: Array<string> = [];
  const takesDir = path.join(root, TAKES_DIR);
  const speakers = existsSync(takesDir) ? (await readdir(takesDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()) : [];
  for (const speaker of speakers.filter((entry) => !entry.name.startsWith('.'))) {
    const id = fileSlug(speaker.name);
    if (!id) throw new Error(`Rename ${TAKES_DIR}/${speaker.name}: a speaker's folder needs a letter or digit in its name.`);
    for (const name of (await readdir(path.join(takesDir, speaker.name))).sort()) {
      if (name.startsWith('.') || !AUDIO_FILES.test(name)) continue;
      const take = `${TAKES_DIR}/${speaker.name}/${name}`;
      const text = match(name);
      if (!text) {
        unknown.push(take);
        continue;
      }
      const file = `${RECORDED_DIR}/${id}/${fileSlug(text)}.mp3`;
      const clash = jobs.find((job) => job.file === file);
      if (clash) throw new Error(`${clash.take} and ${take} would both become ${file}: keep one take per text and speaker.`);
      jobs.push({ take, text, file });
    }
  }

  const processed: typeof jobs = [];
  const failed: RecordingsReport['failed'] = [];
  const queue = [...jobs];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const out = path.join(root, 'public', job.file);
      try {
        await mkdir(path.dirname(out), { recursive: true });
        await convert(path.join(root, job.take), out);
        processed.push(job);
      } catch (error) {
        failed.push({ take: job.take, error: (error as Error).message });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const takes = new Map<string, Set<string>>();
  const add = (text: string, file: string) => takes.set(text, (takes.get(text) ?? new Set()).add(file));
  const stale: Array<string> = [];
  for (const [text, files] of Object.entries((await readRecorded(root)).takes)) {
    if (!known.has(text)) stale.push(text);
    else for (const file of files) if (existsSync(path.join(root, 'public', file))) add(text, file);
  }
  for (const job of processed) add(job.text, job.file);
  // Sorted, so the files keep their order (speech.ts rotates through it) and diffs stay small.
  const manifest: RecordedManifest = {
    takes: Object.fromEntries([...takes].sort(([x], [y]) => x.localeCompare(y)).map(([text, files]) => [text, [...files].sort()])),
  };
  const manifestPath = path.join(root, RECORDED_MANIFEST);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(`${manifestPath}.tmp`, manifestPath);
  return { manifest, processed: processed.map((job) => job.take).sort(), unknown, failed, stale };
}
