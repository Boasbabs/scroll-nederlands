import type { Exercise, ExerciseStage, Lesson } from '../curriculum/types';

/**
 * How far a learner has demonstrated a learning item. "introduced" means the
 * lesson was shown but nothing has been recalled yet; each later level names
 * the most demanding exercise stage answered correctly.
 */
export type LearningLevel = 'introduced' | ExerciseStage;

export const LEARNING_LEVELS: Array<LearningLevel> = [
  'introduced',
  'recognition',
  'supportedRecall',
  'independentRecall',
  'transfer',
];

export type LearningMode = 'micro' | 'focused';

export type AttemptRecord = {
  at: number;
  exerciseId: string;
  stage: ExerciseStage;
  correct: boolean;
  mode: LearningMode;
};

/** Progress for one learning item. Each lesson teaches one item, keyed by lesson id. */
export type LearningItemProgress = {
  lessonId: string;
  level: LearningLevel;
  /** Number of spaced successes earned; indexes the review interval table. */
  step: number;
  dueAt: number;
  introducedAt: number;
  lastAttemptAt: number | null;
  correctCount: number;
  incorrectCount: number;
  /** Most recent attempts, oldest first, capped. */
  history: Array<AttemptRecord>;
};

export type CheckpointResult = {
  attempts: number;
  lastScore: number;
  bestScore: number;
  lastAttemptAt: number;
  passedAt: number | null;
};

export type LearnerProgress = {
  version: 1;
  items: Record<string, LearningItemProgress>;
  /** Lesson id → time the lesson (learn card + first practice) was finished. */
  completedLessons: Record<string, number>;
  checkpoints: Record<string, CheckpointResult>;
};

export type LearnerPreferences = {
  /** Minutes of active browsing before a prompt is offered. */
  promptAfterMinutes: number;
  quietMode: boolean;
  snoozeUntil: number | null;
  speechRate: number;
};

export type Activity =
  | { kind: 'review'; lesson: Lesson; exercise: Exercise; item: LearningItemProgress }
  | { kind: 'new-lesson'; lesson: Lesson }
  | { kind: 'checkpoint'; lesson: Lesson }
  /** Micro mode only: the next step (a checkpoint) needs focused practice. */
  | { kind: 'focused-only'; lesson: Lesson }
  | { kind: 'done' };
