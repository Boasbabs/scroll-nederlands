// Generates the course's Dutch audio with ElevenLabs, post-processes it with
// ffmpeg, checks it with ElevenLabs speech-to-text and records it in
// src/audio/clips.json. Voice, model and settings are explained in
// docs/audio-research.md; clips the check flags are listed in docs/audio-qa.md.
//
//   pnpm audio:generate                   generate what is missing, verify, write the manifest
//   pnpm audio:generate --plan            count texts and characters per group; no API calls
//   pnpm audio:generate --until answers   stop before a group (see GROUPS)
//   pnpm audio:generate --max-chars 20000 stop before this run bills more characters
//   pnpm audio:generate --verify all      speech-to-text check: all | short (default) | none
//   pnpm audio:generate --report          rewrite docs/audio-qa.md from stored checks; no API calls
//   pnpm audio:generate --prune           delete files in public/audio/ the manifest no longer uses
//   pnpm audio:generate --recorded        process human takes from recordings/ into src/audio/recorded.json
//                                         (see scripts/recordings.ts); no API calls
//
// Needs ELEVENLABS_API_KEY in .env.local (Text to Speech, plus Speech to Text for
// --verify) and ffmpeg on the PATH. The key is only sent in the request header.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { clipKey, type ClipManifest, type ClipVoice } from '../src/audio/speech.ts';
import type { DialogueLine, Exercise, LessonDraft } from '../src/curriculum/types.ts';
import type { SoundContrast } from '../src/sounds/types.ts';
import type { WordTheme } from '../src/words/types.ts';
import { processRecordings, readRecorded, RECORDED_MANIFEST } from './recordings.ts';

/** Both nl-NL library voices bill 1x per character and have a 2-year notice period (docs/audio-research.md). */
export const VOICES: Record<ClipVoice, { id: string; name: string }> = {
  a: { id: 'UNBIyLbtFB9k7FKW8wJv', name: 'Serge de Beer' },
  b: { id: '7qdUFMklKPaaAVMsBTBt', name: 'Roos' },
};
/** v4 with language_code "nl"; it has no speed setting, and its natural pace is already slower than v2 at 0.9. */
export const MODEL: string = 'eleven_v4';
export const SETTINGS: Record<string, number | boolean> = { stability: 0.5, similarity_boost: 0.75 };
/** Spoken context for very short texts: steers the model to Dutch without being read aloud (and is not billed). */
const SHORT_CONTEXT = 'Luister en herhaal:';
/** Bump when post-processing changes, so every clip is rebuilt. */
const POST_VERSION = 1;
const SOURCE_FORMAT = 'mp3_44100_128';
const CONCURRENCY = 3;

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

/** Texts played outside the lessons: the word track's new words ("de vork") and every word of the minimal pairs. */
export type BesideTexts = { words: ReadonlyArray<string>; pairs: ReadonlyArray<string> };

