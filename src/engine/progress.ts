// Applying finished sessions to learner progress. Pure: returns new objects.
import type { CurriculumIndex } from '../curriculum/assemble';
import type { ExerciseStage } from '../curriculum/types';
import { introduceItem, recordAnswer } from './schedule';
import type { ExerciseResult, LearnerProgress, LessonProgress, PracticeMode } from './types';

/** Checkpoint pass mark. Passing is shown to the learner; it never locks the course. */
export const CHECKPOINT_PASS = 0.7;

export function dayKey(now: number): string {
  const date = new Date(now);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function countAnswers(progress: LearnerProgress, answers: number, now: number): Record<string, number> {
  if (answers === 0) return progress.days;
  const key = dayKey(now);
  return { ...progress.days, [key]: (progress.days[key] ?? 0) + answers };
}

/**
 * Grades each item on its answers in this session. Misses are applied last,
 * so an item missed once and then answered correctly still comes back soon.
 */
function gradeAll(
  items: LearnerProgress['items'],
  results: ReadonlyArray<ExerciseResult>,
  mode: PracticeMode,
  now: number,
  only?: (itemId: string) => boolean,
): LearnerProgress['items'] {
  const next = { ...items };
  const ordered = [...results.filter((result) => result.correct), ...results.filter((result) => !result.correct)];
  for (const result of ordered) {
    for (const itemId of result.itemIds) {
      if (only && !only(itemId)) continue;
      next[itemId] = recordAnswer(next[itemId], { correct: result.correct, exerciseId: result.exerciseId, stage: result.stage, mode }, now);
    }
  }
  return next;
}

export function markLessonStarted(progress: LearnerProgress, lessonId: string, now: number): LearnerProgress {
  const previous = progress.lessons[lessonId];
  if (previous?.startedAt) return progress;
  return { ...progress, lessons: { ...progress.lessons, [lessonId]: { timesCompleted: 0, ...previous, startedAt: now } } };
}

/**
 * Finishes a lesson. Its own items start their review schedule from what the
 * learner showed in the lesson; items from earlier lessons that the lesson
 * revisits are graded like a review. Repeating a lesson grades everything.
 */
export function completeLesson(
  progress: LearnerProgress,
  index: CurriculumIndex,
  lessonId: string,
  results: ReadonlyArray<ExerciseResult>,
  mode: PracticeMode,
  now: number,
): LearnerProgress {
  const lesson = index.lesson(lessonId);
  if (!lesson) throw new Error(`Unknown lesson ${lessonId}`);
  const ownItems = new Set(lesson.items.map((item) => item.id));
  const isNew = (itemId: string) => ownItems.has(itemId) && !progress.items[itemId];

  let items = gradeAll(progress.items, results, mode, now, (itemId) => !isNew(itemId));
  for (const item of lesson.items) {
    if (progress.items[item.id]) continue;
    const mine = results.filter((result) => result.itemIds.includes(item.id));
    const correctStages: Array<ExerciseStage> = mine.filter((result) => result.correct).map((result) => result.stage);
    items = { ...items, [item.id]: introduceItem({ correctStages, mistakes: mine.filter((result) => !result.correct).length }, now) };
  }

  const previous: LessonProgress = progress.lessons[lessonId] ?? { timesCompleted: 0 };
  return {
    ...progress,
    items,
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        ...previous,
        startedAt: previous.startedAt ?? now,
        completedAt: previous.completedAt ?? now,
        timesCompleted: previous.timesCompleted + 1,
      },
    },
    days: countAnswers(progress, results.length, now),
  };
}

/** Grades review answers; each item gets its own new schedule. */
export function recordReviewResults(
  progress: LearnerProgress,
  results: ReadonlyArray<ExerciseResult>,
  mode: PracticeMode,
  now: number,
): LearnerProgress {
  return { ...progress, items: gradeAll(progress.items, results, mode, now), days: countAnswers(progress, results.length, now) };
}

