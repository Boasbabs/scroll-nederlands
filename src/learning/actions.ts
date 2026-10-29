// The one bridge from the UI to the engine and storage. The side panel and the
// in-page card both use it, so both modes share one schedule and one progress.
import { withCorrections } from '../corrections/assemble';
import { findCorrections } from '../corrections/diff';
import type { Correction, Draft } from '../corrections/types';
import type { CurriculumIndex } from '../curriculum/assemble';
import { articleItemId } from '../articles/assemble';
import { catchUpArticles, introduceArticles } from '../engine/articles';
import type { DrillContext } from '../engine/exercises';
import { leechCheck } from '../engine/notes';
import { exerciseSteps, introStepIds, planCheckpoint, planLesson, planReview, planSounds, planWords, type SessionPlan } from '../engine/plan';
import { completeCheckpoint, completeLesson, completeNewItems, completePlacement, markLessonStarted, recordReviewResults } from '../engine/progress';
import {
  getNewContrastId,
  getNewWordIds,
  getNextActivity,
  getNextScene,
  isLessonUnlocked,
  pickPracticeItems,
  REVIEW_BATCH,
  stageCheckpointId,
  themeWordsLeftToday,
  WORD_BATCH,
  wordsLeftToday,
  type NextActivity,
} from '../engine/selection';
import { introduceItem } from '../engine/schedule';
import { summarizeProgress, type ProgressSummary } from '../engine/summary';
import type { ExerciseResult, LearnerProgress, PracticeMode } from '../engine/types';
import type { ImageManifest } from '../images/manifest';
import { pictureCheck } from '../images/pictures';
import type { LearnerPreferences, MissionIndex, NoteIndex, Store } from '../storage/store';

export type Snapshot = {
  progress: LearnerProgress;
  prefs: LearnerPreferences;
  summary: ProgressSummary;
  next: NextActivity;
  /** New basic words still allowed today. */
  wordsLeftToday: number;
  /** Writing sent for correction, newest first. */
  drafts: Array<Draft>;
  /** The packs whose mission the learner ticked. */
  missions: MissionIndex;
};

/** What a writing exercise's text is kept with while it waits for correction. */
export type DraftInput = Pick<Draft, 'text' | 'prompt' | 'exerciseId'>;

export type SessionOutcome = {
  kind: SessionPlan['kind'];
  correct: number;
  total: number;
  /** Items answered wrong (on the first try) in this session. */
  missedItemIds: Array<string>;
  /**
   * New items that started their review schedule (lessons, word batches, ear
   * training). A new noun's de/het item starts with it but is not listed: it is the same word.
   */
  newItemIds: Array<string>;
  checkpoint?: { score: number; passed: boolean; missedLessonIds: Array<string> };
  /** When the soonest of this session's items is due again. */
  nextReviewAt?: number;
  next: NextActivity;
};

export type LearningDeps = {
  store: Store;
  course: CurriculumIndex;
  /** The bundled pictures (src/images/manifest.ts); none unless given. */
  images?: ImageManifest;
  now?: () => number;
};

