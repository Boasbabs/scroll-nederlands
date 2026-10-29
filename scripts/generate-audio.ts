// Generates the course's Dutch audio with Google Cloud Text-to-Speech (Chirp 3: HD
// voices), post-processes it with ffmpeg, checks it with Google Speech-to-Text and
// records it in src/audio/clips.json. Voices and settings are explained in
// docs/audio-research.md; clips the check flags are listed in docs/audio-qa.md.
//
//   pnpm audio:generate                   generate what is missing, verify, write the manifest
//   pnpm audio:generate --plan            count texts and characters per group; no API calls
//   pnpm audio:generate --encode          only make clips from the kept masters; no API calls
//   pnpm audio:generate --until answers   stop before a group (see GROUPS)
//   pnpm audio:generate --max-chars 20000 stop before this run bills more characters
//   pnpm audio:generate --verify all      speech-to-text check: all | short (default) | none
//   pnpm audio:generate --report          rewrite docs/audio-qa.md from stored checks; no API calls
//   pnpm audio:generate --prune           delete files in public/audio/ the manifest no longer uses
//   pnpm audio:generate --recorded        process human takes from recordings/ into src/audio/recorded.json
//                                         (see scripts/recordings.ts); no API calls
//
// Needs GOOGLE_CLOUD_API_KEY in .env.local (Cloud Text-to-Speech, plus Cloud
// Speech-to-Text for --verify) and ffmpeg on the PATH. The key is only sent in the
// request header. GOOGLE_TTS_ENDPOINT and GOOGLE_STT_ENDPOINT pick regional endpoints.
//
// Every take that speaks is kept as a lossless FLAC master in audio-masters/ (or the
// folder AUDIO_MASTERS_DIR names), outside public/ so it never ships, together with the
// speech-to-text results in checks.json. Google's takes differ each time, so the master
// is the take that was checked. A clip missing from public/ is made from its master when
// there is one, so a new encoding needs no API call. Back the folder up.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { clipKey, type ClipManifest, type ClipVoice } from '../src/audio/speech.ts';
import type { DialogueLine, Exercise, LessonDraft } from '../src/curriculum/types.ts';
import type { SoundContrast } from '../src/sounds/types.ts';
import type { WordTheme } from '../src/words/types.ts';
import { googleCloud, GoogleApiError } from './google-cloud.ts';
import { processRecordings, readRecorded, RECORDED_MANIFEST } from './recordings.ts';

/**
 * nl-NL Chirp 3: HD voices, chosen on the course's own texts (docs/audio-research.md): Erinome reads
 * everything but the second speaker of a dialogue, Algieba that speaker.
 */
export const VOICES: Record<ClipVoice, { id: string; name: string }> = {
  a: { id: 'nl-NL-Chirp3-HD-Erinome', name: 'Erinome' },
  b: { id: 'nl-NL-Chirp3-HD-Algieba', name: 'Algieba' },
};
/** Chirp 3: HD has no model setting of its own (the voice name picks it); the id names it in the manifest and the cache keys. */
export const MODEL: string = 'chirp3-hd';
/** Pace 1: at 0.9 the check heard the voices worse. */
export const SETTINGS = { speakingRate: 1 };
/** Bump when post-processing changes, so every clip is rebuilt from its master. */
const POST_VERSION = 2;
/**
 * ffmpeg's output options per file type: Opus 32 kbps in Ogg for a generated clip, MP3 for a human take.
 * bitexact leaves out the encoder's name, so the same master always makes the same file.
 */
