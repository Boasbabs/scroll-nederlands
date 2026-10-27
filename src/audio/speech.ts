// Dutch audio behind one small interface: a bundled ElevenLabs clip when one
// exists for the sentence, otherwise the browser's nl-NL voice, otherwise
// silence with an explanation. Nothing here talks to a server.

export const DUTCH_LOCALE = 'nl-NL';

/** Slow replay speed (clips keep their pitch; synthesis slows its voice). */
export const SLOW_RATE = 0.7;

export type VoiceLike = Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'localService'>;

/** nl-NL: Netherlands voice. nl-other: another Dutch variety (e.g. nl-BE). none: no Dutch voice. */
export type VoiceMatch = 'nl-NL' | 'nl-other' | 'none';

/** Which recorded voice reads a line: `a` by default, `b` for the second speaker in dialogues. */
export type ClipVoice = 'a' | 'b';

export type SpeakResult =
  | { ok: true; engine: 'clip' | 'synthesis'; match: VoiceMatch; voiceName?: string }
  | { ok: false; reason: 'no-dutch-voice' | 'unsupported' | 'interrupted' };

export type ClipManifest = {
  clips: Record<string, string>;
  /** Clips read by the second voice, for the other speaker in dialogues. */
  clipsB?: Record<string, string>;
};

function normalizeLang(lang: string): string {
  return lang.replace('_', '-').toLowerCase();
}

/** Prefer an nl-NL voice (Chrome's network "Google Nederlands" first), then any Dutch. */
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
  /** Plays a bundled clip at a playback rate and resolves when it ends. */
  playClip: (path: string, rate: number) => Promise<void>;
  stopClip: () => void;
  manifest: ClipManifest;
  /** How long to wait for voices that load asynchronously. */
  voiceTimeoutMs?: number;
};

export type SpeakOptions = { rate?: number; voice?: ClipVoice };

export function createSpeaker(deps: SpeakerDeps) {
  let voicesPromise: Promise<Array<SpeechSynthesisVoice>> | undefined;
  let generation = 0;

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

  function findClip(text: string, voice: ClipVoice): string | undefined {
    const key = clipKey(text);
    if (voice === 'b') return deps.manifest.clipsB?.[key] ?? deps.manifest.clips[key];
    return deps.manifest.clips[key];
  }

  function stop() {
    generation++;
    deps.stopClip();
    deps.synth?.cancel();
  }

  /** Speaks one sentence and resolves when it has finished (or was interrupted). */
  async function speak(text: string, options: SpeakOptions = {}): Promise<SpeakResult> {
    stop();
    const mine = generation;
    const rate = options.rate ?? 1;
    const clip = findClip(text, options.voice ?? 'a');
    if (clip) {
      try {
        await deps.playClip(clip, rate);
        return mine === generation ? { ok: true, engine: 'clip', match: 'nl-NL' } : { ok: false, reason: 'interrupted' };
      } catch {
        if (mine !== generation) return { ok: false, reason: 'interrupted' };
        // The clip could not play here; fall back to synthesis.
      }
    }

    const synth = deps.synth;
    if (!synth) return { ok: false, reason: 'unsupported' };
    const { voice, match } = pickDutchVoice(await loadVoices());
    // An English voice reading Dutch teaches the wrong sounds, so stay silent instead.
    if (!voice) return { ok: false, reason: 'no-dutch-voice' };
    if (mine !== generation) return { ok: false, reason: 'interrupted' };

    const utterance = deps.createUtterance(text);
    utterance.lang = DUTCH_LOCALE;
    utterance.voice = voice as SpeechSynthesisVoice;
    // Synthesis voices run a little fast for beginners.
    utterance.rate = rate * 0.9;
    await new Promise<void>((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
    });
    return mine === generation ? { ok: true, engine: 'synthesis', match, voiceName: voice.name } : { ok: false, reason: 'interrupted' };
  }

  /** Plays dialogue lines in turn; the second speaker uses the second voice. */
  async function speakDialogue(
    lines: ReadonlyArray<{ speaker: string; dutch: string }>,
    onLine?: (index: number) => void,
  ): Promise<void> {
    const speakers = [...new Set(lines.map((line) => line.speaker))];
    for (const [index, line] of lines.entries()) {
      onLine?.(index);
      const result = await speak(line.dutch, { voice: speakers.indexOf(line.speaker) === 1 ? 'b' : 'a' });
      if (!result.ok) return;
    }
    onLine?.(-1);
  }

  async function describeVoice(): Promise<{ match: VoiceMatch; voiceName?: string; clipCount: number }> {
    const { voice, match } = pickDutchVoice(await loadVoices());
    return { match, voiceName: voice?.name, clipCount: Object.keys(deps.manifest.clips).length };
  }

  return { speak, speakDialogue, stop, describeVoice, hasClip: (text: string) => Boolean(findClip(text, 'a')) };
}

export type Speaker = ReturnType<typeof createSpeaker>;
