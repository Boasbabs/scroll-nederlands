// Pre-generate Dutch audio clips with ElevenLabs and register them in
// src/audio/clip-manifest.json. The extension uses a clip when one exists for a
// sentence and falls back to the browser's nl-NL voice otherwise.
//
//   ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=… pnpm audio:generate [--targets-only] [--stage s0] [--limit 50]
//
// Pick a native Netherlands Dutch voice in the ElevenLabs Voice Library and
// listen to a few clips before bundling them: the script cannot judge accent.
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type Draft = {
  targetPhrase: string;
  examples?: Array<{ dutch: string }>;
  dialogue?: Array<{ dutch: string }>;
  exercises: Array<{ audioText?: string }>;
};

const root = path.resolve(import.meta.dirname, '..');
const contentDir = path.join(root, 'src/curriculum/content');
const manifestPath = path.join(root, 'src/audio/clip-manifest.json');
const audioDir = path.join(root, 'public/audio');

const args = process.argv.slice(2);
const flag = (name: string) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const targetsOnly = args.includes('--targets-only');
const stage = flag('--stage');
const limit = Number(flag('--limit') ?? Infinity);

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
const model = process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2';
if (!apiKey || !voiceId) {
  console.error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID (a Netherlands Dutch voice).');
  process.exit(1);
}

function clipKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

async function collectTexts(): Promise<Array<string>> {
  const texts = new Set<string>();
  for (const stageId of await readdir(contentDir)) {
    if (stage && stageId !== stage) continue;
    for (const file of (await readdir(path.join(contentDir, stageId))).filter((f) => f.endsWith('.ts'))) {
      const { lessons } = (await import(pathToFileURL(path.join(contentDir, stageId, file)).href)) as { lessons: Array<Draft> };
      for (const lesson of lessons) {
        texts.add(clipKey(lesson.targetPhrase));
        if (targetsOnly) continue;
        for (const line of [...(lesson.examples ?? []), ...(lesson.dialogue ?? [])]) texts.add(clipKey(line.dutch));
        for (const exercise of lesson.exercises) if (exercise.audioText) texts.add(clipKey(exercise.audioText));
      }
    }
  }
  return [...texts];
}

async function synthesize(text: string): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: model }),
    },
  );
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { voiceId: string | null; model: string | null; clips: Record<string, string> };
if (manifest.voiceId && manifest.voiceId !== voiceId) {
  console.warn(`Manifest was built with voice ${manifest.voiceId}; mixing voices makes audio inconsistent.`);
}
await mkdir(audioDir, { recursive: true });

const pending = (await collectTexts()).filter((text) => !manifest.clips[text]).slice(0, limit);
console.log(`${pending.length} clips to generate with ${model}`);
for (const [i, text] of pending.entries()) {
  const file = `audio/${createHash('sha1').update(text).digest('hex').slice(0, 12)}.mp3`;
  await writeFile(path.join(root, 'public', file), await synthesize(text));
  manifest.clips[text] = file;
  if (i % 20 === 0) console.log(`${i + 1}/${pending.length} ${text}`);
}
manifest.voiceId = voiceId!;
manifest.model = model;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Manifest now has ${Object.keys(manifest.clips).length} clips.`);
