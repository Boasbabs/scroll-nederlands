// Places the basic-word list beside the course. New words become learning
// items; references resolve to the course item that already teaches the word.
import type { LearningItem } from '../curriculum/types';
import { normalizeAnswer } from '../engine/answers';
import type { CourseWord, WordEntry, WordTheme } from './types';

/** The stage id of every new word item; course lessons never use it. */
export const WORDS_STAGE = 'words';

export function isCourseWord(entry: WordEntry): entry is CourseWord {
  return 'ref' in entry;
}

/** The word without its article: "de fiets", "een fiets" and "fiets" are one word. */
export function bareWord(dutch: string): string {
  return normalizeAnswer(dutch).replace(/^(de|het|een) /, '');
}

/** One theme of the list, in its own order: most useful first (the Topics tab). */
export type PlacedTheme = {
  id: string;
  title: string;
  /** New items and the course items referenced. */
  items: Array<LearningItem>;
};

export type PlacedWords = {
  /** New word items, added to the course's items. */
  items: Array<LearningItem>;
  /** The whole list in introduction order: new items and the course items referenced. */
  words: Array<LearningItem>;
  themes: Array<PlacedTheme>;
  /** New items that are singular nouns (each gets a de/het article item, src/articles). */
  nouns: Array<LearningItem>;
  /** References that match no course item (the validator reports them). */
  unresolved: Array<string>;
};

/** Round-robin across themes, so a day's batch mixes them: ten fruits learned together blur. */
function interleave<T>(lists: ReadonlyArray<ReadonlyArray<T>>): Array<T> {
  const longest = Math.max(0, ...lists.map((list) => list.length));
  const mixed: Array<T> = [];
  for (let i = 0; i < longest; i++) {
    for (const list of lists) if (i < list.length) mixed.push(list[i]!);
  }
  return mixed;
}

export function placeWords(themes: ReadonlyArray<WordTheme>, courseItems: ReadonlyArray<LearningItem>): PlacedWords {
  const byDutch = new Map(courseItems.map((item) => [normalizeAnswer(item.dutch), item]));
  const items: Array<LearningItem> = [];
  const nouns: Array<LearningItem> = [];
  const unresolved: Array<string> = [];
  const perTheme = themes.map((theme) =>
    theme.words.flatMap((entry): Array<LearningItem> => {
      if (isCourseWord(entry)) {
        const item = byDutch.get(normalizeAnswer(entry.ref));
        if (!item) unresolved.push(`${theme.id}: ${entry.ref}`);
        return item ? [item] : [];
      }
      const moduleId = `w-${theme.id}`;
      const item: LearningItem = {
        key: entry.key,
        dutch: entry.dutch,
        english: entry.english,
        kind: 'word',
        ...(entry.accept ? { accept: entry.accept } : {}),
        ...(entry.note ? { note: entry.note } : {}),
        id: `${moduleId}/${entry.key}`,
        lessonId: moduleId,
        moduleId,
        stageId: WORDS_STAGE,
        primary: false,
      };
      items.push(item);
      if (entry.pos === 'noun' && !entry.plural) nouns.push(item);
      return [item];
    }),
  );
  return {
    items,
    words: interleave(perTheme),
    themes: themes.map((theme, i) => ({ id: theme.id, title: theme.title, items: perTheme[i]! })),
    nouns,
    unresolved,
  };
}
