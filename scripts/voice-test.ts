// The voice test: the course's riskiest texts through Google's Chirp 3: HD voices, beside the
// clips the course already has for the same texts. Every clip goes through the course's ffmpeg
// chain and the same Speech-to-Text check, and lands on one page to listen to.
// docs/audio-research.md explains why short words decide between voices.
//
//   pnpm voice:test --list                 the nl-NL Chirp 3: HD voices, with their gender
//   pnpm voice:test                        Charon and Iapetus (male) and Erinome (female) at pace 1 and 0.9
//   pnpm voice:test --voices Charon,Kore   other voices; --rates 1,0.85 other paces
//   pnpm voice:test --no-stt               the clips and the listening page, without Speech-to-Text
//
// Needs GOOGLE_CLOUD_API_KEY in .env.local, from a project with the Cloud Text-to-Speech API
// enabled (and the Cloud Speech-to-Text API, for the check), and ffmpeg on the PATH. A run sends
// about 380 characters per voice and pace (2,274 for the default run), far inside Google's free
// monthly allowance, and takes and transcripts are reused: delete voice-test/ to start over.
// It writes voice-test/ (gitignored): takes/ as Google returned them, clips/ through the ffmpeg
// chain, results.json, report.md, and index.html, the page to listen with.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { clipKey, type ClipVoice } from '../src/audio/speech.ts';
import { duration, isFlagged, isShort, peak, postProcess, SILENT_PEAK_DB, toFlac, wordErrorRate, type AudioManifest } from './generate-audio.ts';
import { googleCloud, GoogleApiError } from './google-cloud.ts';

export type TestText = {
  text: string;
  /** What the text puts to the test. */
  probes: string;
  /** The course voice that reads it: a, the main voice; b, the second speaker of a dialogue. */
  voice: ClipVoice;
  /** course: a text the course plays, so it may have a clip of its own to compare with; research: a probe from docs/audio-research.md. */
  from: 'course' | 'research';
};

/** Short words first: there the voices differed, while every voice read the sentences right. */
export const TEST_TEXTS: ReadonlyArray<TestText> = [
  { text: 'deur', probes: 'eu, said alone', voice: 'a', from: 'course' },
  { text: 'wel', probes: 'a short word heard as English', voice: 'a', from: 'course' },
  { text: 'huis', probes: 'ui', voice: 'a', from: 'course' },
  { text: 'thuis', probes: 'ui', voice: 'a', from: 'course' },
  { text: 'tijd', probes: 'ij', voice: 'a', from: 'course' },
  { text: 'leuk', probes: 'eu', voice: 'a', from: 'course' },
  { text: 'de keuken', probes: 'eu twice', voice: 'a', from: 'course' },
  { text: 'goed', probes: 'the soft g', voice: 'a', from: 'course' },
  { text: 'graag', probes: 'g twice', voice: 'a', from: 'course' },
  { text: 'misschien', probes: 'sch said as s', voice: 'a', from: 'course' },
  { text: 'naar school', probes: 'sch', voice: 'a', from: 'course' },
  { text: 'maan', probes: 'long aa, a minimal pair', voice: 'a', from: 'course' },
  { text: 'man', probes: 'short a, a minimal pair', voice: 'a', from: 'course' },
  { text: 'Pardon?', probes: 'a one-word question', voice: 'a', from: 'research' },
  { text: 'Het is kwart over drie.', probes: 'clock time', voice: 'a', from: 'course' },
  { text: 'Hoe schrijf je dat?', probes: 'sch and ij in a question', voice: 'a', from: 'course' },
  { text: 'Hoelang duurt het?', probes: 'uu in a question', voice: 'a', from: 'course' },
  { text: 'Bel 112! Er is een ongeluk gebeurd.', probes: 'a number, urgency', voice: 'a', from: 'course' },
  { text: 'De ui in huis, de eu in neus, de ij in tijd.', probes: 'the vowels learners mix up', voice: 'a', from: 'research' },
  { text: 'De g van goed, de sch van school.', probes: 'g and sch side by side', voice: 'a', from: 'research' },
  { text: 'Ik spel het: S, A, N, N, E.', probes: 'letter names', voice: 'a', from: 'research' },
  { text: 'Hoi! Heb je tijd voor koffie?', probes: 'a question in a dialogue', voice: 'b', from: 'course' },
  { text: 'Ja, vrijdag is goed.', probes: 'v, ij and g', voice: 'b', from: 'course' },
  { text: 'Ja, ik ben Alex. Ik kom uit Schotland.', probes: 'ui and sch, a name', voice: 'b', from: 'course' },
  { text: 'Smith. S-M-I-T-H.', probes: 'spelling a name', voice: 'b', from: 'course' },
];