const ENCODERS = {
  mp3: ['-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k'],
  ogg: ['-ar', '48000', '-ac', '1', '-c:a', 'libopus', '-b:a', '32k', '-application', 'audio', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact'],
};
/** A master is Google's take converted losslessly from its WAV, before any post-processing. */
const MASTER_EXT = 'flac';
const CONCURRENCY = 3;
/** A Text-to-Speech take peaks near full scale; one whose peak stays below this came back silent. */
export const SILENT_PEAK_DB = -30;
/** Takes asked for each spoken form of a text before the next form, or the browser's voice, takes over. */
export const TRIES = 5;

/**
 * Generation order by learning value, so a run stopped by the quota leaves the
 * most important groups complete: main phrases, learning items, the basic
 * words beside the course, the minimal pairs of ear training (until human
 * recordings replace them), listening exercises (listen-only items depend on
 * audio most), dialogue context of exercises, lesson dialogues, examples, and
 * last the model answers.
 */
export const GROUPS = ['target', 'items', 'words', 'pairs', 'audio', 'context', 'dialogue', 'examples', 'answers'] as const;
export type ClipGroup = (typeof GROUPS)[number];
export type ClipText = { text: string; voice: ClipVoice; group: ClipGroup };

type LessonLike = Pick<LessonDraft, 'targetPhrase' | 'items' | 'examples' | 'dialogue' | 'exercises'>;

/** Texts played outside the lessons: the word track's new words ("de vork") and their sentences, and every word of the minimal pairs. */
export type BesideTexts = { words: ReadonlyArray<string>; pairs: ReadonlyArray<string> };

/** The word track's own words (course words it refers to are lesson items already) and the pairs' words. */
export function besideTexts(themes: ReadonlyArray<WordTheme>, contrasts: ReadonlyArray<SoundContrast>): BesideTexts {
  return {
    // A tier-2 word's sentence is played on its card and in its gapped drill's answer.
    words: themes.flatMap((theme) => theme.words.flatMap((entry) => ('ref' in entry ? [] : [entry.dutch, ...(entry.example ? [entry.example.dutch] : [])]))),
    pairs: contrasts.flatMap((contrast) => contrast.pairs.flatMap((pair) => pair.map((word) => word.dutch))),
  };
}

/** The answer a learner sees after answering, read aloud. */
function modelAnswers(exercise: Exercise): Array<string> {
  switch (exercise.kind) {
    case 'cloze':
      return exercise.answers[0] ? [exercise.sentence.replace('___', exercise.answers[0])] : [];
    case 'order':
      return [exercise.words.join(' ')];
    case 'type':
      return exercise.answers[0] ? [exercise.answers[0]] : [];
    case 'write':
      return [exercise.modelAnswer];
    case 'match':
      return exercise.pairs.map((pair) => pair.dutch);
    case 'choice':
      return [];
  }
}

/**
 * Every Dutch text the course plays, keyed by clipKey(), in GROUPS order.
 * In a conversation the first speaker reads with voice a, the second with
 * voice b, and further speakers alternate (as speakDialogue() expects).
 */
export function collectClipTexts(lessons: ReadonlyArray<LessonLike>, beside: BesideTexts = { words: [], pairs: [] }): Array<ClipText> {
  const seen: Record<ClipVoice, Set<string>> = { a: new Set(), b: new Set() };
  const out: Array<ClipText> = [];
  const add = (group: ClipGroup, raw: string, voice: ClipVoice = 'a') => {
    const text = clipKey(raw);
    if (!/\p{L}/u.test(text) || seen[voice].has(text)) return;
    seen[voice].add(text);
    out.push({ text, voice, group });
  };
  const conversation = (group: ClipGroup, lines: ReadonlyArray<DialogueLine>) => {
    const speakers: Array<string> = [];
    for (const line of lines) {
      if (!speakers.includes(line.speaker)) speakers.push(line.speaker);
      add(group, line.dutch, speakers.indexOf(line.speaker) % 2 === 1 ? 'b' : 'a');
    }
  };
  // A text used in several places belongs to its most important group, so it is made early.
  const collect: Record<Exclude<ClipGroup, keyof BesideTexts>, (lesson: LessonLike) => void> = {
    target: (lesson) => add('target', lesson.targetPhrase),
    items: (lesson) => lesson.items.forEach((item) => add('items', item.dutch)),
    audio: (lesson) => lesson.exercises.forEach((exercise) => exercise.audioText && add('audio', exercise.audioText)),
    context: (lesson) => lesson.exercises.forEach((exercise) => exercise.context && conversation('context', exercise.context)),
    dialogue: (lesson) => lesson.dialogue && conversation('dialogue', lesson.dialogue),
    examples: (lesson) => (lesson.examples ?? []).forEach((example) => add('examples', example.dutch)),
    answers: (lesson) => lesson.exercises.forEach((exercise) => modelAnswers(exercise).forEach((text) => add('answers', text))),
  };
  for (const group of GROUPS) {
    if (group === 'words' || group === 'pairs') beside[group].forEach((text) => add(group, text));
    else lessons.forEach(collect[group]);
  }
  return out;
}

export type AudioManifest = ClipManifest & {
  voices: Record<ClipVoice, { id: string; name: string }>;
  model: string;
  settings: typeof SETTINGS;
  clipsB: Record<string, string>;
};

/** Up to three words: the check wants these back exactly. */
export const isShort = (text: string) => text.split(' ').length <= 3;
const hash = (value: unknown) => createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 16);

/**
 * What the voice is sent for a text. Every Chirp 3: HD voice reads letters joined by hyphens
 * ("Smith. S-M-I-T-H.") as the word, but reads letters set apart by commas one by one, so a
 * spelled name goes as "S, M, I, T, H.". The course shows, and the manifest keys, the text as written.
 */
export function spokenText(text: string): string {
  return text.replace(/(?<![\p{L}\p{N}-])\p{L}(?:-\p{L})+(?![\p{L}\p{N}-])/gu, (letters) => letters.split('-').join(', '));
}

/**
 * What the voice may be sent for a text, in the order tried. A single word goes bare first, and
 * then, if every take of it came back silent, as a sentence: "ja" as "Ja.". Google voices a
 * written word far more reliably (docs/audio-research.md), and Erinome never said a bare "ja".
 */
