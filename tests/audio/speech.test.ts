import { createSpeaker, pickDutchVoice, type SpeakerDeps } from '../../src/audio/speech';

type FakeVoice = { lang: string; name: string; localService: boolean };

function fakeSynth(voices: Array<FakeVoice>, { lateVoices = false } = {}) {
  const listeners = new Set<() => void>();
  let available = lateVoices ? [] : voices;
  const spoken: Array<{ text: string; lang: string; voice?: string; rate: number }> = [];
  return {
    spoken,
    loadVoices() {
      available = voices;
      for (const listener of listeners) listener();
    },
    synth: {
      getVoices: () => available as unknown as Array<SpeechSynthesisVoice>,
      speak: (utterance: SpeechSynthesisUtterance) => {
        spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name, rate: utterance.rate });
        queueMicrotask(() => utterance.onend?.(new Event('end') as SpeechSynthesisEvent));
      },
      cancel: () => {},
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    } as unknown as SpeakerDeps['synth'],
  };
}

function makeSpeaker(voices: Array<FakeVoice>, overrides: Partial<SpeakerDeps> = {}, options = {}) {
  const fake = fakeSynth(voices, options);
  const played: Array<{ path: string; rate: number }> = [];
  const speaker = createSpeaker({
    synth: fake.synth,
    createUtterance: (text) => ({ text }) as SpeechSynthesisUtterance,
    playClip: async (path, rate) => void played.push({ path, rate }),
    stopClip: () => {},
    manifest: { clips: {} },
    voiceTimeoutMs: 50,
    ...overrides,
  });
  return { speaker, fake, played };
}

const google = { lang: 'nl-NL', name: 'Google Nederlands', localService: false };
const xander = { lang: 'nl_NL', name: 'Xander', localService: true };
const flemish = { lang: 'nl-BE', name: 'Ellen', localService: true };
const english = { lang: 'en-US', name: 'Samantha', localService: true };

describe('pickDutchVoice', () => {
  it('prefers a Netherlands voice, Google first, then any Dutch variety', () => {
    expect(pickDutchVoice([english, flemish, xander, google])).toEqual({ voice: google, match: 'nl-NL' });
    expect(pickDutchVoice([english, xander])).toEqual({ voice: xander, match: 'nl-NL' });
    expect(pickDutchVoice([english, flemish])).toEqual({ voice: flemish, match: 'nl-other' });
    expect(pickDutchVoice([english])).toEqual({ match: 'none' });
  });
});

describe('speaker', () => {
  it('uses a bundled clip when one exists, at the requested speed', async () => {
    const { speaker, played, fake } = makeSpeaker([google], { manifest: { clips: { 'Goedemiddag!': 'audio/a.mp3' } } });
    expect(await speaker.speak('  Goedemiddag! ', { rate: 0.7 })).toMatchObject({ ok: true, engine: 'clip' });
    expect(played).toEqual([{ path: 'audio/a.mp3', rate: 0.7 }]);
    expect(fake.spoken).toEqual([]);
  });

  it('reads with an nl-NL voice and nl-NL locale when there is no clip', async () => {
    const { speaker, fake } = makeSpeaker([english, google]);
    expect(await speaker.speak('Dank je wel.')).toMatchObject({ ok: true, engine: 'synthesis', match: 'nl-NL' });
    expect(fake.spoken[0]).toMatchObject({ text: 'Dank je wel.', lang: 'nl-NL', voice: 'Google Nederlands' });
  });

  it('waits for voices that load late', async () => {
    const { speaker, fake } = makeSpeaker([google], {}, { lateVoices: true });
    const result = speaker.speak('Hallo');
    setTimeout(() => fake.loadVoices(), 5);
    expect(await result).toMatchObject({ ok: true, engine: 'synthesis' });
  });

  it('falls back to synthesis when a clip cannot play', async () => {
    const { speaker } = makeSpeaker([google], {
      manifest: { clips: { Hallo: 'audio/h.mp3' } },
      playClip: () => Promise.reject(new Error('blocked')),
    });
    expect(await speaker.speak('Hallo')).toMatchObject({ ok: true, engine: 'synthesis' });
  });

  it('stays silent, with a reason, when no Dutch voice exists', async () => {
    const { speaker, fake } = makeSpeaker([english]);
    expect(await speaker.speak('Hallo')).toEqual({ ok: false, reason: 'no-dutch-voice' });
    expect(fake.spoken).toEqual([]);
    expect(await makeSpeaker([], { synth: undefined }).speaker.speak('Hallo')).toEqual({ ok: false, reason: 'unsupported' });
  });

  it('gives the second dialogue speaker the second voice', async () => {
    const { speaker, played } = makeSpeaker([google], {
      manifest: { clips: { 'Hoi!': 'audio/1.mp3', 'Hallo!': 'audio/2.mp3' }, clipsB: { 'Hallo!': 'audio/2b.mp3' } },
    });
    const seen: Array<number> = [];
    await speaker.speakDialogue(
      [
        { speaker: 'Sanne', dutch: 'Hoi!' },
        { speaker: 'You', dutch: 'Hallo!' },
      ],
      (index) => seen.push(index),
    );
    expect(played.map((clip) => clip.path)).toEqual(['audio/1.mp3', 'audio/2b.mp3']);
    expect(seen).toEqual([0, 1, -1]);
  });
});