/** The first test's candidates (docs/audio-research.md): two male voices for the main voice and a female one for the dialogues. */
export const DEFAULT_VOICES = ['Charon', 'Iapetus', 'Erinome'];
export const DEFAULT_RATES = [1, 0.9];

/** "Charon" or "nl-NL-Chirp3-HD-Charon" → the full voice name. */
export function voiceName(voice: string): string {
  return voice.includes('-') ? voice : `nl-NL-Chirp3-HD-${voice}`;
}

/**
 * One clip of one text, as the check heard it. `file` is relative to voice-test/. A silent take
 * (Google sometimes returns a quarter second of nothing for a one-word text) has no clip and
 * counts as a miss.
 */
export type TestResult = { source: string; text: string; file: string; seconds: number; transcript?: string; wer?: number; silent?: boolean };

/** The source name of the course's own clips: "Course (Erinome)", by the manifest's voice for the part. */
export const COURSE = 'Course';

export type SourceSummary = {
  source: string;
  /** Texts of up to three words that came back word for word. */
  short: { exact: number; total: number };
  /** Longer texts that came back with at most one word in five wrong. */
  sentences: { close: number; total: number };
  /** Letters per second over the longer texts. */
  pace?: number;
  /** Clips far longer or shorter than their text: a repeat or a cut-off. */
  lengthFlags: number;
  /** Takes that came back silent: misses in the counts above too. */
  silent: number;
};

const letters = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, '').length;