export function spokenForms(text: string): Array<string> {
  const spoken = spokenText(text);
  if (/\s/.test(spoken)) return [spoken];
  // Dutch capitalises the digraph ij as one letter: "IJs".
  const sentence = `${spoken.replace(/^(ij|\p{L})/u, (first) => first.toUpperCase())}${/[.!?]$/.test(spoken) ? '' : '.'}`;
  return sentence === spoken ? [spoken] : [spoken, sentence];
}

/** What the API's audio depends on: what was sent, to which voice. Post-processing is left out, so a new encoding reuses the masters. */
function synthesisInputs(clip: ClipText, sent: string): Array<unknown> {
  return [sent, VOICES[clip.voice].id, MODEL, SETTINGS];
}

/** The take as the API returned it (losslessly), in the masters folder, for what was sent (the first spoken form unless named). */
export function masterName(clip: ClipText, sent = spokenText(clip.text)): string {
  return `${hash(synthesisInputs(clip, sent))}.${MASTER_EXT}`;
}

/** The post-processed clip the extension plays, under public/, as a post-processing version writes it from what was sent. */
export function clipFile(clip: ClipText, version = POST_VERSION, sent = spokenText(clip.text)): string {
  return `audio/${hash([...synthesisInputs(clip, sent), version])}.ogg`;
}

/**
 * Where a clip comes from on this run, cheapest first: it is in public/ already, it can be made
 * from its master, or (the only case that calls the API) it is synthesized. Each spoken form is
 * looked for in turn, so a word its sentence form voiced is found again. `file` is the clip the
 * text plays once the run has made it, and `sent` the form it is made from.
 */
export type ClipPlan = { source: 'ready' | 'master' | 'synthesize'; file: string; sent: string };

export function planClip(clip: ClipText, has: { clip: (file: string) => boolean; master: (name: string) => boolean }): ClipPlan {
  const forms = spokenForms(clip.text);
  for (const sent of forms) {
    const file = clipFile(clip, POST_VERSION, sent);
    if (has.clip(file)) return { source: 'ready', file, sent };
    if (has.master(masterName(clip, sent))) return { source: 'master', file, sent };
  }
  return { source: 'synthesize', file: clipFile(clip), sent: forms[0]! };
}

/**
 * The clips a voice keeps from the manifest before this run, until the run makes its own: only
 * if the same model and voice made them, so a part never mixes two voices or two providers.
 */
export function keptClips(before: Partial<AudioManifest> | undefined, voice: ClipVoice): Record<string, string> {
  if (before?.model !== MODEL || before.voices?.[voice]?.id !== VOICES[voice].id) return {};
  return (voice === 'a' ? before.clips : before.clipsB) ?? {};
}

/**
 * Asks for takes of each spoken form in turn until one speaks, `tries` at most per form. Now and
 * then Google returns a quarter second of near silence for a one-word text; the ffmpeg chain would
 * amplify it into noise. `sent` is the form that spoke, `silent` counts the silent takes (each one
 * billed); no `take` means every try of every form was silent.
 */
export async function spokenTake<T>(
  forms: ReadonlyArray<string>,
  synthesize: (sent: string) => Promise<T>,
  peakOf: (take: T) => Promise<number>,
  tries = TRIES,
): Promise<{ sent?: string; take?: T; silent: number }> {
  let silent = 0;
  for (const sent of forms) {
    for (let tried = 0; tried < tries; tried++) {
      const take = await synthesize(sent);
      if ((await peakOf(take)) >= SILENT_PEAK_DB) return { sent, take, silent };
      silent++;
    }
  }
  return { silent };
}

// ---------------------------------------------------------------------------
// Everything below runs only when the script is executed.

// Resolved when the script runs (tests import this file from a non-file URL).
let root = '';
let manifestPath = '';
let qaPath = '';
let mastersDir = '';
const run = promisify(execFile);

/** Speech-to-Text refused a call: the run goes on making clips, unchecked. */
class CheckRefused extends Error {}

let client: ReturnType<typeof googleCloud> | undefined;
/** The Google client, made on the first call that needs it: --plan, --encode and --report need none. */
function google() {
  const key = process.env.GOOGLE_CLOUD_API_KEY;
  if (!key) throw new GoogleApiError('Set GOOGLE_CLOUD_API_KEY in .env.local (see "Google Chirp 3: HD test" in docs/audio-research.md).', true);
  client ??= googleCloud({ key, ttsEndpoint: process.env.GOOGLE_TTS_ENDPOINT || undefined, sttEndpoint: process.env.GOOGLE_STT_ENDPOINT || undefined });
  return client;
}

const load = (file: string) => import(pathToFileURL(path.join(root, file)).href);

async function loadBeside(): Promise<BesideTexts> {
  const { wordThemes } = (await load('src/words/content/index.ts')) as typeof import('../src/words/content/index.ts');
  const { contrasts } = (await load('src/sounds/pairs.ts')) as typeof import('../src/sounds/pairs.ts');
  return besideTexts(wordThemes, contrasts);
}

