import type { ExerciseStage } from '../curriculum/types';

/**
 * How far a learning item has got. The next exercise is one stage harder
 * than the stage reached: an item at `recognition` gets a supported-recall
 * exercise next.
 */
export type ItemStage = 'introduced' | ExerciseStage;

export const ITEM_STAGES: ReadonlyArray<ItemStage> = [
  'introduced',
  'recognition',
  'supportedRecall',
  'independentRecall',
  'transfer',
];

export type PracticeMode = 'micro' | 'focused';

export type Attempt = {
  at: number;
  correct: boolean;
  exerciseId: string;
  stage: ExerciseStage;
  mode: PracticeMode;
};

export type ItemProgress = {
  stage: ItemStage;
  /** Index into REVIEW_INTERVALS of the interval now running. */
  step: number;
  /** Recently forgotten: due again soon, then back on its (shortened) interval. */
  relearning: boolean;
  dueAt: number;
  introducedAt: number;
  lastPracticedAt: number;
  correct: number;
  incorrect: number;
  /** Times it was forgotten in a review. */
  lapses: number;
  /** Recent attempts, newest last. */
  history: Array<Attempt>;
};

export type LessonProgress = {
  startedAt?: number;
  /** First completion. Completing a lesson is not the same as remembering it. */
  completedAt?: number;
  timesCompleted: number;
  /** Checkpoints: fraction correct, 0–1. */
  lastScore?: number;
  bestScore?: number;
};

export type LearnerProgress = {
  version: 2;
  items: Record<string, ItemProgress>;
  lessons: Record<string, LessonProgress>;
  /** Answers given per local day ("2026-10-27"), for a small activity strip. */
  days: Record<string, number>;
};

export function emptyProgress(): LearnerProgress {
  return { version: 2, items: {}, lessons: {}, days: {} };
}

/** The graded result of one exercise inside a lesson, review or checkpoint. */
export type ExerciseResult = {
  /** The planned exercise's `exerciseId`. */
  exerciseId: string;
  stage: ExerciseStage;
  itemIds: Array<string>;
  /** Judged on the first attempt; retries after feedback do not change it. */
  correct: boolean;
};