/** The word track's own words (course words it refers to are lesson items already) and the pairs' words. */
export function besideTexts(themes: ReadonlyArray<WordTheme>, contrasts: ReadonlyArray<SoundContrast>): BesideTexts {
  return {
    words: themes.flatMap((theme) => theme.words.flatMap((entry) => ('ref' in entry ? [] : [entry.dutch]))),
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

const isShort = (text: string) => text.split(' ').length <= 3;
const seedFor = (clip: ClipText) => Number.parseInt(clipFile(clip).slice(6, 14), 16) % 4294967295;

function clipFile(clip: ClipText): string {
  const short = MODEL === 'eleven_multilingual_v2' && isShort(clip.text);
  const hash = createHash('sha1')
    .update(JSON.stringify([clip.text, VOICES[clip.voice].id, MODEL, SETTINGS, short ? SHORT_CONTEXT : null, POST_VERSION]))
    .digest('hex');
  return `audio/${hash.slice(0, 16)}.mp3`;
}

// ---------------------------------------------------------------------------
// Everything below runs only when the script is executed.

// Resolved when the script runs (tests import this file from a non-file URL).
let root = '';
let manifestPath = '';
let qaPath = '';
const work = path.join(os.tmpdir(), 'taalnudge-audio');
const run = promisify(execFile);

class FatalApiError extends Error {}

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

async function elevenlabs(pathname: string, init: { json?: unknown; form?: FormData; query?: Record<string, string> }): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new FatalApiError('Set ELEVENLABS_API_KEY in .env.local.');
  const url = new URL(pathname, 'https://api.elevenlabs.io');
  for (const [name, value] of Object.entries(init.query ?? {})) url.searchParams.set(name, value);
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': key, ...(init.json ? { 'Content-Type': 'application/json' } : {}) },
      body: init.json ? JSON.stringify(init.json) : init.form,
    });
    if (response.ok) return response;
    const body = (await response.text()).split(key).join('<key>');
    // Rate limits and server errors are usually temporary; auth, permission and quota errors are not.
    if ((response.status === 429 && !body.includes('quota')) || response.status >= 500) {
      if (attempt < 7) {
        const retryAfter = Number(response.headers.get('retry-after'));
        const wait = retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 500 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }
    }
    const fatal = [401, 402, 403].includes(response.status) || /quota|authentication_error|missing_permissions/.test(body);
    throw new (fatal ? FatalApiError : Error)(`${response.status} ${body.slice(0, 300)}`);
  }
}

async function synthesize(clip: ClipText, seed: number): Promise<{ audio: Buffer; cost: number }> {
  const body: Record<string, unknown> = { text: clip.text, model_id: MODEL, voice_settings: SETTINGS, seed };
  if (MODEL === 'eleven_multilingual_v2') {
    if (isShort(clip.text)) body.previous_text = SHORT_CONTEXT;
  } else body.language_code = 'nl';
  const response = await elevenlabs(`/v1/text-to-speech/${VOICES[clip.voice].id}`, { json: body, query: { output_format: SOURCE_FORMAT } });
  const cost = Number(response.headers.get('character-cost') ?? clip.text.length);
  return { audio: Buffer.from(await response.arrayBuffer()), cost };
}

/**
 * Trims silence (keeps 50 ms before, 150 ms after), normalises to -18 LUFS, encodes mono MP3 64 kbps 44.1 kHz.
 * Generated clips and human takes both go through it.
 */
export async function postProcess(raw: string, out: string): Promise<void> {
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
  const tmp = `${out}.tmp.mp3`;
  try {
    await run('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', raw, '-af', `${trim},${loudnorm}`, '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', tmp]);
    // Audio entirely under the silence threshold comes out as an MP3 with no frames.
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
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.mp3') && !used.has(entry.name)).map((entry) => entry.name);
}

// Speech-to-text check -------------------------------------------------------

type Check = { text: string; voice: ClipVoice; group: ClipGroup; file: string; transcript: string; language: string; probability: number; wer: number; seconds?: number; flagged: boolean; retaken: boolean };

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

async function transcribe(file: string): Promise<{ text: string; language: string; probability: number }> {
  const form = new FormData();
  form.append('model_id', 'scribe_v2');
  // Forced Dutch: language auto-detection is unreliable on one- and two-word clips.
  form.append('language_code', 'nld');
  form.append('tag_audio_events', 'false');
  form.append('file', new Blob([await readFile(file)], { type: 'audio/mpeg' }), path.basename(file));
  const response = await elevenlabs('/v1/speech-to-text', { form });
  const body = (await response.json()) as { text: string; language_code: string; language_probability: number };
  return { text: body.text, language: body.language_code, probability: body.language_probability };
}

/**
 * Short texts must round-trip exactly and longer ones may differ by one word in
 * five. A clip far longer or shorter than its text (a repeat or a cut-off) is
 * flagged whatever the transcript says.
 */
function isFlagged(text: string, wer: number, seconds: number): boolean {
  const letters = text.replace(/[^\p{L}\p{N}]/gu, '').length;
  if (seconds > 2 + letters * 0.15 || seconds < letters * 0.025) return true;
  return wer > (isShort(text) ? 0 : 0.2);
}

