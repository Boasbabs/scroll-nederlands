import type { Curriculum, Exercise, ExerciseStage, Lesson } from '../curriculum/types';
import { getNextLearningStage } from './progress';
import type { Activity, LearnerProgress, LearningItemProgress, LearningMode } from './types';

const STAGES: Array<ExerciseStage> = ['recognition', 'supportedRecall', 'independentRecall', 'transfer'];

function lastAttemptAt(item: LearningItemProgress | undefined, exerciseId: string): number {
  if (!item) return -1;
  for (let i = item.history.length - 1; i >= 0; i--) {
    if (item.history[i]!.exerciseId === exerciseId) return item.history[i]!.at;
  }
  return -1;
}

/**
 * Pick the exercise for a stage. Falls back to the nearest easier stage, then
 * harder, when the lesson has nothing usable at that stage (e.g. only
 * focused-only items in micro mode). Among equals, the least recently seen wins.
 * Learners at the top level alternate between independent recall and transfer.
 */
export function getExerciseForStage(
  lesson: Lesson,
  stage: ExerciseStage,
  mode: LearningMode,
  item?: LearningItemProgress,
): Exercise | undefined {
  const usable = lesson.exercises.filter((exercise) => mode === 'focused' || !exercise.focusedOnly);
  const target = STAGES.indexOf(stage);
  const searchOrder = [
    target,
    ...Array.from({ length: target }, (_, i) => target - 1 - i),
    ...Array.from({ length: STAGES.length - 1 - target }, (_, i) => target + 1 + i),
  ];

  for (const rank of searchOrder) {
    const stages = item?.level === 'transfer' && rank === 3 ? ['independentRecall', 'transfer'] : [STAGES[rank]];
    const candidates = usable.filter((exercise) => stages.includes(exercise.stage));
    if (candidates.length > 0) {
      return [...candidates].sort((a, b) => lastAttemptAt(item, a.id) - lastAttemptAt(item, b.id))[0];
    }
  }
  return undefined;
}

/** Exercises shown straight after the learn card: recognition, plus supported recall in focused practice. */
export function getInitialExercises(lesson: Lesson, mode: LearningMode): Array<Exercise> {
  const recognition = getExerciseForStage(lesson, 'recognition', mode);
  const supported = mode === 'focused' ? lesson.exercises.find((e) => e.stage === 'supportedRecall') : undefined;
  return [recognition, supported].filter((exercise): exercise is Exercise => exercise !== undefined);
}

export function isLessonCompleted(progress: LearnerProgress, lessonId: string): boolean {
  return lessonId in progress.completedLessons;
}

/**
 * A lesson can be opened when it is already completed, or when its stage is
 * open (stage 0 always; later stages once every checkpoint of the previous
 * stage has been attempted) and its explicit prerequisites are completed.
 * Checkpoints also need every lesson they revisit.
 */
export function isLessonUnlocked(source: Curriculum, progress: LearnerProgress, lesson: Lesson): boolean {
  if (isLessonCompleted(progress, lesson.id)) return true;
  const stageIndex = source.stages.findIndex((stage) => stage.id === lesson.stageId);
  if (stageIndex > 0) {
    const previous = source.stages[stageIndex - 1]!;
    const checkpoints = previous.modules.flatMap((module) => module.lessons).filter((l) => l.kind === 'checkpoint');
    if (!checkpoints.every((checkpoint) => isLessonCompleted(progress, checkpoint.id))) return false;
  }
  const required = [...(lesson.prerequisites ?? []), ...(lesson.kind === 'checkpoint' ? (lesson.revisits ?? []) : [])];
  return required.every((id) => isLessonCompleted(progress, id));
}

/** Items whose review is due, most overdue first. Checkpoints are not scheduled items. */
export function getDueReviews(
  lessons: Array<Lesson>,
  progress: LearnerProgress,
  now: number,
  excludeLessonIds: ReadonlyArray<string> = [],
): Array<{ lesson: Lesson; item: LearningItemProgress }> {
  return lessons
    .filter((lesson) => lesson.kind !== 'checkpoint' && !excludeLessonIds.includes(lesson.id))
    .map((lesson) => ({ lesson, item: progress.items[lesson.id] }))
    .filter((entry): entry is { lesson: Lesson; item: LearningItemProgress } =>
      entry.item !== undefined && isLessonCompleted(progress, entry.lesson.id) && entry.item.dueAt <= now,
    )
    .sort((a, b) => a.item.dueAt - b.item.dueAt);
}

/** The first lesson in curriculum order that is not completed and can be opened. */
export function getNextLesson(source: Curriculum, lessons: Array<Lesson>, progress: LearnerProgress): Lesson | undefined {
  return lessons.find(
    (lesson) => !isLessonCompleted(progress, lesson.id) && isLessonUnlocked(source, progress, lesson),
  );
}

export type SelectionContext = {
  mode: LearningMode;
  now: number;
  /** Lessons not to offer again (e.g. failed earlier in this browsing session). */
  excludeLessonIds?: ReadonlyArray<string>;
};

/**
 * What to do next: a due review beats new material; otherwise continue the
 * curriculum. Micro mode never starts a checkpoint; it points to focused practice.
 */
export function getNextActivity(
  source: Curriculum,
  lessons: Array<Lesson>,
  progress: LearnerProgress,
  context: SelectionContext,
): Activity {
  for (const { lesson, item } of getDueReviews(lessons, progress, context.now, context.excludeLessonIds)) {
    const exercise = getExerciseForStage(lesson, getNextLearningStage(item.level), context.mode, item);
    if (exercise) return { kind: 'review', lesson, exercise, item };
  }

  const next = getNextLesson(source, lessons, progress);
  if (!next) return { kind: 'done' };
  if (next.kind === 'checkpoint') {
    return context.mode === 'focused' ? { kind: 'checkpoint', lesson: next } : { kind: 'focused-only', lesson: next };
  }
  return { kind: 'new-lesson', lesson: next };
}
