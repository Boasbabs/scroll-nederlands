import { describe, expect, it, vi } from 'vitest';
import { createSpeaker, pickDutchVoice } from '../../src/audio/speech';

type FakeVoice = { lang: string; name: string; localService: boolean };

function fakeSynth(voices: Array<FakeVoice>, { async = false } = {}) {
  let loaded = !async;
  const listeners = new Set<() => void>();
  return {
    spoken: [] as Array<{ text: string; lang: string; voice: unknown; rate: number }>,
    getVoices: () => (loaded ? voices : []),
    speak(utterance: { text: string; lang: string; voice: unknown; rate: number }) {
      this.spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice, rate: utterance.rate });
    },
    cancel: vi.fn(),
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    loadNow() {
      loaded = true;
      for (const fn of [...listeners]) fn();
    },
  };
}

const createUtterance = (text: string) => ({ text, lang: '', voice: null, rate: 1 }) as unknown as SpeechSynthesisUtterance;

describe('pickDutchVoice', () => {
  it('prefers a Netherlands voice over Belgian Dutch and English', () => {
    const voices = [
      { lang: 'en-US', name: 'Samantha', localService: true },
      { lang: 'nl-BE', name: 'Ellen', localService: true },
      { lang: 'nl_NL', name: 'Xander', localService: true },
      { lang: 'nl-NL', name: 'Google Nederlands', localService: false },
    ];
    expect(pickDutchVoice(voices)).toEqual({ voice: voices[3], match: 'nl-NL' });
    expect(pickDutchVoice(voices.slice(0, 3)).voice?.name).toBe('Xander');
    expect(pickDutchVoice(voices.slice(0, 2))).toEqual({ voice: voices[1], match: 'nl-other' });
    expect(pickDutchVoice(voices.slice(0, 1))).toEqual({ match: 'none' });
  });
});

describe('speaker', () => {
  it('speaks with the nl-NL locale and a Dutch voice', async () => {
    const synth = fakeSynth([{ lang: 'nl-NL', name: 'Xander', localService: true }]);
    const speaker = createSpeaker({ synth: synth as never, createUtterance, playClip: vi.fn(), clips: {} });
    const result = await speaker.speak('Goedemorgen', { rate: 0.8 });
    expect(result).toMatchObject({ ok: true, engine: 'synthesis', match: 'nl-NL', voiceName: 'Xander' });
    expect(synth.spoken[0]).toMatchObject({ text: 'Goedemorgen', lang: 'nl-NL', rate: 0.8 });
  });

  it('waits for voices that load asynchronously', async () => {
    const synth = fakeSynth([{ lang: 'nl-NL', name: 'Google Nederlands', localService: false }], { async: true });
    const speaker = createSpeaker({ synth: synth as never, createUtterance, playClip: vi.fn(), clips: {} });
    const pending = speaker.speak('Hallo');
    synth.loadNow();
    expect(await pending).toMatchObject({ ok: true, voiceName: 'Google Nederlands' });
  });

  it('fails gracefully without a Dutch voice or without speech synthesis', async () => {
    const synth = fakeSynth([{ lang: 'en-GB', name: 'Daniel', localService: true }]);
    const speaker = createSpeaker({ synth: synth as never, createUtterance, playClip: vi.fn(), clips: {}, voiceTimeoutMs: 10 });
    expect(await speaker.speak('Dag')).toEqual({ ok: false, reason: 'no-dutch-voice' });
    expect(synth.spoken).toHaveLength(0);
    const none = createSpeaker({ synth: undefined, createUtterance, playClip: vi.fn(), clips: {} });
    expect(await none.speak('Dag')).toEqual({ ok: false, reason: 'unsupported' });
  });

  it('prefers a bundled clip and falls back to synthesis if it cannot play', async () => {
    const synth = fakeSynth([{ lang: 'nl-NL', name: 'Xander', localService: true }]);
    const playClip = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('blocked'));
    const speaker = createSpeaker({ synth: synth as never, createUtterance, playClip, clips: { 'Dank je wel.': 'audio/abc.mp3' } });
    expect(await speaker.speak('  Dank je   wel. ')).toMatchObject({ ok: true, engine: 'clip' });
    expect(playClip).toHaveBeenCalledWith('audio/abc.mp3');
    expect(await speaker.speak('Dank je wel.')).toMatchObject({ ok: true, engine: 'synthesis' });
  });
});