export function createLearning({ store, course: base, images = {}, now = Date.now }: LearningDeps) {
  /** The course plus the learner's corrections as items, brought up to date by sync(). */
  let course = base;
  async function sync(): Promise<void> {
    course = withCorrections(base, Object.values(await store.readCorrections()));
  }

  /**
   * Drills show pictures for items that have one (bundled, or the learner's
   * own) and the learner's notes; reviews mark the items that keep slipping.
   */
  async function drillContext(progress: LearnerProgress): Promise<DrillContext> {
    const [own, notes, offered] = await Promise.all([store.readPictures(), store.readNotes(), store.readLeeches()]);
    return {
      hasPicture: pictureCheck(course, images, own),
      noteFor: (itemId) => notes[itemId]?.text,
      leech: leechCheck(course, progress, notes, own, offered),
    };
  }

  async function snapshot(mode: PracticeMode, excludeItemIds?: ReadonlySet<string>): Promise<Snapshot> {
    await sync();
    const [stored, prefs, drafts, missions] = await Promise.all([store.readProgress(), store.readPreferences(), store.readDrafts(), store.readMissions()]);
    const at = now();
    // Nouns met before the de/het drill existed: a few of their article items a day join the reviews.
    const progress = catchUpArticles(course, stored, at) === stored ? stored : await store.updateProgress((current) => catchUpArticles(course, current, at));
    return {
      progress,
      prefs,
      summary: summarizeProgress(course, progress, at),
      next: getNextActivity(course, progress, at, { mode, excludeItemIds, newWordsPerDay: prefs.newWordsPerDay }),
      wordsLeftToday: Math.min(
        wordsLeftToday(course, progress, at, prefs.newWordsPerDay),
        course.words.filter((item) => !progress.items[item.id]).length,
      ),
      drafts: Object.values(drafts).sort((a, b) => b.at - a.at),
      missions,
    };
  }

  /** A topic's practice pool: its words, and the de/het item of each noun among them. */
  function topicPool(topicId: string): Set<string> | undefined {
    const theme = course.themes.find((entry) => entry.id === topicId);
    if (!theme) return undefined;
    const ids = theme.items.map((item) => item.id);
    return new Set([...ids, ...ids.map(articleItemId)]);
  }

  /**
   * A pack's practice pool: its own items, the course items of the modules it
   * builds on, and the de/het item of each noun among them.
   */
  function packPool(packId: string): Set<string> | undefined {
    const pack = course.packs.find((entry) => entry.id === packId);
    if (!pack) return undefined;
    const modules = new Set(pack.buildsOn);
    const courseItems = course.lessons.filter((lesson) => modules.has(lesson.moduleId)).flatMap((lesson) => lesson.items);
    const ids = [...pack.items, ...courseItems].map((item) => item.id);
    return new Set([...ids, ...ids.map(articleItemId)]);
  }

  /** A specific lesson from the roadmap, or a pack's scene. Locked lessons cannot be started. */
  async function startLesson(lessonId: string, mode: PracticeMode): Promise<SessionPlan> {
    await sync();
    const progress = await store.readProgress();
    if (!isLessonUnlocked(course, progress, lessonId)) throw new Error(`${lessonId} is locked`);
    await store.updateProgress((current) => markLessonStarted(current, lessonId, now()));
    return planLesson(course, lessonId, mode, `${now()}`);
  }

  /** The plan for an activity the engine suggested, or undefined when there is nothing to do. */
  function planActivity(activity: NextActivity, progress: LearnerProgress, mode: PracticeMode, context: DrillContext): SessionPlan | undefined {
    const seed = `${now()}`;
    switch (activity.type) {
      case 'review':
        return planReview(course, progress, activity.itemIds, mode, seed, context);
      case 'lesson':
        return planLesson(course, activity.lessonId, mode, seed);
      case 'checkpoint':
        return planCheckpoint(course, activity.lessonId);
      case 'words':
        return planWords(course, activity.itemIds, mode, seed, context);
      default:
        return undefined;
    }
  }

  return {
    snapshot,

    /** Due reviews first, then the next lesson (or checkpoint in focused practice). */
    async startNext(mode: PracticeMode, excludeItemIds?: ReadonlySet<string>): Promise<SessionPlan | undefined> {
      const { progress, next } = await snapshot(mode, excludeItemIds);
      const plan = planActivity(next, progress, mode, await drillContext(progress));
      if (plan?.lessonId && plan.kind === 'lesson') await store.updateProgress((current) => markLessonStarted(current, plan.lessonId!, now()));
      return plan;
    },

    startLesson,

    /** Due reviews only (the "Review now" button). */
    async startReview(mode: PracticeMode): Promise<SessionPlan | undefined> {
      const { progress, next } = await snapshot('focused');
      if (next.type !== 'review') return undefined;
      return planReview(course, progress, next.itemIds, mode, `${now()}`, await drillContext(progress));
    },

    /**
     * Extra practice of the given items, or of the least secure ones. Correct
     * answers before an item is due never push its review out (see recordAnswer).
     */
    async startPractice(mode: PracticeMode, itemIds?: ReadonlyArray<string>): Promise<SessionPlan | undefined> {
      await sync();
      const progress = await store.readProgress();
      const ids = (itemIds ?? pickPracticeItems(course, progress, now(), REVIEW_BATCH[mode])).filter((id) => course.item(id));
      if (ids.length === 0) return undefined;
      return planReview(course, progress, ids, mode, `${now()}`, await drillContext(progress));
    },

    /** New basic words, up to today's limit (the Today screen's New words row). */
    async startWords(mode: PracticeMode): Promise<SessionPlan | undefined> {
      await sync();
      const [progress, prefs] = await Promise.all([store.readProgress(), store.readPreferences()]);
      const count = Math.min(WORD_BATCH[mode], wordsLeftToday(course, progress, now(), prefs.newWordsPerDay));
      const ids = getNewWordIds(course, progress, count);
      return ids.length > 0 ? planWords(course, ids, mode, `${now()}`, await drillContext(progress)) : undefined;
    },

    /** One topic's practice (the Topics tab): its due items first, then the least secure. */
    async startTopicPractice(topicId: string): Promise<SessionPlan | undefined> {
      await sync();
      const pool = topicPool(topicId);
      if (!pool) return undefined;
      const progress = await store.readProgress();
      const ids = pickPracticeItems(course, progress, now(), REVIEW_BATCH.focused, new Set(), pool);
      return ids.length > 0 ? planReview(course, progress, ids, 'focused', `${now()}`, await drillContext(progress)) : undefined;
    },

    /** New words from one topic, within today's limits (the Topics tab). */
    async startTopicWords(topicId: string): Promise<SessionPlan | undefined> {
      await sync();
      const [progress, prefs] = await Promise.all([store.readProgress(), store.readPreferences()]);
      const count = Math.min(WORD_BATCH.focused, themeWordsLeftToday(course, progress, now(), prefs.newWordsPerDay, topicId));
      const ids = getNewWordIds(course, progress, count, topicId);
      return ids.length > 0 ? planWords(course, ids, 'focused', `${now()}`, await drillContext(progress)) : undefined;
    },

    /** A pack's next scene, in focused mode (Today's Continue row, the end of a scene). Nothing once every scene is done. */
    async startNextScene(packId: string): Promise<SessionPlan | undefined> {
      const pack = course.packs.find((entry) => entry.id === packId);
      const scene = pack && getNextScene(pack, await store.readProgress());
      return scene ? startLesson(scene.id, 'focused') : undefined;
    },

    /** Practice of one pack (Practise this pack): its due items first, then the least secure, with the course items it builds on. */
    async startPackPractice(packId: string): Promise<SessionPlan | undefined> {
      await sync();
      const pool = packPool(packId);
      if (!pool) return undefined;
      const progress = await store.readProgress();
      const ids = pickPracticeItems(course, progress, now(), REVIEW_BATCH.focused, new Set(), pool);
      return ids.length > 0 ? planReview(course, progress, ids, 'focused', `${now()}`, await drillContext(progress)) : undefined;
    },

    /** Ticks or unticks a pack's "Do it for real" mission. Kept apart from progress: it is never scored. */
    setMission: (packId: string, done: boolean): Promise<MissionIndex> => store.setMission(packId, done ? now() : undefined),

    /**
     * Ear training (the Today screen's row): the next sound contrast not met
     * yet. Once every contrast is met, a round over the least secure ones.
     */
    async startSounds(): Promise<SessionPlan | undefined> {
      const progress = await store.readProgress();
      const itemId = getNewContrastId(course, progress);
      if (itemId) return planSounds(course, itemId, `${now()}`);
      const met = Object.fromEntries(course.sounds.flatMap((item) => (progress.items[item.id] ? [[item.id, progress.items[item.id]!]] : [])));
      const ids = pickPracticeItems(course, { ...progress, items: met }, now(), REVIEW_BATCH.focused);
      return ids.length > 0 ? planReview(course, progress, ids, 'focused', `${now()}`) : undefined;
    },

    /** A stage's final checkpoint, taken early to skip the stage. */
    startPlacement(stageId: string): SessionPlan {
      const lessonId = stageCheckpointId(course, stageId);
      if (!lessonId) throw new Error(`${stageId} has no checkpoint`);
      return { ...planCheckpoint(course, lessonId), placement: true };
    },

    /** Saves a finished session and says what comes next. */
    async finish(plan: SessionPlan, results: ReadonlyArray<ExerciseResult>): Promise<SessionOutcome> {
      await sync();
      const at = now();
      const prefs = await store.readPreferences();
      let checkpoint: SessionOutcome['checkpoint'];
      let newItemIds: Array<string> = [];
      const progress = await store.updateProgress((current) => {
        if (plan.kind === 'review') return recordReviewResults(current, results, plan.mode, at);
        if (plan.kind === 'words' || plan.kind === 'sounds') {
          const ids = introStepIds(plan);
          newItemIds = ids.filter((id) => !current.items[id]);
          return introduceArticles(course, completeNewItems(current, ids, results, plan.mode, at), newItemIds, at);
        }
        if (plan.kind === 'checkpoint') {
          const complete = plan.placement ? completePlacement : completeCheckpoint;
          const outcome = complete(current, course, plan.lessonId!, results, at);
          checkpoint = { score: outcome.score, passed: outcome.passed, missedLessonIds: outcome.missedLessonIds };
          return outcome.progress;
        }
        newItemIds = (course.lesson(plan.lessonId!)?.items ?? []).filter((item) => !current.items[item.id]).map((item) => item.id);
        return introduceArticles(course, completeLesson(current, course, plan.lessonId!, results, plan.mode, at), newItemIds, at);
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
        next: getNextActivity(course, progress, at, { mode: plan.mode, newWordsPerDay: prefs.newWordsPerDay }),
      };
    },

    /** The learner's own lines about items (Make it yours). */
    readNotes: (): Promise<NoteIndex> => store.readNotes(),

    /** Saves the learner's line about an item; empty text removes it. */
    saveNote: (itemId: string, text: string): Promise<NoteIndex> => store.setNote(itemId, text, now()),

    /** Remembers that a slipping item was offered "Make it yours", so it is offered once. */
    offerLeech: (itemId: string) => store.markLeech(itemId, now()).then(() => undefined),

    /** Keeps a text sent for correction until the corrected version comes back (the Review tab lists it). */
    async saveDraft(input: DraftInput): Promise<Draft> {
      const at = now();
      const draft: Draft = { ...input, id: `d-${at.toString(36)}`, at };
      await store.setDraft(draft.id, draft);
      return draft;
    },

    removeDraft: (draftId: string) => store.setDraft(draftId, undefined).then(() => undefined),

    /**
     * Compares a draft with its corrected version. Each change becomes an item
     * (first practised a day later) and the draft is done. No changes, no items.
     */
    async correctDraft(draftId: string, corrected: string): Promise<Array<Correction>> {
      const draft = (await store.readDrafts())[draftId];
      if (!draft) throw new Error(`No draft ${draftId}`);
      const at = now();
      const added = findCorrections(draft.text, corrected, at);
      if (added.length > 0) {
        await store.addCorrections(added);
        await store.updateProgress((current) => ({
          ...current,
          items: { ...current.items, ...Object.fromEntries(added.filter((correction) => !current.items[correction.id]).map((correction) => [correction.id, introduceItem({ correctStages: [], mistakes: 0 }, at)])) },
        }));
      }
      await store.setDraft(draftId, undefined);
      return added;
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