/** The course's lessons in order, then the scenario packs' scenes: in each group the course is voiced first. */
async function loadLessons(): Promise<Array<LessonDraft>> {
  const { curriculumStructure } = (await load('src/curriculum/structure.ts')) as typeof import('../src/curriculum/structure.ts');
  const { assembleCurriculum, flattenLessons } = (await load('src/curriculum/assemble.ts')) as typeof import('../src/curriculum/assemble.ts');
  const { packs } = (await load('src/packs/content/index.ts')) as typeof import('../src/packs/content/index.ts');
  const drafts = new Map<string, Array<LessonDraft>>();
  for (const stage of curriculumStructure) {
    for (const module of stage.modules) {
      const file = `src/curriculum/content/${stage.id}/${module.id}.ts`;
      if (!existsSync(path.join(root, file))) continue;
      drafts.set(module.id, ((await load(file)) as { lessons: Array<LessonDraft> }).lessons);
    }
  }
  const lessons = flattenLessons(assembleCurriculum(curriculumStructure, (_stage, moduleId) => drafts.get(moduleId) ?? []));
  return [...lessons, ...packs.flatMap((pack) => pack.scenes)];
}

/** The loudest sample of a file, in dB below full scale. */
export async function peak(file: string): Promise<number> {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect', '-f', 'null', '-']);
  return Number(/max_volume: (-?[\d.]+) dB/.exec(stderr)?.[1] ?? -Infinity);
}

/** Mono FLAC at 16 kHz, which Speech-to-Text v1 reads whatever the clip's own format. */
export async function toFlac(file: string): Promise<Buffer> {
  const { stdout } = await run('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '16000', '-c:a', 'flac', '-f', 'flac', 'pipe:1'], { encoding: 'buffer', maxBuffer: 50e6 });
  return stdout;
}

/**
 * Trims silence (keeps 50 ms before, 150 ms after), normalises to -18 LUFS, and encodes mono for the
 * output's type (ENCODERS): Opus for a generated clip (.ogg), MP3 for a human take (.mp3).
 */
export async function postProcess(raw: string, out: string): Promise<void> {
  const ext = path.extname(out).slice(1);
  if (!(ext in ENCODERS)) throw new Error(`no encoder for .${ext} files`);
  const encoder = ENCODERS[ext as keyof typeof ENCODERS];
  const trim = [
    'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05',
    'areverse',
    'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15',
    'areverse',
  ].join(',');
  const target = 'I=-18:TP=-1.5:LRA=11';
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', `${trim},loudnorm=${target}:print_format=json`, '-f', 'null', '-']);
  const measured = JSON.parse(stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1)) as Record<string, string>;
  const finite = ['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset'].every((name) => Number.isFinite(Number(measured[name])));
  // Linear two-pass normalisation keeps the speech dynamics; clips too short to measure use the one-pass filter.
  const loudnorm = finite
    ? `loudnorm=${target}:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`
    : `loudnorm=${target}`;
  const tmp = `${out}.tmp.${ext}`;
  try {
    await run('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', raw, '-af', `${trim},${loudnorm}`, ...encoder, tmp]);
    // Audio entirely under the silence threshold comes out as a file with no frames.
    if (!((await duration(tmp).catch(() => 0)) > 0.05)) throw new Error('nothing is left after trimming the silence: the audio is empty or too quiet');
  } catch (error) {
    // A half-written or empty file must not replace a good one or ship: nothing prunes the takes folder.
    await rm(tmp, { force: true });
    throw error;
  }
  await rename(tmp, out);
}

/** Generated clips the manifest no longer uses. Only files directly in public/audio/, so human takes in its recorded/ folder are never pruned. */
export function unusedClips(entries: ReadonlyArray<{ name: string; isFile(): boolean }>, used: ReadonlySet<string>): Array<string> {
  const isClip = (name: string) => Object.keys(ENCODERS).some((ext) => name.endsWith(`.${ext}`));
  return entries.filter((entry) => entry.isFile() && isClip(entry.name) && !used.has(entry.name)).map((entry) => entry.name);
}

// Speech-to-text check -------------------------------------------------------

type Check = { text: string; voice: ClipVoice; group: ClipGroup; file: string; transcript: string; wer: number; seconds?: number; flagged: boolean; retaken: boolean };

const UNITS = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien'];
const TENS = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig'];
function dutchNumber(n: number): string {
  if (n < 20) return UNITS[n]!;
  if (n < 100) {
    const unit = UNITS[n % 10]!;
    return n % 10 ? `${unit}${unit.endsWith('e') ? 'ën' : 'en'}${TENS[Math.floor(n / 10)]}` : TENS[n / 10]!;
  }
  if (n < 1000) return `${n >= 200 ? UNITS[Math.floor(n / 100)] : ''}honderd${n % 100 ? dutchNumber(n % 100) : ''}`;
  if (n < 10000) return `${n >= 2000 ? dutchNumber(Math.floor(n / 1000)) : ''}duizend${n % 1000 ? dutchNumber(n % 1000) : ''}`;
  return String(n);
}

