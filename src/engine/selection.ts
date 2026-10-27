// What to practise next. Due reviews come before new material.
import type { CurriculumIndex } from '../curriculum/assemble';
import type { Lesson } from '../curriculum/types';
import { ITEM_STAGES, type LearnerProgress, type PracticeMode } from './types';

/** How many due items one sitting takes on. */
export const REVIEW_BATCH: Record<PracticeMode, number> = { micro: 3, focused: 10 };

export type NextActivity =
  | { type: 'review'; itemIds: Array<string>; dueCount: number }
  | { type: 'lesson'; lessonId: string }
  | { type: 'checkpoint'; lessonId: string }
  /** Nothing suitable right now. In micro mode a waiting checkpoint is offered for the side panel. */
  | { type: 'caughtUp'; nextDueAt?: number; checkpointLessonId?: string }
  | { type: 'finished' };

/** Due items, most overdue first; among equals, the least advanced first. */
export function getDueItemIds(
  progress: LearnerProgress,
  now: number,
  exclude: ReadonlySet<string> = new Set(),
): Array<string> {
  return Object.entries(progress.items)
    .filter(([id, item]) => item.dueAt <= now && !exclude.has(id))
    .sort(
      ([, a], [, b]) => a.dueAt - b.dueAt || ITEM_STAGES.indexOf(a.stage) - ITEM_STAGES.indexOf(b.stage),
    )
    .map(([id]) => id);
}

export function nextDueAt(progress: LearnerProgress): number | undefined {
  let earliest: number | undefined;
  for (const item of Object.values(progress.items)) {
    if (earliest === undefined || item.dueAt < earliest) earliest = item.dueAt;
  }
  return earliest;
}

export function isLessonDone(progress: LearnerProgress, lessonId: string): boolean {
  return Boolean(progress.lessons[lessonId]?.completedAt);
}

/**
 * The course is a path: a lesson opens once every earlier lesson is done,
 * and declared prerequisites are done too. Checkpoints count as done once
 * attempted, so a stage's checkpoint must be tried before the next stage.
 */
export function isLessonUnlocked(index: CurriculumIndex, progress: LearnerProgress, lessonId: string): boolean {
  const lesson = index.lesson(lessonId);
  if (!lesson) return false;
  const earlierDone = index.lessons.slice(0, lesson.order).every((earlier) => isLessonDone(progress, earlier.id));
  return earlierDone && (lesson.prerequisites ?? []).every((id) => isLessonDone(progress, id));
}

/** The first lesson in course order that is not done yet. */
export function getNextLesson(index: CurriculumIndex, progress: LearnerProgress): Lesson | undefined {
  return index.lessons.find((lesson) => !isLessonDone(progress, lesson.id));
}

export type SelectionOptions = {
  mode: PracticeMode;
  /** Items not to offer again now, e.g. ones failed earlier in this browsing session. */
  excludeItemIds?: ReadonlySet<string>;
};

export function getNextActivity(
  index: CurriculumIndex,
  progress: LearnerProgress,
  now: number,
  { mode, excludeItemIds }: SelectionOptions,
): NextActivity {
  const due = getDueItemIds(progress, now, excludeItemIds).filter((id) => index.item(id));
  if (due.length > 0) return { type: 'review', itemIds: due.slice(0, REVIEW_BATCH[mode]), dueCount: due.length };

  const next = getNextLesson(index, progress);
  if (!next) return { type: 'finished' };
  if (next.kind === 'checkpoint') {
    if (mode === 'focused') return { type: 'checkpoint', lessonId: next.id };
    return { type: 'caughtUp', nextDueAt: nextDueAt(progress), checkpointLessonId: next.id };
  }
  return { type: 'lesson', lessonId: next.id };
}

/**
 * Items for extra practice: due ones first, then the least secure
 * (relearning, then the lowest stage, then the soonest due).
 */
export function pickPracticeItems(
  index: CurriculumIndex,
  progress: LearnerProgress,
  now: number,
  count: number,
  exclude: ReadonlySet<string> = new Set(),
): Array<string> {
  const due = getDueItemIds(progress, now, exclude);
  const rest = Object.entries(progress.items)
    .filter(([id, item]) => item.dueAt > now && !exclude.has(id))
    .sort(
      ([, a], [, b]) =>
        Number(b.relearning) - Number(a.relearning) ||
        ITEM_STAGES.indexOf(a.stage) - ITEM_STAGES.indexOf(b.stage) ||
        a.dueAt - b.dueAt,
    )
    .map(([id]) => id);
  return [...due, ...rest].filter((id) => index.item(id)).slice(0, count);
}

/** A stage's final checkpoint: the one a learner can take early to skip the stage. */
export function stageCheckpointId(index: CurriculumIndex, stageId: string): string | undefined {
  return index.lessons.filter((lesson) => lesson.stageId === stageId && lesson.kind === 'checkpoint').at(-1)?.id;
}
