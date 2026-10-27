import type { Curriculum, CurriculumModule, CurriculumStage, Lesson } from '../curriculum/types';
import { getDueReviews, getNextLesson, isLessonCompleted } from './selection';
import { LEARNING_LEVELS, type LearnerProgress, type LearningItemProgress, type LearningLevel } from './types';

/** Recalled without help and has survived at least a week-long interval. */
export function isItemStrong(item: LearningItemProgress | undefined): boolean {
  if (!item) return false;
  return LEARNING_LEVELS.indexOf(item.level) >= LEARNING_LEVELS.indexOf('independentRecall') && item.step >= 3;
}

export const LEVEL_LABELS: Record<LearningLevel, string> = {
  introduced: 'Seen',
  recognition: 'Recognised',
  supportedRecall: 'Recalled with hints',
  independentRecall: 'Recalled',
  transfer: 'Used in a new situation',
};

export type ProgressSummary = {
  totalLessons: number;
  completedLessons: number;
  dueNow: number;
  strongItems: number;
  levelCounts: Record<LearningLevel, number>;
  correctAnswers: number;
  incorrectAnswers: number;
  checkpointsPassed: number;
  totalCheckpoints: number;
  nextLesson: Lesson | undefined;
  currentStage: CurriculumStage | undefined;
  currentModule: CurriculumModule | undefined;
};

export function summarizeProgress(
  source: Curriculum,
  lessons: Array<Lesson>,
  progress: LearnerProgress,
  now: number,
): ProgressSummary {
  const levelCounts = Object.fromEntries(LEARNING_LEVELS.map((level) => [level, 0])) as Record<LearningLevel, number>;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  for (const item of Object.values(progress.items)) {
    levelCounts[item.level] += 1;
    correctAnswers += item.correctCount;
    incorrectAnswers += item.incorrectCount;
  }

  const nextLesson = getNextLesson(source, lessons, progress);
  const currentStage = source.stages.find((stage) => stage.id === nextLesson?.stageId) ?? source.stages.at(-1);
  const currentModule = currentStage?.modules.find((module) => module.id === nextLesson?.moduleId);
  const checkpoints = lessons.filter((lesson) => lesson.kind === 'checkpoint');

  return {
    totalLessons: lessons.length,
    completedLessons: lessons.filter((lesson) => isLessonCompleted(progress, lesson.id)).length,
    dueNow: getDueReviews(lessons, progress, now).length,
    strongItems: Object.values(progress.items).filter(isItemStrong).length,
    levelCounts,
    correctAnswers,
    incorrectAnswers,
    checkpointsPassed: checkpoints.filter((lesson) => progress.checkpoints[lesson.id]?.passedAt).length,
    totalCheckpoints: checkpoints.length,
    nextLesson,
    currentStage,
    currentModule,
  };
}

export function moduleCompletion(module: CurriculumModule, progress: LearnerProgress): { done: number; total: number } {
  return {
    done: module.lessons.filter((lesson) => isLessonCompleted(progress, lesson.id)).length,
    total: module.lessons.length,
  };
}