export type CheckpointOutcome = { progress: LearnerProgress; score: number; passed: boolean; missedLessonIds: Array<string> };

/**
 * Scores a checkpoint. Every wrong answer sends the item it tests back into
 * review straight away. Attempting the checkpoint completes it for unlocking.
 */
export function completeCheckpoint(
  progress: LearnerProgress,
  index: CurriculumIndex,
  lessonId: string,
  results: ReadonlyArray<ExerciseResult>,
  now: number,
): CheckpointOutcome {
  const lesson = index.lesson(lessonId);
  if (!lesson || lesson.kind !== 'checkpoint') throw new Error(`${lessonId} is not a checkpoint`);
  const score = results.length === 0 ? 0 : results.filter((result) => result.correct).length / results.length;
  const missedLessonIds = [
    ...new Set(
      results
        .filter((result) => !result.correct)
        .map((result) => lesson.exercises.find((exercise) => `${lesson.id}/${exercise.id}` === result.exerciseId)?.testsLesson)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const previous: LessonProgress = progress.lessons[lessonId] ?? { timesCompleted: 0 };
  return {
    score,
    passed: score >= CHECKPOINT_PASS,
    missedLessonIds,
    progress: {
      ...progress,
      items: gradeAll(progress.items, results, 'focused', now),
      lessons: {
        ...progress.lessons,
        [lessonId]: {
          ...previous,
          startedAt: previous.startedAt ?? now,
          completedAt: previous.completedAt ?? now,
          timesCompleted: previous.timesCompleted + 1,
          lastScore: score,
          bestScore: Math.max(previous.bestScore ?? 0, score),
        },
      },
      days: countAnswers(progress, results.length, now),
    },
  };
}

/**
 * A stage's final checkpoint taken early, to skip ahead. Passing marks every
 * lesson up to it as done, so the path continues after it; the skipped
 * lessons' items are not scheduled because they were never taught here.
 * Failing changes only the tested items, and the checkpoint stays open.
 */
export function completePlacement(
  progress: LearnerProgress,
  index: CurriculumIndex,
  lessonId: string,
  results: ReadonlyArray<ExerciseResult>,
  now: number,
): CheckpointOutcome {
  const scored = completeCheckpoint(progress, index, lessonId, results, now);
  const lessons = { ...scored.progress.lessons };
  if (!scored.passed) {
    const previous = progress.lessons[lessonId] ?? { timesCompleted: 0 };
    lessons[lessonId] = { ...previous, lastScore: scored.score, bestScore: Math.max(previous.bestScore ?? 0, scored.score) };
  } else {
    for (const earlier of index.lessons.slice(0, index.lesson(lessonId)!.order)) {
      if (!lessons[earlier.id]?.completedAt) lessons[earlier.id] = { timesCompleted: 0, ...lessons[earlier.id], completedAt: now };
    }
  }
  return { ...scored, progress: { ...scored.progress, lessons } };
}

/**
 * Combines two copies of progress written by different extension pages (the
 * side panel and an in-page card). Per item and lesson the most recently
 * practised copy wins, so neither page loses the other's answers. `b` is the
 * newer write and wins ties.
 */
export function mergeProgress(a: LearnerProgress, b: LearnerProgress): LearnerProgress {
  const items = { ...a.items };
  for (const [id, item] of Object.entries(b.items)) {
    const mine = items[id];
    if (!mine || item.lastPracticedAt >= mine.lastPracticedAt) items[id] = item;
  }
  const lessons = { ...a.lessons };
  for (const [id, lesson] of Object.entries(b.lessons)) {
    const mine = lessons[id];
    if (!mine || lesson.timesCompleted >= mine.timesCompleted) lessons[id] = lesson;
  }
  const days = { ...a.days };
  for (const [day, count] of Object.entries(b.days)) days[day] = Math.max(days[day] ?? 0, count);
  return { version: 2, items, lessons, days };
}
