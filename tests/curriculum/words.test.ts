// The basic-word list (src/words): 1,000 words beside the course, never a word twice.
import { course } from '../../src/curriculum';
import { normalizeAnswer } from '../../src/engine/answers';
import { wordGap } from '../../src/engine/exercises';
import { bareWord, isCourseWord, placeWords } from '../../src/words/assemble';
import { wordThemes } from '../../src/words/content';
import type { NewWord } from '../../src/words/types';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const courseItems = course.lessons.flatMap((lesson) => lesson.items);
const newWords = wordThemes.flatMap((theme) => theme.words.filter((entry): entry is NewWord => !isCourseWord(entry)).map((word) => ({ theme, word })));

describe('the basic-word list', () => {
  it('has 1,000 words, 625 in tier 1 and 375 in tier 2, every reference found in the course', () => {
    const placed = placeWords(wordThemes, courseItems);
    expect(placed.unresolved).toEqual([]);
    expect(course.words).toHaveLength(1000);
    expect(new Set(course.words.map((item) => item.id)).size).toBe(1000);
    const inTier = (tier: 1 | 2) => wordThemes.filter((theme) => (theme.tier ?? 1) === tier).flatMap((theme) => theme.words);
    expect(inTier(1)).toHaveLength(625);
    expect(inTier(2)).toHaveLength(375);
  });

  it('teaches every tier-2 word new, from a sentence that has it', () => {
    const issues: Array<string> = [];
    for (const theme of wordThemes.filter((theme) => theme.tier === 2)) {
      for (const entry of theme.words) {
        if (isCourseWord(entry)) issues.push(`${theme.id}: "${entry.ref}" is a course word`);
        else if (!wordGap(entry)) issues.push(`${theme.id}/${entry.key}: "${entry.dutch}" is not in its example`);
      }
    }
    expect(issues).toEqual([]);
  });

  it('leaves the course alone', () => {
    expect(course.lessons).toHaveLength(272);
    expect(courseItems).toHaveLength(1024);
  });

  it('never teaches a word twice, articles aside', () => {
    const taught = new Map(courseItems.map((item) => [bareWord(item.dutch), item.id]));
    const repeats: Array<string> = [];
    for (const { theme, word } of newWords) {
      const earlier = taught.get(bareWord(word.dutch));
      if (earlier) repeats.push(`${theme.id}/${word.key} "${word.dutch}" is already ${earlier}`);
      else taught.set(bareWord(word.dutch), `${theme.id}/${word.key}`);
    }
    expect(repeats).toEqual([]);
  });

  it('has well-formed themes and words', () => {
    const issues: Array<string> = [];
    const themeIds = new Set<string>();
    for (const theme of wordThemes) {
      if (!KEBAB.test(theme.id) || themeIds.has(theme.id)) issues.push(`theme id ${theme.id}`);
      themeIds.add(theme.id);
      // Generated drills need wrong options from the same theme.
      if (theme.words.length < 4) issues.push(`${theme.id}: fewer than 4 words`);
      const keys = new Set<string>();
      const meanings = new Set<string>();
      for (const entry of theme.words) {
        const english = isCourseWord(entry) ? course.words.find((item) => normalizeAnswer(item.dutch) === normalizeAnswer(entry.ref))?.english : entry.english;
        if (!english?.trim()) issues.push(`${theme.id}: no English for ${JSON.stringify(entry)}`);
        else if (meanings.has(normalizeAnswer(english))) issues.push(`${theme.id}: English "${english}" twice`);
        else meanings.add(normalizeAnswer(english));
        if (isCourseWord(entry)) continue;
        if (!KEBAB.test(entry.key) || keys.has(entry.key)) issues.push(`${theme.id}: key ${entry.key}`);
        keys.add(entry.key);
        const article = /^(de|het) \S/.test(entry.dutch);
        if (entry.pos === 'noun' && !article) issues.push(`${theme.id}/${entry.key}: noun without de or het`);
        if (entry.pos === 'noun' && entry.plural && !entry.dutch.startsWith('de ')) issues.push(`${theme.id}/${entry.key}: plurals take de`);
        if (entry.pos !== 'noun' && /^(de|het|een) /.test(entry.dutch)) issues.push(`${theme.id}/${entry.key}: only nouns carry an article`);
        if (entry.dutch !== entry.dutch.trim() || entry.english !== entry.english.trim()) issues.push(`${theme.id}/${entry.key}: stray spaces`);
      }
    }
    expect(issues).toEqual([]);
  });

  it('mixes themes in each day’s batch', () => {
    const firstFive = course.words.slice(0, 5).map((item) => item.moduleId);
    expect(new Set(firstFive).size).toBe(5);
  });
});
