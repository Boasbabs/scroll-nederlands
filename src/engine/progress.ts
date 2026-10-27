import type { Exercise, ExerciseStage, Lesson } from '../curriculum/types';
import { calculateNextReviewDate, stepAfterFailure, stepAfterSuccess } from './schedule';
import {
  LEARNING_LEVELS,
  type LearnerProgress,
  type LearningItemProgress,
  type LearningLevel,
  type LearningMode,
} from './types';

export const HISTORY_LIMIT = 20;
/** Share of checkpoint exercises that must be correct to count as passed. */
export const CHECKPOINT_PASS_SCORE = 0.7;

export function createEmptyProgress(): LearnerProgress {
  return { version: 1, items: {}, completedLessons: {}, checkpoints: {} };
}

function levelRank(level: LearningLevel): number {
  return LEARNING_LEVELS.indexOf(level);
}

/** The exercise stage that would stretch the learner next, given the level they have shown. */
export function getNextLearningStage(level: LearningLevel): ExerciseStage {
  const next = LEARNING_LEVELS[Math.min(levelRank(level) + 1, LEARNING_LEVELS.length - 1)]!;
  return next === 'introduced' ? 'recognition' : next;
}

export function createItem(lessonId: string, now: number): LearningItemProgress {
  return {
    lessonId,
    level: 'introduced',
    step: 0,
    dueAt: now,
    introducedAt: now,
    lastAttemptAt: null,
    correctCount: 0,
    incorrectCount: 0,
    history: [],
  };
}

export type AnswerInput = {
  lessonId: string;
  exercise: Exercise;
  correct: boolean;
  mode: LearningMode;
  now: number;
};

/**
 * Apply one graded answer to an item.
 * Correct: the level rises to the stage just answered and, if the item was
 * due, the next review moves one interval further out.
 * Wrong: the level drops one stage (so the next exercise is easier), the
 * interval falls back two steps, and the item is due again shortly.
 */
export function recordAnswer(progress: LearnerProgress, input: AnswerInput): LearnerProgress {
  const { lessonId, exercise, correct, mode, now } = input;
  const existing = progress.items[lessonId] ?? createItem(lessonId, now);
  const isDue = now >= existing.dueAt;
  const history = [
    ...existing.history,
    { at: now, exerciseId: exercise.id, stage: exercise.stage, correct, mode },
  ].slice(-HISTORY_LIMIT);

  let item: LearningItemProgress;
  if (correct) {
    const step = stepAfterSuccess(existing.step, isDue);
    const rank = Math.max(levelRank(existing.level), levelRank(exercise.stage));
    item = {
      ...existing,
      level: LEARNING_LEVELS[rank]!,
      step,
      dueAt: step === existing.step ? existing.dueAt : calculateNextReviewDate(step, now),
      correctCount: existing.correctCount + 1,
    };
  } else {
    const step = stepAfterFailure(existing.step);
    item = {
      ...existing,
      level: LEARNING_LEVELS[Math.max(0, levelRank(existing.level) - 1)]!,
      step,
      dueAt: calculateNextReviewDate(0, now),
      incorrectCount: existing.incorrectCount + 1,
    };
  }

  item = { ...item, lastAttemptAt: now, history };
  return { ...progress, items: { ...progress.items, [lessonId]: item } };
}

/** Mark the learn card and first practice as finished. Completion is not proficiency. */
export function completeLesson(progress: LearnerProgress, lessonId: string, now: number): LearnerProgress {
  const items = progress.items[lessonId]
    ? progress.items
    : { ...progress.items, [lessonId]: createItem(lessonId, now) };
  return {
    ...progress,
    items,
    completedLessons: { ...progress.completedLessons, [lessonId]: progress.completedLessons[lessonId] ?? now },
  };
}

export type CheckpointAnswer = { exercise: Exercise; correct: boolean };

/**
 * Score a checkpoint attempt. Every lesson behind a wrong answer is demoted one
 * level and made due now, so the regular review queue picks it up.
 */
export function recordCheckpoint(
  progress: LearnerProgress,
  checkpoint: Lesson,
  answers: Array<CheckpointAnswer>,
  now: number,
): { progress: LearnerProgress; score: number; passed: boolean; lessonsToReview: Array<string> } {
  const correctCount = answers.filter((answer) => answer.correct).length;
  const score = answers.length === 0 ? 0 : correctCount / answers.length;
  const passed = score >= CHECKPOINT_PASS_SCORE;

  const lessonsToReview = [
    ...new Set(
      answers
        .filter((answer) => !answer.correct && answer.exercise.testsLesson)
        .map((answer) => answer.exercise.testsLesson!),
    ),
  ];

  const items = { ...progress.items };
  for (const lessonId of lessonsToReview) {
    const item = items[lessonId];
    if (!item) continue;
    items[lessonId] = {
      ...item,
      level: LEARNING_LEVELS[Math.max(0, levelRank(item.level) - 1)]!,
      step: stepAfterFailure(item.step),
      dueAt: now,
    };
  }

  const previous = progress.checkpoints[checkpoint.id];
  const result = {
    attempts: (previous?.attempts ?? 0) + 1,
    lastScore: score,
    bestScore: Math.max(previous?.bestScore ?? 0, score),
    lastAttemptAt: now,
    passedAt: previous?.passedAt ?? (passed ? now : null),
  };

  return {
    progress: {
      ...progress,
      items,
      completedLessons: {
        ...progress.completedLessons,
        [checkpoint.id]: progress.completedLessons[checkpoint.id] ?? now,
      },
      checkpoints: { ...progress.checkpoints, [checkpoint.id]: result },
    },
    score,
    passed,
    lessonsToReview,
  };
}