async function duration(file: string): Promise<number> {
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
  const until = option('--until') as ClipGroup | undefined;
  const maxChars = Number(option('--max-chars') ?? Infinity);
  const verify = option('--verify') ?? 'short';
  if (until && !GROUPS.includes(until)) throw new Error(`--until takes one of ${GROUPS.join(', ')}`);

  const beside = await loadBeside();
  const all = collectClipTexts(await loadLessons(), beside);
  const pairWords = new Set(beside.pairs.map(clipKey));
  if (process.argv.includes('--recorded')) return processTakes(all, pairWords);
  const exists = (clip: ClipText) => existsSync(path.join(root, 'public', clipFile(clip)));
  const groups = until ? GROUPS.slice(0, GROUPS.indexOf(until)) : GROUPS;
  console.log(`${all.length} texts (${all.filter((c) => c.voice === 'b').length} for voice b), ${all.reduce((s, c) => s + c.text.length, 0)} characters in all.`);
  for (const group of GROUPS) {
    const clips = all.filter((clip) => clip.group === group);
    const todo = clips.filter((clip) => !exists(clip));
    console.log(`  ${group.padEnd(9)} ${String(clips.length).padStart(5)} texts ${String(clips.reduce((s, c) => s + c.text.length, 0)).padStart(7)} chars; to generate ${todo.length} (${todo.reduce((s, c) => s + c.text.length, 0)} chars)`);
  }
  const recorded = (await readRecorded(root)).takes;
  console.log(`Human takes (played before clips): ${[...pairWords].filter((word) => recorded[word]?.length).length} of ${pairWords.size} pair words.`);
  if (planOnly) return;
  const reportOnly = process.argv.includes('--report');

  await mkdir(path.join(root, 'public/audio'), { recursive: true });
  await mkdir(work, { recursive: true });
  const manifest: AudioManifest = { voices: VOICES, model: MODEL, settings: SETTINGS, clips: {}, clipsB: {} };
  const register = (clip: ClipText) => {
    (clip.voice === 'a' ? manifest.clips : manifest.clipsB)[clip.text] = clipFile(clip);
  };
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
  for (const clip of all) if (exists(clip)) register(clip);
  await save();

  let billed = 0;
  let stopped: string | undefined;
  let checking = verify !== 'none';
  const cachePath = path.join(work, 'checks.json');
  const checks: Record<string, Check> = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : {};
  // Short items always; a fixed 10% sample of the rest unless --verify all.
  const sampled = (clip: ClipText) => verify === 'all' || isShort(clip.text) || Number.parseInt(clipFile(clip).slice(6, 10), 16) % 10 === 0;

  const generate = async (clip: ClipText, seed: number) => {
    const { audio, cost } = await synthesize(clip, seed);
    billed += cost;
    const raw = path.join(work, `${path.basename(clipFile(clip), '.mp3')}.raw.mp3`);
    await writeFile(raw, audio);
    await postProcess(raw, path.join(root, 'public', clipFile(clip)));
    await rm(raw, { force: true });
  };
  const fail = (error: unknown, what: string) => {
    if (!(error instanceof FatalApiError)) return console.error(`Skipped ${what}: ${(error as Error).message}`);
    if (/speech_to_text/.test(error.message)) {
      checking = false;
      console.error('This key may not use Speech to Text: clips are generated but not checked.');
    } else stopped = error.message;
  };
  const check = async (clip: ClipText) => {
    const file = path.join(root, 'public', clipFile(clip));
    try {
      let result = await transcribe(file);
      let wer = wordErrorRate(clip.text, result.text);
      let retaken = false;
      if (isFlagged(clip.text, wer, await duration(file))) {
        // One retake with another seed, then a human listens.
        await generate(clip, (seedFor(clip) + 1) % 4294967295);
        result = await transcribe(file);
        wer = wordErrorRate(clip.text, result.text);
        retaken = true;
      }
      const seconds = await duration(file);
      const flagged = isFlagged(clip.text, wer, seconds);
      checks[clipFile(clip)] = { ...clip, file: clipFile(clip), transcript: result.text, language: result.language, probability: result.probability, wer, seconds, flagged, retaken };
      await writeFile(cachePath, JSON.stringify(checks));
    } catch (error) {
      fail(error, `the check of "${clip.text}"`);
    }
  };

  // Group by group, each checked right after it is generated, so a quota stop leaves finished, checked groups.
  let made = 0;
  for (const group of reportOnly ? [] : groups) {
    const fresh: Array<ClipText> = [];
    const todo = all.filter((clip) => clip.group === group && !exists(clip));
    await pool(todo, () => Boolean(stopped), async (clip) => {
      if (billed + clip.text.length > maxChars) {
        stopped = `--max-chars ${maxChars} reached`;
        return;
      }
      try {
        await generate(clip, seedFor(clip));
        register(clip);
        fresh.push(clip);
        await save();
        if (++made % 100 === 0) console.log(`${made} clips, ${billed} characters billed`);
      } catch (error) {
        fail(error, `"${clip.text}"`);
      }
    });
    const recheck = process.argv.includes('--recheck') ? all.filter((clip) => clip.group === group && exists(clip) && !checks[clipFile(clip)]) : [];
    const toCheck = [...new Set([...fresh, ...recheck])].filter(sampled);
    if (checking && toCheck.length) await pool(toCheck, () => !checking || Boolean(stopped && !stopped.startsWith('--max-chars')), check);
    console.log(`${group}: ${fresh.length} generated, ${toCheck.length} to check; ${billed} characters billed so far`);
    if (stopped) break;
  }
  await save();
  await saving;
  console.log(`Generated ${made} clips, ${billed} characters billed. Manifest: ${Object.keys(manifest.clips).length} a, ${Object.keys(manifest.clipsB).length} b.`);
  if (verify !== 'none') {
    const current = all.filter((clip) => (clip.voice === 'a' ? manifest.clips : manifest.clipsB)[clip.text] === clipFile(clip));
    const coverage = `${Object.keys(manifest.clips).length} for voice a and ${Object.keys(manifest.clipsB).length} for voice b, of ${all.length} course texts`;
    await writeQa(current.flatMap((clip) => checks[clipFile(clip)] ?? []), coverage);
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

async function writeQa(stored: Array<Check>, coverage: string) {
  // Re-score stored transcripts with the current rules, so a rule fix does not need new STT calls.
  const checks: Array<Check> = [];
  for (const check of stored) {
    const seconds = check.seconds ?? (await duration(path.join(root, 'public', check.file)));
    const wer = wordErrorRate(check.text, check.transcript);
    checks.push({ ...check, seconds, wer, flagged: isFlagged(check.text, wer, seconds) });
  }
  const flagged = checks.filter((check) => check.flagged);
  const retaken = checks.filter((check) => check.retaken);
  const cell = (text: string) => text.replace(/\|/g, '\\|');
  const lines = [
    '# Audio QA',
    '',
    `Speech-to-text check of the clips made by \`pnpm audio:generate\` (Scribe v2, Dutch forced, last run ${new Date().toISOString().slice(0, 10)}). Checked: every text of up to 3 words and a fixed 10% sample of longer ones. A clip is flagged when a short text does not round-trip exactly (after lower-casing, removing punctuation and accents, spelling out numbers and clock times, and treating "ij" and "ei" as the same sound), when a longer text has a word error rate above 0.2, or when its length does not fit its text. A flagged clip is regenerated once with another seed and checked again. STT cannot judge accent, and it often mishears isolated sounds and one-syllable words, so the list below is a listening list, not a list of errors.`,
    '',
    `- Clips checked: ${checks.length} (${checks.filter((c) => isShort(c.text)).length} short, ${checks.filter((c) => !isShort(c.text)).length} longer)`,
    `- Flagged on the first take and regenerated: ${retaken.length}`,
    `- Still flagged after the retake (need a human listen): ${flagged.length}`,
    `- Clips in the manifest: ${coverage}`,
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
  ];
  await writeFile(qaPath, lines.join('\n'));
  console.log(`Checked ${checks.length} clips: ${retaken.length} retaken, ${flagged.length} still flagged (see docs/audio-qa.md).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
