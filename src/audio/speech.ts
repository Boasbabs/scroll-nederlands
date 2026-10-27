// Dutch audio behind one small interface. Pre-generated clips (see
// scripts/generate-audio.ts) are used when present; otherwise the browser's
// speech synthesis with an nl-NL voice. Nothing here talks to a server.

export const DUTCH_LOCALE = 'nl-NL';

export type VoiceLike = Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'localService'>;

/** nl-NL: Netherlands voice. nl-other: another Dutch variety (e.g. nl-BE). none: no Dutch voice. */
export type VoiceMatch = 'nl-NL' | 'nl-other' | 'none';

export type SpeakResult =
  | { ok: true; engine: 'clip' | 'synthesis'; match: VoiceMatch; voiceName?: string }
  | { ok: false; reason: 'no-dutch-voice' | 'unsupported' };

function normalizeLang(lang: string): string {
  return lang.replace('_', '-').toLowerCase();
}

/** Prefer an nl-NL voice (Google's network voice first, it is the most natural in Chrome), then any Dutch. */
export function pickDutchVoice<V extends VoiceLike>(voices: ReadonlyArray<V>): { voice?: V; match: VoiceMatch } {
  const netherlands = voices.filter((voice) => normalizeLang(voice.lang) === 'nl-nl');
  if (netherlands.length > 0) {
    const google = netherlands.find((voice) => voice.name.toLowerCase().includes('google'));
    return { voice: google ?? netherlands[0], match: 'nl-NL' };
  }
  const dutch = voices.find((voice) => normalizeLang(voice.lang).startsWith('nl'));
  return dutch ? { voice: dutch, match: 'nl-other' } : { match: 'none' };
}

export function clipKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

type SynthLike = Pick<SpeechSynthesis, 'getVoices' | 'speak' | 'cancel' | 'addEventListener' | 'removeEventListener'>;

export type SpeakerDeps = {
  synth: SynthLike | undefined;
  createUtterance: (text: string) => SpeechSynthesisUtterance;
  playClip: (path: string) => Promise<void>;
  clips: Record<string, string>;
  /** How long to wait for voices that load asynchronously. */
  voiceTimeoutMs?: number;
};

export type Speaker = ReturnType<typeof createSpeaker>;

export function createSpeaker(deps: SpeakerDeps) {
  let voicesPromise: Promise<Array<SpeechSynthesisVoice>> | undefined;

  function loadVoices(): Promise<Array<SpeechSynthesisVoice>> {
    const synth = deps.synth;
    if (!synth) return Promise.resolve([]);
    const ready = synth.getVoices();
    if (ready.length > 0) return Promise.resolve(ready);
    voicesPromise ??= new Promise((resolve) => {
      const finish = () => {
        synth.removeEventListener('voiceschanged', finish);
        clearTimeout(timer);
        voicesPromise = undefined;
        resolve(synth.getVoices());
      };
      const timer = setTimeout(finish, deps.voiceTimeoutMs ?? 2000);
      synth.addEventListener('voiceschanged', finish);
    });
    return voicesPromise;
  }

  async function describeVoice(): Promise<{ match: VoiceMatch; voiceName?: string; hasClips: boolean }> {
    const { voice, match } = pickDutchVoice(await loadVoices());
    return { match, voiceName: voice?.name, hasClips: Object.keys(deps.clips).length > 0 };
  }

  async function speak(text: string, options: { rate?: number } = {}): Promise<SpeakResult> {
    const clip = deps.clips[clipKey(text)];
    if (clip) {
      try {
        deps.synth?.cancel();
        await deps.playClip(clip);
        return { ok: true, engine: 'clip', match: 'nl-NL' };
      } catch {
        // Some pages block extension media; fall back to synthesis.
      }
    }

    const synth = deps.synth;
    if (!synth) return { ok: false, reason: 'unsupported' };
    const { voice, match } = pickDutchVoice(await loadVoices());
    // An English voice reading Dutch teaches the wrong sounds, so stay silent instead.
    if (!voice) return { ok: false, reason: 'no-dutch-voice' };

    synth.cancel();
    const utterance = deps.createUtterance(text);
    utterance.lang = DUTCH_LOCALE;
    utterance.voice = voice as SpeechSynthesisVoice;
    utterance.rate = options.rate ?? 0.9;
    synth.speak(utterance);
    return { ok: true, engine: 'synthesis', match, voiceName: voice.name };
  }

  return { speak, describeVoice, stop: () => deps.synth?.cancel() };
}