/** "3.15" as a Dutch speaker says it: "kwart over drie", "half vier", "kwart voor vier", "drie". */
function clockTime(hour: number, minute: number): string {
  const next = (hour % 12) + 1;
  if (minute === 0) return ` ${hour} `;
  if (minute === 15) return ` kwart over ${hour % 12 || 12} `;
  if (minute === 30) return ` half ${next} `;
  if (minute === 45) return ` kwart voor ${next} `;
  return ` ${hour} ${minute} `;
}

/** Lower-case words without punctuation or accents, numbers spelled out ("€18,50" = "achttien euro vijftig"). */
export function normaliseWords(text: string): Array<string> {
  return text
    .toLowerCase()
    .replace(/€\s?(\d+),(\d{2})/g, '$1 euro $2')
    .replace(/€\s?(\d+)/g, '$1 euro')
    .replace(/(\d+),(\d{2})\s?euro/g, '$1 euro $2')
    .replace(/(\d{1,2})[:.](\d{2})/g, (_, h: string, m: string) => clockTime(Number(h), Number(m)))
    .replace(/\d+/g, (digits) => ` ${dutchNumber(Number(digits))} `)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    // "ij" and "ei" sound the same, so a transcript cannot tell them apart.
    .replace(/ij/g, 'ei')
    .split(/\s+/)
    .filter((word) => word && word !== 'uur')
    .map((word) => (word === 't' ? 'het' : word));
}

