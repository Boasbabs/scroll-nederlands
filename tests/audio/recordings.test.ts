// Phase 7, step 4: human takes of the minimal pairs, from raw recordings to the manifest speech.ts reads.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { postProcess } from '../../scripts/generate-audio.ts';
import { fileSlug, processRecordings, RECORDED_MANIFEST, takeMatcher } from '../../scripts/recordings.ts';

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

let root = '';
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'taalnudge-takes-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function put(file: string) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), 'raw take');
}

/** Stands in for the ffmpeg chain: the processed file names the take it came from. */
const convert = (raw: string, out: string) => writeFile(out, path.relative(root, raw));

describe('naming takes', () => {
  it('turns a text into a name that is safe in a path and a URL', () => {
    expect(['maan', 'Één', 'de vork', 'Hoe gaat het?', 'ĳs'].map(fileSlug)).toEqual(['maan', 'een', 'de-vork', 'hoe-gaat-het', 'ijs']);
  });

  it('finds the text a take says from its file name', () => {
    const match = takeMatcher(['maan', 'man', 'Hoe gaat het?', 'Hallo!', 'Hallo.']);
    expect(match('maan.wav')).toBe('maan');
    expect(match('MAAN.wav')).toBe('maan');
    expect(match('Hoe_gaat_het.m4a')).toBe('Hoe gaat het?');
    // Two texts fit "hallo", and none fits a typo.
    expect(match('hallo.wav')).toBeUndefined();
    expect(match('mann.wav')).toBeUndefined();
  });
});

describe('processing the takes', () => {
  const texts = ['man', 'maan', 'Hoe gaat het?'];

  it('puts every speaker’s takes through the chain and lists them by text', async () => {
    await put('recordings/Anna/maan.wav');
    await put('recordings/Anna/man.wav');
    await put('recordings/bas/maan.m4a');
    await put('recordings/bas/notes.txt');
    await put('recordings/bas/._maan.m4a');
    const report = await processRecordings({ root, texts, convert });
    expect(report.manifest).toEqual({
      takes: {
        maan: ['audio/recorded/anna/maan.mp3', 'audio/recorded/bas/maan.mp3'],
        man: ['audio/recorded/anna/man.mp3'],
      },
    });
    expect(JSON.parse(await readFile(path.join(root, RECORDED_MANIFEST), 'utf8'))).toEqual(report.manifest);
    expect(await readFile(path.join(root, 'public/audio/recorded/bas/maan.mp3'), 'utf8')).toBe('recordings/bas/maan.m4a');
    expect(report).toMatchObject({ processed: ['recordings/Anna/maan.wav', 'recordings/Anna/man.wav', 'recordings/bas/maan.m4a'], unknown: [], failed: [], stale: [] });
  });

  it('reports a take it cannot place, and refuses two takes of one text by one speaker', async () => {
    await put('recordings/anna/mann.wav');
    const report = await processRecordings({ root, texts, convert });
    expect(report).toMatchObject({ unknown: ['recordings/anna/mann.wav'], manifest: { takes: {} } });

    await put('recordings/anna/maan.wav');
    await put('recordings/anna/maan.m4a');
    await expect(processRecordings({ root, texts, convert })).rejects.toThrow('keep one take per text and speaker');
  });

  it('keeps earlier takes while their MP3 is there, and drops the rest', async () => {
    await put('recordings/anna/maan.wav');
    await put('recordings/anna/man.wav');
    await put('recordings/anna/hoe gaat het.wav');
    await processRecordings({ root, texts, convert });
    // The raw takes are not kept, one take is deleted, and the course stops playing a text.
    await rm(path.join(root, 'recordings'), { recursive: true });
    await rm(path.join(root, 'public/audio/recorded/anna/man.mp3'));
    const report = await processRecordings({ root, texts: ['man', 'maan'], convert });
    expect(report.manifest).toEqual({ takes: { maan: ['audio/recorded/anna/maan.mp3'] } });
    expect(report).toMatchObject({ processed: [], stale: ['Hoe gaat het?'] });
  });

  it('reports a take the chain fails on, and keeps the version made before', async () => {
    await put('recordings/anna/maan.wav');
    await processRecordings({ root, texts, convert });
    const report = await processRecordings({ root, texts, convert: () => Promise.reject(new Error('ffmpeg failed')) });
    expect(report.failed).toEqual([{ take: 'recordings/anna/maan.wav', error: 'ffmpeg failed' }]);
    expect(report.manifest).toEqual({ takes: { maan: ['audio/recorded/anna/maan.mp3'] } });
  });
});

describe.skipIf(!hasFfmpeg)('the ffmpeg chain on a raw take', () => {
  it('trims the silence, normalises to -18 LUFS and encodes mono 64 kbps MP3 at 44.1 kHz', async () => {
    const raw = path.join(root, 'take.wav');
    const out = path.join(root, 'take.mp3');
    // As a recorder makes it: quiet (about -43 LUFS), stereo at 48 kHz, half a second of silence, 1.2 s of sound, 0.8 s of silence.
    const sound = 'sine=frequency=220:sample_rate=48000:duration=1.2';
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', sound, '-af', 'volume=-20dB,adelay=500:all=1,apad=pad_dur=0.8', '-ac', '2', raw]);
    await postProcess(raw, out);

    const probe = JSON.parse(
      execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,channels,sample_rate,bit_rate:format=duration', '-of', 'json', out], { encoding: 'utf8' }),
    ) as { streams: Array<Record<string, unknown>>; format: { duration: string } };
    expect(probe.streams[0]).toMatchObject({ codec_name: 'mp3', channels: 1, sample_rate: '44100', bit_rate: '64000' });
    // The 1.2 s of sound, with 50 ms of silence kept before it and 150 ms after.
    expect(Number(probe.format.duration)).toBeGreaterThan(1.3);
    expect(Number(probe.format.duration)).toBeLessThan(1.5);
    const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
    const loudness = Number(/I:\s+(-?[\d.]+) LUFS/.exec(stderr.slice(stderr.lastIndexOf('Summary:')))?.[1]);
    expect(loudness).toBeGreaterThan(-19);
    expect(loudness).toBeLessThan(-17);
    expect(existsSync(`${out}.tmp.mp3`)).toBe(false);
  }, 20_000);

  it('refuses a take with nothing left after trimming, and keeps the version made before', async () => {
    const raw = path.join(root, 'silent.wav');
    const out = path.join(root, 'silent.mp3');
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '2', raw]);
    await writeFile(out, 'the earlier take');
    await expect(postProcess(raw, out)).rejects.toThrow('nothing is left after trimming the silence');
    expect(await readFile(out, 'utf8')).toBe('the earlier take');
    expect(existsSync(`${out}.tmp.mp3`)).toBe(false);
  }, 20_000);
});
