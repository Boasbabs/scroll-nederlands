// The de/het drill (docs/fluent-forever-plan.md, Phase 3): every singular noun,
// in the course or the basic-word track, gets an article item. It is scheduled
// apart from the noun's meaning and practised only by choosing de or het
// (articleDrill in src/engine/exercises.ts).
import type { LearningItem } from '../curriculum/types';
import { normalizeAnswer } from '../engine/answers';

/** The stage id (and lesson and module id) of every article item; course lessons never use it. */
export const ARTICLES_STAGE = 'articles';

const SUFFIX = '#article';

export type Article = 'de' | 'het';

/** The permanent id of a noun's article item. */
export function articleItemId(nounId: string): string {
  return `${nounId}${SUFFIX}`;
}

export function isArticleItemId(itemId: string): boolean {
  return itemId.endsWith(SUFFIX);
}

/** The noun an article item drills; any other id stays as it is (an article item shows its noun's picture). */
export function nounIdOf(itemId: string): string {
  return isArticleItemId(itemId) ? itemId.slice(0, -SUFFIX.length) : itemId;
}

/** "het" for "het mes", "de" for "De fiets", undefined for anything else. */
export function articleOf(dutch: string): Article | undefined {
  const first = normalizeAnswer(dutch).split(' ')[0];
  return first === 'de' || first === 'het' ? first : undefined;
}

/** The noun as written, without its article: "het e-mailadres" → "e-mailadres". */
export function withoutArticle(dutch: string): string {
  return dutch.trim().replace(/^(de|het)\s+/i, '');
}

/**
 * The course's plural words. A plural always takes de, so it gets no article
 * item. (The word track marks its own plurals.)
 */
export const COURSE_PLURALS: ReadonlySet<string> = new Set([
  'de fietsen',
  'de huizen',
  'de meisjes',
  'de kinderen',
  'de sleutels',
  'de ouders',
  'de buren',
  'de boodschappen',
  'de bewoners',
  'de klachten',
  'de openingstijden',
]);

/** A course item that is a singular noun: a word with de or het, not in the plural. */
export function isCourseNoun(item: LearningItem): boolean {
  return item.kind === 'word' && articleOf(item.dutch) !== undefined && !COURSE_PLURALS.has(normalizeAnswer(item.dutch));
}

export function placeArticles(nouns: ReadonlyArray<LearningItem>): Array<LearningItem> {
  return nouns.map(
    (noun): LearningItem => ({
      key: `${noun.key}${SUFFIX}`,
      // The noun with its article, as "Review these" lists show it.
      dutch: noun.dutch,
      english: `${noun.english} (de or het)`,
      kind: 'word',
      recognitionOnly: true,
      id: articleItemId(noun.id),
      lessonId: ARTICLES_STAGE,
      moduleId: ARTICLES_STAGE,
      stageId: ARTICLES_STAGE,
      primary: false,
    }),
  );
}
