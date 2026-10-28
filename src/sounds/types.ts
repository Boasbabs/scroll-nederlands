// Minimal pairs for ear training (docs/fluent-forever-plan.md, Phase 1).
// Pure data: no React, no browser APIs.

/** One word of a pair, with a short gloss for the feedback. */
export type PairWord = { dutch: string; english: string };

/**
 * Two Dutch sounds an English ear tends to hear as one, with real words that
 * differ only in that sound. The learner hears one word and picks which it was.
 */
export type SoundContrast = {
  /** kebab-case and permanent: the learning item is `p-<id>`. */
  id: string;
  /** The two sounds as spelled, e.g. ['a', 'aa']. */
  sounds: [string, string];
  /** How to hear (and say) the difference, in plain English. */
  tip: string;
  /** 3 to 5 pairs: [a word with the first sound, the same word with the second]. */
  pairs: Array<[PairWord, PairWord]>;
};
