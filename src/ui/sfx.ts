// Short synthesised sound effects (no audio files): a bright two-note chime
// for a right answer, one soft low note for a miss, a rising arpeggio at the end.

export type SfxName = 'correct' | 'wrong' | 'complete';

export type Sfx = { play(name: SfxName): void };

const NOTES: Record<SfxName, Array<[frequency: number, start: number, length: number]>> = {
  correct: [
    [784, 0, 0.12],
    [1175, 0.09, 0.2],
  ],
  wrong: [[220, 0, 0.22]],
  complete: [
    [523, 0, 0.14],
    [659, 0.11, 0.14],
    [784, 0.22, 0.14],
    [1047, 0.33, 0.32],
  ],
};

/** `enabled` is read on every play, so the Sound effects setting applies at once. */
export function createSfx(enabled: () => boolean): Sfx {
  let context: AudioContext | undefined;
  return {
    play(name) {
      if (!enabled() || typeof AudioContext === 'undefined') return;
      try {
        context ??= new AudioContext();
        const start = context.currentTime + 0.01;
        for (const [frequency, offset, length] of NOTES[name]) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = name === 'wrong' ? 'triangle' : 'sine';
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0.0001, start + offset);
          gain.gain.exponentialRampToValueAtTime(0.12, start + offset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + length);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(start + offset);
          oscillator.stop(start + offset + length + 0.02);
        }
      } catch {
        // Audio output is optional.
      }
    },
  };
}

export const silentSfx: Sfx = { play() {} };