export function wordErrorRate(reference: string, hypothesis: string): number {
  const ref = normaliseWords(reference);
  const hyp = normaliseWords(hypothesis);
  if (ref.length === 0) return hyp.length ? 1 : 0;
  // Compounds written apart or together ("opengaan" / "open gaan") are the same speech.
  if (ref.join('') === hyp.join('')) return 0;
  let previous = Array.from({ length: hyp.length + 1 }, (_, j) => j);
  for (let i = 1; i <= ref.length; i++) {
    const current = [i];
    for (let j = 1; j <= hyp.length; j++) {
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[hyp.length]! / ref.length;
}

/** What Speech-to-Text (v1, Dutch forced: detection is unreliable on one- and two-word clips) hears in a clip. */
async function transcribe(file: string): Promise<string> {
  const flac = await toFlac(file);
  try {
    return await google().transcribe(flac, 'nl-NL');
  } catch (error) {
    throw error instanceof GoogleApiError && error.fatal ? new CheckRefused(error.message) : error;
  }
}

/**
 * Short texts must round-trip exactly and longer ones may differ by one word in
 * five. A clip far longer or shorter than its text (a repeat or a cut-off) is
 * flagged whatever the transcript says.
 */
export function isFlagged(text: string, wer: number, seconds: number): boolean {
  const letters = text.replace(/[^\p{L}\p{N}]/gu, '').length;
  if (seconds > 2 + letters * 0.15 || seconds < letters * 0.025) return true;
  return wer > (isShort(text) ? 0 : 0.2);
}

export async function duration(file: string): Promise<number> {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return Number(stdout.trim());
}

// Main -----------------------------------------------------------------------

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

/** Runs `task` over `items` with a few requests in flight; stops picking new items once `halt()` is true. */
async function pool<T>(items: ReadonlyArray<T>, halt: () => boolean, task: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const worker = async () => {
    for (let item = queue.shift(); item !== undefined && !halt(); item = queue.shift()) await task(item);
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

async function main() {
  root = fileURLToPath(new URL('..', import.meta.url));
  manifestPath = path.join(root, 'src/audio/clips.json');
  qaPath = path.join(root, 'docs/audio-qa.md');
  const planOnly = process.argv.includes('--plan');
  const encodeOnly = process.argv.includes('--encode');
  const until = option('--until') as ClipGroup | undefined;
  const maxChars = Number(option('--max-chars') ?? Infinity);
  // --encode never calls the API, so it checks nothing either.
  const verify = encodeOnly ? 'none' : (option('--verify') ?? 'short');
  if (until && !GROUPS.includes(until)) throw new Error(`--until takes one of ${GROUPS.join(', ')}`);
  mastersDir = path.resolve(root, process.env.AUDIO_MASTERS_DIR || 'audio-masters');

  const beside = await loadBeside();
  const all = collectClipTexts(await loadLessons(), beside);
  const pairWords = new Set(beside.pairs.map(clipKey));
  if (process.argv.includes('--recorded')) return processTakes(all, pairWords);
  const plan = (clip: ClipText) =>
    planClip(clip, { clip: (file) => existsSync(path.join(root, 'public', file)), master: (name) => existsSync(path.join(mastersDir, name)) });
  const groups = until ? GROUPS.slice(0, GROUPS.indexOf(until)) : GROUPS;
  // Google bills the characters sent, so these count the spoken text.
  const chars = (clips: ReadonlyArray<ClipText>) => clips.reduce((sum, clip) => sum + spokenText(clip.text).length, 0);
  console.log(`${all.length} texts (${all.filter((c) => c.voice === 'b').length} for voice b), ${chars(all)} characters in all.`);
  for (const group of GROUPS) {
    const clips = all.filter((clip) => clip.group === group);
    const sources = clips.map((clip) => plan(clip).source);
    const todo = clips.filter((_, i) => sources[i] === 'synthesize');
    const fromMasters = sources.filter((source) => source === 'master').length;
    console.log(
      `  ${group.padEnd(9)} ${String(clips.length).padStart(5)} texts ${String(chars(clips)).padStart(7)} chars; to generate ${todo.length} (${chars(todo)} chars)${fromMasters ? `; to make from masters ${fromMasters}` : ''}`,
    );
  }
  const masters = existsSync(mastersDir) ? (await readdir(mastersDir)).filter((name) => name.endsWith(`.${MASTER_EXT}`)).length : 0;
  console.log(`Masters kept in ${mastersDir.startsWith(root) ? path.relative(root, mastersDir) : mastersDir}: ${masters}.`);
  const recorded = (await readRecorded(root)).takes;
  console.log(`Human takes (played before clips): ${[...pairWords].filter((word) => recorded[word]?.length).length} of ${pairWords.size} pair words.`);
  if (planOnly) return;
  const reportOnly = process.argv.includes('--report');

  await mkdir(path.join(root, 'public/audio'), { recursive: true });
  await mkdir(mastersDir, { recursive: true });
  const manifest: AudioManifest = { voices: VOICES, model: MODEL, settings: SETTINGS, clips: {}, clipsB: {} };
  const register = (clip: ClipText, file: string) => {
    (clip.voice === 'a' ? manifest.clips : manifest.clipsB)[clip.text] = file;
  };
  const registered = (clip: ClipText): string | undefined => (clip.voice === 'a' ? manifest.clips : manifest.clipsB)[clip.text];
  const at = (file: string) => path.join(root, 'public', file);
  // Saved after every clip (sorted keys keep diffs small), so a run stopped by quota or network errors resumes.
  let saving = Promise.resolve();
  const save = () => {
    const sorted = (record: Record<string, string>) => Object.fromEntries(Object.entries(record).sort(([x], [y]) => x.localeCompare(y)));
    const data = { ...manifest, clips: sorted(manifest.clips), clipsB: sorted(manifest.clipsB) };
    saving = saving.then(async () => {
      await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(data, null, 2)}\n`);
      await rename(`${manifestPath}.tmp`, manifestPath);
    });
    return saving;
  };
  // Until this run makes a text's own clip, the text keeps the one it has: a run that stops early, or
  // --encode, must not silence it. That may be another text's clip that sounds the same ("hoelang").
  // Only clips of the same model and voice stay (keptClips), so a part never mixes two voices.
  const before: Partial<AudioManifest> | undefined = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : undefined;
  const kept = { a: keptClips(before, 'a'), b: keptClips(before, 'b') };
  for (const clip of all) {
    const { source, file } = plan(clip);
    const old = kept[clip.voice][clip.text];
    if (source === 'ready') register(clip, file);
    else if (old && existsSync(at(old))) register(clip, old);
  }
  await save();

  let billed = 0;
  let silentTakes = 0;
  let stopped: string | undefined;
  let checking = verify !== 'none';
  /** Texts this run tried and could not voice, with why: the browser's voice reads them. */
  const missed = new Map<ClipText, string>();
  const cachePath = path.join(mastersDir, 'checks.json');
  const checks: Record<string, Check> = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : {};
  // Short items always; a fixed 10% sample of the rest unless --verify all. The sample follows the master, so it stays with the encoding.
  const sampled = (clip: ClipText) => verify === 'all' || isShort(clip.text) || Number.parseInt(masterName(clip).slice(0, 4), 16) % 10 === 0;

  /** Makes the clip from the master of what was sent: no API call. */
  const encode = (clip: ClipText, sent: string) => postProcess(path.join(mastersDir, masterName(clip, sent)), at(clipFile(clip, POST_VERSION, sent)));
  /**
   * Asks for takes until one speaks, keeps it losslessly as the master of what was sent (a retake
   * replaces it) and makes the clip from it. Returns the clip, or nothing when every take of every
   * spoken form came back silent: then nothing is kept.
   */
  const generate = async (clip: ClipText): Promise<string | undefined> => {
    const temp = path.join(mastersDir, masterName(clip));
    const [wav, flac] = [`${temp}.tmp.wav`, `${temp}.tmp.flac`];
    try {
      const { sent, take, silent } = await spokenTake(spokenForms(clip.text), async (text) => {
        const audio = await google().synthesize(text, VOICES[clip.voice].id, SETTINGS.speakingRate);
        billed += text.length;
        await writeFile(wav, audio);
        return wav;
      }, peak);
      silentTakes += silent;
      if (!take || sent === undefined) return undefined;
      await run('ffmpeg', ['-v', 'error', '-y', '-i', take, '-c:a', 'flac', flac]);
      // The clip first, then the master, so the two always hold the same take.
      const file = clipFile(clip, POST_VERSION, sent);
      await postProcess(flac, at(file));
      await rename(flac, path.join(mastersDir, masterName(clip, sent)));
      return file;
    } finally {
      await rm(wav, { force: true });
      await rm(flac, { force: true });
    }
  };
  const fail = (error: unknown, what: string) => {
    if (error instanceof CheckRefused) {
      if (checking) console.error(`Speech-to-Text refused the call, so clips are made but not checked: ${error.message}`);
      checking = false;
    } else if (error instanceof GoogleApiError && error.fatal) stopped = error.message;
    else console.error(`Skipped ${what}: ${(error as Error).message}`);
  };
  const check = async (clip: ClipText) => {
    let file = registered(clip) ?? clipFile(clip);
    try {
      let transcript = await transcribe(at(file));
      let wer = wordErrorRate(clip.text, transcript);
      let retaken = false;
      // One retake (Google's takes differ each time), then a human listens.
      const retake = isFlagged(clip.text, wer, await duration(at(file))) ? await generate(clip) : undefined;
      if (retake) {
        file = retake;
        register(clip, file);
        await save();
        transcript = await transcribe(at(file));
        wer = wordErrorRate(clip.text, transcript);
        retaken = true;
      }
      const seconds = await duration(at(file));
      checks[file] = { ...clip, file, transcript, wer, seconds, flagged: isFlagged(clip.text, wer, seconds), retaken };
      await writeFile(cachePath, JSON.stringify(checks));
    } catch (error) {
      fail(error, `the check of "${clip.text}"`);
    }
  };

  // Group by group, each checked right after it is generated, so a quota stop leaves finished, checked groups.
  let generated = 0;
  let encoded = 0;
  for (const group of reportOnly ? [] : groups) {
    const fresh: Array<ClipText> = [];
    let fromMasters = 0;
    const todo = all.filter((clip) => {
      const { source } = plan(clip);
      return clip.group === group && (source === 'master' || source === 'synthesize');
    });
    await pool(todo, () => Boolean(stopped), async (clip) => {
      const { source, file, sent } = plan(clip);
      if (source === 'synthesize' && encodeOnly) return;
      if (source === 'synthesize' && billed + sent.length > maxChars) {
        stopped = `--max-chars ${maxChars} reached`;
        return;
      }
      try {
        if (source === 'master') {
          await encode(clip, sent);
          fromMasters++;
          encoded++;
          register(clip, file);
        } else {
          const made = await generate(clip);
          if (!made) {
            missed.set(clip, `silent on all ${spokenForms(clip.text).length * TRIES} takes (${spokenForms(clip.text).join(', ')})`);
            return;
          }
          fresh.push(clip);
          register(clip, made);
          if (++generated % 100 === 0) console.log(`${generated} clips, ${billed} characters billed`);
        }
        await save();
      } catch (error) {
        missed.set(clip, (error as Error).message);
        fail(error, `"${clip.text}"`);
      }
    });
    const recheck = process.argv.includes('--recheck')
      ? all.filter((clip) => {
          const file = registered(clip);
          return clip.group === group && file !== undefined && !checks[file];
        })
      : [];
    const toCheck = [...new Set([...fresh, ...recheck])].filter(sampled);
    if (checking && toCheck.length) await pool(toCheck, () => !checking || Boolean(stopped && !stopped.startsWith('--max-chars')), check);
    console.log(`${group}: ${fresh.length} generated, ${fromMasters} made from masters, ${toCheck.length} to check; ${billed} characters billed so far`);
    if (stopped) break;
  }
  await save();
  await saving;
  console.log(
    `Generated ${generated} clips, ${billed} characters billed (${silentTakes} of them silent takes, asked again); made ${encoded} from masters. Manifest: ${Object.keys(manifest.clips).length} a, ${Object.keys(manifest.clipsB).length} b.`,
  );
  if (encodeOnly) {
    const waiting = all.filter((clip) => plan(clip).source === 'synthesize').length;
    if (waiting) console.log(`${waiting} texts have no master yet: run without --encode to generate them.`);
  }
  const unvoiced = all.filter((clip) => !registered(clip)).map((clip) => ({ ...clip, why: missed.get(clip) }));
  for (const clip of unvoiced) if (clip.why) console.log(`No clip for "${clip.text}" (${clip.voice}): ${clip.why}. The browser's voice reads it.`);
  if (verify !== 'none') {
    const coverage = `${Object.keys(manifest.clips).length} for voice a and ${Object.keys(manifest.clipsB).length} for voice b, of ${all.length} course texts`;
    await writeQa(
      all.flatMap((clip) => {
        const file = registered(clip);
        return file && checks[file] ? [checks[file]] : [];
      }),
      coverage,
      unvoiced,
    );
  }
  if (stopped) {
    console.error(`Stopped: ${stopped}. Clips made so far are saved; run the same command again to continue.`);
    process.exitCode = 1;
  }
  if (process.argv.includes('--prune') && !stopped) {
    const used = new Set([...Object.values(manifest.clips), ...Object.values(manifest.clipsB)].map((file) => path.basename(file)));
    const orphans = unusedClips(await readdir(path.join(root, 'public/audio'), { withFileTypes: true }), used);
    for (const name of orphans) await rm(path.join(root, 'public/audio', name));
    console.log(`Pruned ${orphans.length} unused clips.`);
  }
}

/** --recorded: human takes through the ffmpeg chain into src/audio/recorded.json. No API calls. */
async function processTakes(all: ReadonlyArray<ClipText>, pairWords: ReadonlySet<string>) {
  const report = await processRecordings({ root, texts: all.map((clip) => clip.text), convert: postProcess });
  for (const take of report.unknown) console.error(`Skipped ${take}: its name is not a text the course plays.`);
  for (const { take, error } of report.failed) console.error(`Could not process ${take}: ${error}`);
  for (const text of report.stale) console.error(`Left out "${text}": the course no longer plays it.`);
  const takes = report.manifest.takes;
  const covered = [...pairWords].filter((word) => takes[word]?.length).length;
  const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;
  console.log(
    `Processed ${count(report.processed.length, 'take')}. ${RECORDED_MANIFEST}: ${count(Object.values(takes).flat().length, 'take')} of ${count(Object.keys(takes).length, 'text')}, covering ${covered} of ${pairWords.size} pair words.`,
  );
  if (report.unknown.length || report.failed.length) process.exitCode = 1;
}

async function writeQa(stored: Array<Check>, coverage: string, unvoiced: ReadonlyArray<ClipText & { why?: string }>) {
  // Re-score stored transcripts with the current rules, so a rule fix does not need new STT calls.
  const checks: Array<Check> = [];
  for (const check of stored) {
    const seconds = check.seconds ?? (await duration(path.join(root, 'public', check.file)));
    const wer = wordErrorRate(check.text, check.transcript);
    checks.push({ ...check, seconds, wer, flagged: isFlagged(check.text, wer, seconds) });
  }
  const flagged = checks.filter((check) => check.flagged);
  const retaken = checks.filter((check) => check.retaken);
  const tried = unvoiced.filter((clip) => clip.why);
  const untried = unvoiced.length - tried.length;
  const cell = (text: string) => text.replace(/\|/g, '\\|');
  const lines = [
    '# Audio QA',
    '',
    `Speech-to-text check of the clips made by \`pnpm audio:generate\` (Google Speech-to-Text v1, Dutch (nl-NL) forced, last run ${new Date().toISOString().slice(0, 10)}). Checked: every text of up to 3 words and a fixed 10% sample of longer ones. A clip is flagged when a short text does not round-trip exactly (after lower-casing, removing punctuation and accents, spelling out numbers and clock times, and treating "ij" and "ei" as the same sound), when a longer text has a word error rate above 0.2, or when its length does not fit its text. A flagged clip is regenerated once (Google's takes differ each time) and checked again. STT cannot judge accent, and it often mishears isolated sounds and one-syllable words (isolated "man" and "maan" for every voice), so the list below is a listening list, not a list of errors.`,
    '',
    `- Clips checked: ${checks.length} (${checks.filter((c) => isShort(c.text)).length} short, ${checks.filter((c) => !isShort(c.text)).length} longer)`,
    `- Flagged on the first take and regenerated: ${retaken.length}`,
    `- Still flagged after the retake (need a human listen): ${flagged.length}`,
    `- Clips in the manifest: ${coverage}`,
    `- Course texts with no clip (the browser's voice reads them): ${unvoiced.length}`,
    '',
    '## Still flagged',
    '',
    flagged.length ? '| Text | Voice | Group | Transcript | WER | File |' : 'None.',
    ...(flagged.length ? ['|---|---|---|---|---|---|'] : []),
    ...flagged.map((c) => `| ${cell(c.text)} | ${c.voice} | ${c.group} | ${cell(c.transcript)} | ${c.wer.toFixed(2)} | \`${c.file}\` |`),
    '',
    '## Fixed by the retake',
    '',
    retaken.filter((c) => !c.flagged).map((c) => `- "${c.text}" (${c.voice}, ${c.group})`).join('\n') || 'None.',
    '',
    '## No clip',
    '',
    tried.map((c) => `- "${c.text}" (${c.voice}, ${c.group}): ${c.why}`).join('\n') || (untried ? 'None of the texts this run tried.' : 'None: every course text has a clip.'),
    // A run stopped early leaves whole groups untried: those are counted, not listed.
    ...(untried ? ['', `${untried} more not tried on this run (it stopped early, or ran with --until or --report): \`pnpm audio:generate\` makes them.`] : []),
    '',
  ];
  await writeFile(qaPath, lines.join('\n'));
  console.log(`Checked ${checks.length} clips: ${retaken.length} retaken, ${flagged.length} still flagged (see docs/audio-qa.md).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
