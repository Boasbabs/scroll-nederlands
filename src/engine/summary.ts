// A small progress summary for the side panel. No analytics, no leaderboards.
import type { CurriculumIndex } from '../curriculum/assemble';
import type { LearningItem, Lesson } from '../curriculum/types';
import { isSet, type PlacedPack } from '../packs/assemble';
import { DAY, HOUR, itemStrength, type ItemStrength } from './schedule';
import { getNextLesson, getNextScene, isLessonDone, packActivity } from './selection';
import { dayKey } from './progress';
import type { LearnerProgress } from './types';

export type CountOf = { completed: number; total: number };

export type StrengthCount = Record<ItemStrength, number> & { total: number };

function countStrength(items: ReadonlyArray<LearningItem>, progress: LearnerProgress): StrengthCount {
  const counts = { new: 0, learning: 0, strong: 0, total: items.length };
  for (const item of items) counts[itemStrength(progress.items[item.id])]++;
  return counts;
}

/** One topic's items by strength, and how many of them are due now (the Topics tab). */
export type TopicSummary = StrengthCount & { due: number };

export function summarizeTopic(items: ReadonlyArray<LearningItem>, progress: LearnerProgress, now: number): TopicSummary {
  const due = items.filter((item) => (progress.items[item.id]?.dueAt ?? Infinity) <= now).length;
  return { ...countStrength(items, progress), due };
}

/** One pack: its scenes done, the next one, and its members (the Topics tab). */
export type PackSummary = {
  scenes: CountOf;
  /** The first scene not done yet; none once the pack is finished. */
  next?: Lesson;
  /** A scene has been started or finished. */
  started: boolean;
  items: TopicSummary;
};

export function summarizePack(pack: PlacedPack, progress: LearnerProgress, now: number): PackSummary {
  return {
    scenes: { completed: pack.scenes.filter((scene) => isLessonDone(progress, scene.id)).length, total: pack.scenes.length },
    next: getNextScene(pack, progress),
    started: packActivity(pack, progress) !== undefined,
    items: summarizeTopic(pack.members, progress, now),
  };
}

/** The course's own items: those its lessons teach (not the basic words or sound contrasts beside it). */
function courseItems(index: CurriculumIndex): Array<LearningItem> {
  return index.lessons.flatMap((lesson) => lesson.items);
}

export type ProgressSummary = {
  lessons: CountOf;
  stages: Array<{ id: string; title: string; level: string } & CountOf>;
  modules: Record<string, CountOf>;
  /** Where the learner is on the path (undefined once the course is finished). */
  current?: { stageId: string; moduleId: string; lessonId: string };
  /** The course's learning items by strength. Completing lessons alone never makes an item strong. */
  items: StrengthCount;
  /** The basic-word list by strength, course words included. */
  words: StrengthCount;
  /** The sound contrasts (ear training) by strength. */
  sounds: StrengthCount;
  /** The nouns' de/het items by strength. */
  articles: StrengthCount;
  /** The situations (packs that are not sets): how many are started, and their own items by strength. */
  packs: { started: number; total: number; items: StrengthCount };
  dueNow: number;
  /** Due within the next 7 days, per day, starting today. */
  forecast: Array<number>;
  /** First-try accuracy over the recent answers kept per item. */
  accuracy: { correct: number; answered: number };
  /** Days with practice in the last 7 days, today included. */
  activeDays: number;
  /** The last 7 days, oldest first, today last: whether the learner practised. */
  week: Array<boolean>;
  /** Consecutive days with practice, ending today (or yesterday, if today is still open). */
  streak: number;
  /** Scheduled reviews by when they fall due (overdue counts as today). */
  upcoming: { today: number; tomorrow: number; thisWeek: number; later: number };
  /** The next review once nothing is due: when, and how many items arrive within the hour after it. */
  nextReview?: { at: number; count: number };
};

export function summarizeProgress(index: CurriculumIndex, progress: LearnerProgress, now: number): ProgressSummary {
  const modules: Record<string, CountOf> = {};
  const stages = index.curriculum.stages.map((stage) => {
    let completed = 0;
    let total = 0;
    for (const module of stage.modules) {
      const done = module.lessons.filter((lesson) => isLessonDone(progress, lesson.id)).length;
      modules[module.id] = { completed: done, total: module.lessons.length };
      completed += done;
      total += module.lessons.length;
    }
    return { id: stage.id, title: stage.title, level: stage.level, completed, total };
  });

  const items = countStrength(courseItems(index), progress);
  const words = countStrength(index.words, progress);
  const sounds = countStrength(index.sounds, progress);
  const articles = countStrength(index.articles, progress);
  const situations = index.packs.filter((pack) => !isSet(pack));
  const packs = {
    started: situations.filter((pack) => packActivity(pack, progress) !== undefined).length,
    total: situations.length,
    items: countStrength(situations.flatMap((pack) => pack.items), progress),
  };

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const forecast = Array.from({ length: 7 }, () => 0);
  let dueNow = 0;
  let correct = 0;
  let answered = 0;
  for (const [id, item] of Object.entries(progress.items)) {
    if (!index.item(id)) continue;
    if (item.dueAt <= now) dueNow++;
    const day = Math.max(0, Math.floor((item.dueAt - startOfToday.getTime()) / DAY));
    if (day < 7) forecast[day]!++;
    for (const attempt of item.history) {
      answered++;
      if (attempt.correct) correct++;
    }
  }

  const next = getNextLesson(index, progress);
  const practised = (daysAgo: number) => (progress.days[dayKey(now - daysAgo * DAY)] ?? 0) > 0;
  const week = Array.from({ length: 7 }, (_, i) => practised(6 - i));
  let streak = 0;
  for (let daysAgo = practised(0) ? 0 : 1; practised(daysAgo); daysAgo++) streak++;

  const scheduled = Object.entries(progress.items).filter(([id]) => index.item(id)).map(([, item]) => item.dueAt);
  const thisWeek = forecast.slice(2).reduce((sum, count) => sum + count, 0);
  const upcoming = { today: forecast[0]!, tomorrow: forecast[1]!, thisWeek, later: scheduled.length - forecast[0]! - forecast[1]! - thisWeek };
  const future = scheduled.filter((dueAt) => dueAt > now);
  const nextAt = dueNow === 0 && future.length > 0 ? Math.min(...future) : undefined;

  return {
    lessons: { completed: stages.reduce((sum, stage) => sum + stage.completed, 0), total: index.lessons.length },
    stages,
    modules,
    current: next ? { stageId: next.stageId, moduleId: next.moduleId, lessonId: next.id } : undefined,
    items,
    words,
    sounds,
    articles,
    packs,
    dueNow,
    forecast,
    accuracy: { correct, answered },
    activeDays: week.filter(Boolean).length,
    week,
    streak,
    upcoming,
    nextReview: nextAt === undefined ? undefined : { at: nextAt, count: future.filter((dueAt) => dueAt <= nextAt + HOUR).length },
  };
}

/** Course items grouped by how well they are known (the Progress screen's lists). */
export function itemsByStrength(index: CurriculumIndex, progress: LearnerProgress): Record<ItemStrength, Array<LearningItem>> {
  const groups: Record<ItemStrength, Array<LearningItem>> = { new: [], learning: [], strong: [] };
  for (const item of courseItems(index)) groups[itemStrength(progress.items[item.id])].push(item);
  return groups;
}
