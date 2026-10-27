// The one bridge from the UI to the engine and storage. The side panel and the
// in-page card both use it, so both modes share one schedule and one progress.
import type { CurriculumIndex } from '../curriculum/assemble';
import { exerciseSteps, planCheckpoint, planLesson, planReview, type SessionPlan } from '../engine/plan';
import { completeCheckpoint, completeLesson, completePlacement, markLessonStarted, recordReviewResults } from '../engine/progress';
import {
  getNextActivity,
  isLessonUnlocked,
  pickPracticeItems,
  REVIEW_BATCH,
  stageCheckpointId,
  type NextActivity,
} from '../engine/selection';
import { summarizeProgress, type ProgressSummary } from '../engine/summary';
import type { ExerciseResult, LearnerProgress, PracticeMode } from '../engine/types';
import type { LearnerPreferences, Store } from '../storage/store';

export type Snapshot = {
  progress: LearnerProgress;
  prefs: LearnerPreferences;
  summary: ProgressSummary;
  next: NextActivity;
};

export type SessionOutcome = {
  kind: SessionPlan['kind'];
  correct: number;
  total: number;
  /** Items answered wrong (on the first try) in this session. */
  missedItemIds: Array<string>;
  /** New items that started their review schedule (lessons only). */
  newItemIds: Array<string>;
  checkpoint?: { score: number; passed: boolean; missedLessonIds: Array<string> };
  /** When the soonest of this session's items is due again. */
  nextReviewAt?: number;
  next: NextActivity;
};

export type LearningDeps = {
  store: Store;
  course: CurriculumIndex;
  now?: () => number;
};

export function createLearning({ store, course, now = Date.now }: LearningDeps) {
  async function snapshot(mode: PracticeMode, excludeItemIds?: ReadonlySet<string>): Promise<Snapshot> {
    const [progress, prefs] = await Promise.all([store.readProgress(), store.readPreferences()]);
    const at = now();
    return {
      progress,
      prefs,
      summary: summarizeProgress(course, progress, at),
      next: getNextActivity(course, progress, at, { mode, excludeItemIds }),
    };
  }

  /** The plan for an activity the engine suggested, or undefined when there is nothing to do. */
  function planActivity(activity: NextActivity, progress: LearnerProgress, mode: PracticeMode): SessionPlan | undefined {
    const seed = `${now()}`;
    switch (activity.type) {
      case 'review':
        return planReview(course, progress, activity.itemIds, mode, seed);
      case 'lesson':
        return planLesson(course, activity.lessonId, mode, seed);
      case 'checkpoint':
        return planCheckpoint(course, activity.lessonId);
      default:
        return undefined;
    }
  }

  return {
    snapshot,

    /** Due reviews first, then the next lesson (or checkpoint in focused practice). */
    async startNext(mode: PracticeMode, excludeItemIds?: ReadonlySet<string>): Promise<SessionPlan | undefined> {
      const { progress, next } = await snapshot(mode, excludeItemIds);
      const plan = planActivity(next, progress, mode);
      if (plan?.lessonId && plan.kind === 'lesson') await store.updateProgress((current) => markLessonStarted(current, plan.lessonId!, now()));
      return plan;
    },

    /** A specific lesson from the roadmap. Locked lessons cannot be started. */
    async startLesson(lessonId: string, mode: PracticeMode): Promise<SessionPlan> {
      const progress = await store.readProgress();
      if (!isLessonUnlocked(course, progress, lessonId)) throw new Error(`${lessonId} is locked`);
      await store.updateProgress((current) => markLessonStarted(current, lessonId, now()));
      return planLesson(course, lessonId, mode, `${now()}`);
    },

    /** Due reviews only (the "Review now" button). */
    async startReview(mode: PracticeMode): Promise<SessionPlan | undefined> {
      const { progress, next } = await snapshot('focused');
      if (next.type !== 'review') return undefined;
      return planReview(course, progress, next.itemIds, mode, `${now()}`);
    },

    /**
     * Extra practice of the given items, or of the least secure ones. Correct
     * answers before an item is due never push its review out (see recordAnswer).
     */
    async startPractice(mode: PracticeMode, itemIds?: ReadonlyArray<string>): Promise<SessionPlan | undefined> {
      const progress = await store.readProgress();
      const ids = (itemIds ?? pickPracticeItems(course, progress, now(), REVIEW_BATCH[mode])).filter((id) => course.item(id));
      if (ids.length === 0) return undefined;
      return planReview(course, progress, ids, mode, `${now()}`);
    },

    /** A stage's final checkpoint, taken early to skip the stage. */
    startPlacement(stageId: string): SessionPlan {
      const lessonId = stageCheckpointId(course, stageId);
      if (!lessonId) throw new Error(`${stageId} has no checkpoint`);
      return { ...planCheckpoint(course, lessonId), placement: true };
    },

    /** Saves a finished session and says what comes next. */
    async finish(plan: SessionPlan, results: ReadonlyArray<ExerciseResult>): Promise<SessionOutcome> {
      const at = now();
      let checkpoint: SessionOutcome['checkpoint'];
      let newItemIds: Array<string> = [];
      const progress = await store.updateProgress((current) => {
        if (plan.kind === 'review') return recordReviewResults(current, results, plan.mode, at);
        if (plan.kind === 'checkpoint') {
          const complete = plan.placement ? completePlacement : completeCheckpoint;
          const outcome = complete(current, course, plan.lessonId!, results, at);
          checkpoint = { score: outcome.score, passed: outcome.passed, missedLessonIds: outcome.missedLessonIds };
          return outcome.progress;
        }
        newItemIds = (course.lesson(plan.lessonId!)?.items ?? []).filter((item) => !current.items[item.id]).map((item) => item.id);
        return completeLesson(current, course, plan.lessonId!, results, plan.mode, at);
      });
      const touched = new Set([...results.flatMap((result) => result.itemIds), ...newItemIds]);
      const dueTimes = [...touched].map((id) => progress.items[id]?.dueAt).filter((dueAt): dueAt is number => dueAt !== undefined);
      return {
        kind: plan.kind,
        correct: results.filter((result) => result.correct).length,
        total: results.length,
        missedItemIds: [...new Set(results.filter((result) => !result.correct).flatMap((result) => result.itemIds))],
        newItemIds,
        checkpoint,
        nextReviewAt: dueTimes.length > 0 ? Math.min(...dueTimes) : undefined,
        next: getNextActivity(course, progress, at, { mode: plan.mode }),
      };
    },

    updatePreferences: (patch: Partial<LearnerPreferences>) => store.updatePreferences(patch),
    resetProgress: () => store.resetProgress(),
  };
}

export type Learning = ReturnType<typeof createLearning>;

/** How many graded exercises a plan has (for the progress bar). */
export function countExercises(plan: SessionPlan): number {
  return exerciseSteps(plan).length;
}