/** Per source, in the order the sources first appear. Checked clips and silent takes count towards the scores. */
export function summarize(results: ReadonlyArray<TestResult>): Array<SourceSummary> {
  const sources = [...new Set(results.map((result) => result.source))];
  return sources.map((source) => {
    const own = results.filter((result) => result.source === source);
    const scored = own.filter((result) => result.silent || result.wer !== undefined);
    const short = scored.filter((result) => isShort(result.text));
    const sentences = scored.filter((result) => !isShort(result.text));
    const spoken = own.filter((result) => !result.silent);
    const timed = spoken.filter((result) => !isShort(result.text) && result.seconds > 0);
    return {
      source,
      short: { exact: short.filter((result) => heard(result)).length, total: short.length },
      sentences: { close: sentences.filter((result) => heard(result)).length, total: sentences.length },
      ...(timed.length ? { pace: timed.reduce((sum, result) => sum + letters(result.text) / result.seconds, 0) / timed.length } : {}),
      lengthFlags: spoken.filter((result) => isFlagged(result.text, 0, result.seconds)).length,
      silent: own.length - spoken.length,
    };
  });
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Whether the check heard the text: exactly for a short text, within one word in five for a sentence. */
export function heard(result: TestResult): boolean | undefined {
  if (result.silent) return false;
  if (result.wer === undefined) return undefined;
  return isShort(result.text) ? result.wer === 0 : result.wer <= 0.2;
}

/** The page to listen with: a row per text, a column per source, each clip with what the check heard. */
export function listeningPage(texts: ReadonlyArray<TestText>, sources: ReadonlyArray<string>, results: ReadonlyArray<TestResult>, when: string): string {
  const cell = (text: TestText, source: string) => {
    const result = results.find((candidate) => candidate.source === source && candidate.text === text.text);
    if (!result) return '<td class="none">–</td>';
    if (result.silent) return '<td><span class="miss">came back silent</span></td>';
    const verdict = heard(result);
    const mark = verdict === undefined ? '' : verdict ? '<span class="ok">heard</span>' : `<span class="miss">heard “${escape(result.transcript || '…')}”</span>`;
    return `<td><audio controls preload="none" src="${escape(result.file)}"></audio>${mark}</td>`;
  };
  const rows = texts.map((text) => `<tr><th scope="row">${escape(text.text)}<small>${escape(text.probes)}</small></th>${sources.map((source) => cell(text, source)).join('')}</tr>`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Voice test</title>
<style>
  :root { color-scheme: light dark; --ink: #1d232a; --muted: #5d6873; --line: #d9dee3; --paper: #ffffff; --ok: #1f7a4d; --miss: #b4232c; }
  @media (prefers-color-scheme: dark) { :root { --ink: #e7ebef; --muted: #a2adb8; --line: #36404a; --paper: #14191e; --ok: #5fd39a; --miss: #ff8a8f; } }
  body { margin: 0; padding: 24px 16px; font: 15px/1.45 system-ui, sans-serif; color: var(--ink); background: var(--paper); }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { margin: 0 0 16px; color: var(--muted); max-width: 70ch; }
  /* The page scrolls both ways; the voices stay on top and the text stays at the left, to compare across a row. */
  table { border-collapse: separate; border-spacing: 0; }
  th, td { border-top: 1px solid var(--line); padding: 8px 10px; text-align: left; vertical-align: top; background: var(--paper); }
  /* Above the players, which paint on a layer of their own. */
  thead th { position: sticky; top: 0; z-index: 2; font-weight: 600; white-space: nowrap; }
  th[scope="row"] { position: sticky; left: 0; z-index: 1; font-weight: 600; min-width: 14ch; max-width: 22ch; }
  thead th:first-child { left: 0; z-index: 3; }
  small { display: block; font-weight: 400; color: var(--muted); }
  audio { display: block; width: 210px; height: 34px; }
  .ok, .miss { display: block; font-size: 13px; margin-top: 2px; }
  .ok { color: var(--ok); }
  .miss { color: var(--miss); }
  .none { color: var(--muted); }
</style>
</head>
<body>
<h1>Voice test</h1>
<p>Run ${escape(when)}. Listen across a row: the same text from each voice. Under each clip, what Speech-to-Text heard: short texts must come back word for word. Only a Dutch listener can judge the accent; the check cannot.</p>
<table>
<thead><tr><th scope="col">Text</th>${sources.map((source) => `<th scope="col">${escape(source)}</th>`).join('')}</tr></thead>
<tbody>
${rows.join('\n')}
</tbody>
</table>
</body>
</html>
`;
}

const percent = (part: number, whole: number) => (whole ? `${part} of ${whole}` : '–');

/** The report: the scores on the texts the course and the voices tested both have, then every text the check missed. */
export function report(texts: ReadonlyArray<TestText>, results: ReadonlyArray<TestResult>, when: string, characters: number): string {
  const shared = new Set(results.filter((result) => result.source.startsWith(COURSE)).map((result) => result.text));
  const table = (rows: Array<SourceSummary>) => [
    '| Source | Short texts back exactly | Sentences heard | Silent takes | Pace (letters/s) | Length flags |',
    '|---|---|---|---|---|---|',
    ...rows.map(
      (row) =>
        `| ${row.source} | ${percent(row.short.exact, row.short.total)} | ${percent(row.sentences.close, row.sentences.total)} | ${row.silent} | ${row.pace?.toFixed(1) ?? '–'} | ${row.lengthFlags} |`,
    ),
  ];
  const missed = results.filter((result) => heard(result) === false);
  return [
    '# Voice test: Google Chirp 3: HD voices and the course’s clips',
    '',
    `Run ${when}: ${texts.length} texts, ${shared.size} of them with a clip in the course. ${characters} characters went to Text-to-Speech this run. Speech-to-Text: Google, Dutch (nl-NL) forced; every clip went through the course's ffmpeg chain first. The listening page is \`voice-test/index.html\`.`,
    '',
    'Google’s Speech-to-Text may hear Google’s own voices more easily than other voices. The course’s clips go through the same check, so the first table compares like with like, but only a Dutch listener settles it.',
    '',
    '## On the texts both have',
    '',
    ...table(summarize(results.filter((result) => shared.has(result.text)))),
    '',
    '## On every text',
    '',
    ...table(summarize(results)),
    '',
    '## What the check did not hear',
    '',
    missed.length ? '| Text | Source | Heard | WER |' : 'Nothing: every checked clip came back.',
    ...(missed.length ? ['|---|---|---|---|'] : []),
    ...missed.map((result) =>
      result.silent
        ? `| ${result.text.replace(/\|/g, '\\|')} | ${result.source} | (the take came back silent) | – |`
        : `| ${result.text.replace(/\|/g, '\\|')} | ${result.source} | ${(result.transcript || '(nothing)').replace(/\|/g, '\\|')} | ${result.wer!.toFixed(2)} |`,
    ),
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Everything below runs only when the script is executed.

const option = (name: string) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};
const slug = (text: string) => createHash('sha1').update(text).digest('hex').slice(0, 10);

const SETUP = `Set GOOGLE_CLOUD_API_KEY in .env.local. In the Google Cloud console (console.cloud.google.com):
  1. Create a project, or pick one, with billing linked (the free trial's credit covers it).
  2. Enable the Cloud Text-to-Speech API, and the Cloud Speech-to-Text API for the check.
  3. Under APIs & Services > Credentials, create an API key and restrict it to those two APIs.`;

async function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const out = path.join(root, 'voice-test');
  const key = process.env.GOOGLE_CLOUD_API_KEY;
  if (!key) {
    console.error(SETUP);
    process.exitCode = 1;
    return;
  }
  const google = googleCloud({ key, ttsEndpoint: process.env.GOOGLE_TTS_ENDPOINT || undefined, sttEndpoint: process.env.GOOGLE_STT_ENDPOINT || undefined });
  let refused = false;
  const fatal = (error: unknown) => {
    if (!(error instanceof GoogleApiError) || !error.fatal) return false;
    // Calls in flight fail the same way; say it once.
    if (!refused) console.error(`Google refused the call: ${error.message}\n\n${SETUP}`);
    refused = true;
    process.exitCode = 1;
    return true;
  };

  if (process.argv.includes('--list')) {
    try {
      const voices = (await google.voices('nl-NL')).filter((voice) => voice.name.includes('Chirp3-HD'));
      for (const voice of voices) console.log(`${voice.name.padEnd(36)} ${voice.gender.toLowerCase()}${DEFAULT_VOICES.some((name) => voiceName(name) === voice.name) ? '  (tested by default)' : ''}`);
      console.log(`${voices.length} nl-NL Chirp 3: HD voices.`);
    } catch (error) {
      if (!fatal(error)) throw error;
    }
    return;
  }

  const voices = (option('--voices')?.split(',') ?? DEFAULT_VOICES).map((voice) => voice.trim()).filter(Boolean);
  const rates = option('--rates')?.split(',').map(Number) ?? DEFAULT_RATES;
  if (rates.some((rate) => !(rate >= 0.25 && rate <= 2))) throw new Error('--rates takes paces from 0.25 to 2, such as 1,0.9');
  let checking = !process.argv.includes('--no-stt');
  const label = (voice: string, rate: number) => `${voiceName(voice).split('-').at(-1)} (pace ${rate})`;
  const sources = voices.flatMap((voice) => rates.map((rate) => ({ voice, rate, label: label(voice, rate) })));

  const manifest = JSON.parse(await readFile(path.join(root, 'src/audio/clips.json'), 'utf8')) as Partial<AudioManifest>;
  const resultsPath = path.join(out, 'results.json');
  const before: Record<string, TestResult> = existsSync(resultsPath) ? JSON.parse(await readFile(resultsPath, 'utf8')) : {};
  const results: Array<TestResult> = [];
  let characters = 0;
  let stopped = false;

  // The course's own clips for the same texts, named after the voice that reads each part.
  for (const text of TEST_TEXTS) {
    const file = (text.voice === 'a' ? manifest.clips : manifest.clipsB)?.[clipKey(text.text)];
    if (file) results.push({ source: `${COURSE} (${manifest.voices?.[text.voice]?.name ?? text.voice})`, text: text.text, file: `../public/${file}`, seconds: await duration(path.join(root, 'public', file)) });
  }
  // Google's takes, kept as returned, then through the course's ffmpeg chain.
  const jobs = sources.flatMap((source) => TEST_TEXTS.map((text) => ({ ...source, text })));
  const queue = [...jobs];
  const worker = async () => {
    for (let job = queue.shift(); job && !stopped; job = queue.shift()) {
      const folder = path.join(voiceName(job.voice).split('-').at(-1)!, String(job.rate));
      const take = path.join(out, 'takes', folder, `${slug(job.text.text)}.wav`);
      const clip = path.join('clips', folder, `${slug(job.text.text)}.ogg`);
      try {
        if (!existsSync(take)) {
          const audio = await google.synthesize(job.text.text, voiceName(job.voice), job.rate);
          characters += job.text.text.length;
          await mkdir(path.dirname(take), { recursive: true });
          await writeFile(take, audio);
        }
        // A miss, not retried: how often a take comes back silent is part of what the test measures.
        if ((await peak(take)) < SILENT_PEAK_DB) {
          results.push({ source: job.label, text: job.text.text, file: path.relative(out, take), seconds: 0, silent: true });
          continue;
        }
        if (!existsSync(path.join(out, clip))) {
          await mkdir(path.dirname(path.join(out, clip)), { recursive: true });
          await postProcess(take, path.join(out, clip));
        }
        results.push({ source: job.label, text: job.text.text, file: clip, seconds: await duration(path.join(out, clip)) });
      } catch (error) {
        if (fatal(error)) stopped = true;
        else console.error(`Skipped "${job.text.text}" (${job.label}): ${(error as Error).message}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  if (stopped) return;

  // The same Speech-to-Text check on every clip; a transcript from an earlier run is reused.
  const checkQueue = [...results];
  const checker = async () => {
    for (let result = checkQueue.shift(); result && checking; result = checkQueue.shift()) {
      if (result.silent) continue;
      const cached = before[result.file];
      try {
        const transcript = cached?.transcript ?? (await google.transcribe(await toFlac(path.join(out, result.file))));
        result.transcript = transcript;
        result.wer = wordErrorRate(result.text, transcript);
      } catch (error) {
        if (error instanceof GoogleApiError && error.fatal) {
          checking = false;
          console.error(`Speech-to-Text refused the call, so the clips are not checked: ${error.message}\nEnable the Cloud Speech-to-Text API for the key's project, or run with --no-stt.`);
        } else console.error(`Not checked: "${result.text}" (${result.source}): ${(error as Error).message}`);
      }
    }
  };
  await Promise.all([checker(), checker(), checker()]);

  const order = [...new Set(results.filter((result) => result.source.startsWith(COURSE)).map((result) => result.source)), ...sources.map((source) => source.label)];
  results.sort((x, y) => order.indexOf(x.source) - order.indexOf(y.source) || TEST_TEXTS.findIndex((t) => t.text === x.text) - TEST_TEXTS.findIndex((t) => t.text === y.text));
  const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
  await mkdir(out, { recursive: true });
  await writeFile(resultsPath, `${JSON.stringify(Object.fromEntries(results.map((result) => [result.file, result])), null, 2)}\n`);
  // The course takes one column: its clips are voice a's or voice b's, by the text's voice.
  const columns = [COURSE, ...sources.map((source) => source.label)];
  const page = results.map((result) => (result.source.startsWith(COURSE) ? { ...result, source: COURSE } : result));
  await writeFile(path.join(out, 'index.html'), listeningPage(TEST_TEXTS, columns, page, when));
  await writeFile(path.join(out, 'report.md'), report(TEST_TEXTS, results, when, characters));
  for (const row of summarize(results)) {
    console.log(
      `${row.source.padEnd(28)} short ${percent(row.short.exact, row.short.total).padEnd(9)} sentences ${percent(row.sentences.close, row.sentences.total).padEnd(9)} silent ${row.silent}  pace ${row.pace?.toFixed(1) ?? '–'}`,
    );
  }
  console.log(`${characters} characters sent to Text-to-Speech. Listen in voice-test/index.html; the scores are in voice-test/report.md.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
