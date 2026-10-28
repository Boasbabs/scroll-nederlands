// When article items join the schedule (docs/fluent-forever-plan.md, Phase 3):
// with their noun when it is met, and, for nouns met before the de/het drill
// existed, a few a day.
import { articleItemId, nounIdOf } from '../articles/assemble';
import type { CurriculumIndex } from '../curriculum/assemble';
import { introduceItem } from './schedule';
import { startOfDay } from './selection';
import type { LearnerProgress } from './types';

/** Article items of nouns met earlier join the reviews at most this many a day (counting those started with a new noun). */
export const ARTICLES_PER_DAY = 10;

/**
 * Starts the article items of nouns met for the first time. Nothing about
 * the article was asked yet, so the first "de or het?" comes about a day
 * later, apart from the meaning.
 */
export function introduceArticles(index: CurriculumIndex, progress: LearnerProgress, nounIds: ReadonlyArray<string>, now: number): LearnerProgress {
  const fresh = nounIds.map(articleItemId).filter((id) => index.item(id) && !progress.items[id]);
  if (fresh.length === 0) return progress;
  const items = { ...progress.items };
  for (const id of fresh) items[id] = introduceItem({ correctStages: [], mistakes: 0 }, now);
  return { ...progress, items };
}

/** Article items whose noun is met but which are not started: nouns learned earlier. The longest-known noun first. */
export function pendingArticleIds(index: CurriculumIndex, progress: LearnerProgress): Array<string> {
  const met = (id: string) => progress.items[nounIdOf(id)]?.introducedAt ?? Number.POSITIVE_INFINITY;
  return index.articles
    .filter((item) => !progress.items[item.id] && progress.items[nounIdOf(item.id)])
    .map((item) => item.id)
    .sort((a, b) => met(a) - met(b));
}

/** Article items started today, with a new noun or catching up. */
export function articlesStartedToday(index: CurriculumIndex, progress: LearnerProgress, now: number): number {
  const start = startOfDay(now);
  return index.articles.filter((item) => (progress.items[item.id]?.introducedAt ?? -1) >= start).length;
}

/**
 * Nouns met before the de/het drill existed: up to today's allowance of their
 * article items join the reviews, due now. Returns `progress` itself when
 * there is nothing to add.
 */
export function catchUpArticles(index: CurriculumIndex, progress: LearnerProgress, now: number): LearnerProgress {
  const room = ARTICLES_PER_DAY - articlesStartedToday(index, progress, now);
  if (room <= 0) return progress;
  const ids = pendingArticleIds(index, progress).slice(0, room);
  if (ids.length === 0) return progress;
  const items = { ...progress.items };
  for (const id of ids) items[id] = { ...introduceItem({ correctStages: [], mistakes: 0 }, now), dueAt: now };
  return { ...progress, items };
}
