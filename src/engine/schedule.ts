// Spaced review rules for one learning item. Transparent heuristics, not an
// optimised model: see README "Scheduling".
import { EXERCISE_STAGES, type ExerciseStage } from '../curriculum/types';
import { ITEM_STAGES, type Attempt, type ItemProgress, type ItemStage, type PracticeMode } from './types';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** A forgotten item comes back this soon, with an easier exercise. */
export const RELEARN_DELAY = 10 * MINUTE;

/** About 1, 3, 7, 14 and 30 days, then 60 days for well-known items. */
export const REVIEW_INTERVALS: ReadonlyArray<number> = [1, 3, 7, 14, 30, 60].map((days) => days * DAY);

const HISTORY_LIMIT = 12;

function stageIndex(stage: ItemStage): number {
  return ITEM_STAGES.indexOf(stage);
}

/** The exercise stage to practise next: one harder than the stage reached. */
export function exerciseStageFor(stage: ItemStage): ExerciseStage {
  const next = Math.min(stageIndex(stage) + 1, ITEM_STAGES.length - 1);
  return ITEM_STAGES[next] as ExerciseStage;
}

/**
 * After a correct answer the item has shown it can handle that exercise's
 * stage. After a wrong one it drops to two below the failed exercise, so the
 * next exercise is one step easier than the one it failed.
 */
export function getNextLearningStage(stage: ItemStage, exerciseStage: ExerciseStage, correct: boolean): ItemStage {
  const exercise = stageIndex(exerciseStage);
  if (correct) return ITEM_STAGES[Math.max(stageIndex(stage), exercise)]!;
  return ITEM_STAGES[Math.max(0, Math.min(stageIndex(stage), exercise - 1) - 1)]!;
}

export function calculateNextReviewDate(step: number, now: number): number {
  const interval = REVIEW_INTERVALS[Math.min(Math.max(step, 0), REVIEW_INTERVALS.length - 1)]!;
  return now + interval;
}

export function isDue(progress: ItemProgress, now: number): boolean {
  return progress.dueAt <= now;
}

function withAttempt(history: Array<Attempt>, attempt: Attempt): Array<Attempt> {
  return [...history, attempt].slice(-HISTORY_LIMIT);
}

export type InLessonEvidence = {
  /** Exercise stages answered correctly on the first try, in this lesson. */
  correctStages: Array<ExerciseStage>;
  /** Any first-try mistake on this item in the lesson. */
  mistakes: number;
};

/**
 * Starts tracking an item when its lesson is completed. In-lesson success is
 * immediate recall, not long-term memory, so the stage is capped at supported
 * recall and the first review comes about a day later. A mistake in the lesson
 * brings it back within minutes instead.
 */
export function introduceItem(evidence: InLessonEvidence, now: number): ItemProgress {
  const best = evidence.correctStages.reduce((top, stage) => Math.max(top, EXERCISE_STAGES.indexOf(stage) + 1), 0);
  const cap = evidence.mistakes > 0 ? stageIndex('recognition') : stageIndex('supportedRecall');
  const stage = ITEM_STAGES[Math.min(best, cap)]!;
  const relearning = evidence.mistakes > 0;
  return {
    stage,
    step: 0,
    relearning,
    dueAt: relearning ? now + RELEARN_DELAY : calculateNextReviewDate(0, now),
    introducedAt: now,
    lastPracticedAt: now,
    correct: evidence.correctStages.length,
    incorrect: evidence.mistakes,
    lapses: 0,
    history: [],
  };
}

export type GradedAnswer = {
  correct: boolean;
  exerciseId: string;
  stage: ExerciseStage;
  mode: PracticeMode;
};

/**
 * Records one graded answer outside a first lesson (a review, practice lesson
 * or checkpoint) and reschedules the item.
 *
 * - Correct and due: the interval grows one step (1 → 3 → 7 → 14 → 30 → 60 days).
 * - Correct while relearning: back on its interval without growing it.
 * - Correct but not due yet (extra practice): the next exercise may get
 *   harder, but the schedule stays, so cramming cannot push an item out.
 * - Wrong: the interval falls back two steps and the item returns in 10
 *   minutes with an easier exercise.
 */
export function recordAnswer(previous: ItemProgress | undefined, answer: GradedAnswer, now: number): ItemProgress {
  const progress =
    previous ?? introduceItem({ correctStages: [], mistakes: 0 }, now - REVIEW_INTERVALS[0]!);
  const attempt: Attempt = { at: now, correct: answer.correct, exerciseId: answer.exerciseId, stage: answer.stage, mode: answer.mode };
  const base = {
    ...progress,
    stage: getNextLearningStage(progress.stage, answer.stage, answer.correct),
    lastPracticedAt: now,
    history: withAttempt(progress.history, attempt),
  };

  if (!answer.correct) {
    return {
      ...base,
      step: Math.max(0, progress.step - 2),
      relearning: true,
      dueAt: now + RELEARN_DELAY,
      incorrect: progress.incorrect + 1,
      lapses: progress.lapses + 1,
    };
  }
  if (progress.relearning) {
    return { ...base, relearning: false, dueAt: calculateNextReviewDate(progress.step, now), correct: progress.correct + 1 };
  }
  if (!isDue(progress, now)) {
    return { ...base, correct: progress.correct + 1 };
  }
  const step = Math.min(progress.step + 1, REVIEW_INTERVALS.length - 1);
  return { ...base, step, dueAt: calculateNextReviewDate(step, now), correct: progress.correct + 1 };
}

export type ItemStrength = 'new' | 'learning' | 'strong';

/**
 * strong: recalled without help after surviving at least a week-long gap.
 * learning: introduced, not yet strong. new: not met yet.
 */
export function itemStrength(progress: ItemProgress | undefined): ItemStrength {
  if (!progress) return 'new';
  const unaided = stageIndex(progress.stage) >= stageIndex('independentRecall');
  return unaided && progress.step >= 3 && !progress.relearning ? 'strong' : 'learning';
}
