// The corrections loop for writing (docs/fluent-forever-plan.md, Phase 6).
// Pure data: no React, no browser APIs.

/** A text the learner wrote and sent for correction, waiting for the corrected version. */
export type Draft = {
  /** `d-<time36>`. */
  id: string;
  text: string;
  /** The writing task it answered, to recognise it later. */
  prompt: string;
  exerciseId: string;
  at: number;
};

/**
 * One change a corrector made, kept as a learning item `c-<time36>`: the
 * corrected sentence with the changed words blanked, practised as a
 * fill-the-gap (dictation at transfer).
 */
export type Correction = {
  id: string;
  /** The corrected sentence with the corrected words as "___". */
  sentence: string;
  /** The corrected words, as the correction writes them. */
  answers: Array<string>;
  /** What the learner wrote in their place ("" when they left the words out). */
  wrote: string;
  /** The whole corrected sentence. */
  dutch: string;
  at: number;
};
