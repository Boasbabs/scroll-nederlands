// The bundled course's de/het items (Phase 3): one per singular noun, none for plurals or phrases.
import { articleItemId, articleOf, COURSE_PLURALS, isArticleItemId, nounIdOf, takesEitherArticle } from '../../src/articles/assemble';
import { course } from '../../src/curriculum';
import { normalizeAnswer } from '../../src/engine/answers';
import { wordThemes } from '../../src/words/content';
import { isCourseWord } from '../../src/words/assemble';

describe('the de/het items', () => {
  const courseItems = course.lessons.flatMap((lesson) => lesson.items);

  it('give every singular noun one item, with a permanent id', () => {
    const ids = course.articles.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of course.articles) {
      expect(isArticleItemId(item.id)).toBe(true);
      const noun = course.item(nounIdOf(item.id))!;
      expect(noun).toBeDefined();
      expect(item.dutch).toBe(noun.dutch);
      expect(articleOf(noun.dutch)).toMatch(/^(de|het)$/);
    }
  });

  it('cover the course’s nouns except its plurals and those that take de or het', () => {
    const nouns = courseItems.filter((item) => item.kind === 'word' && articleOf(item.dutch));
    for (const noun of nouns) {
      const plural = COURSE_PLURALS.has(normalizeAnswer(noun.dutch));
      expect(course.item(articleItemId(noun.id)) === undefined, noun.dutch).toBe(plural || takesEitherArticle(noun));
    }
    // Every listed plural is a course word, so a typo cannot hide one.
    for (const plural of COURSE_PLURALS) expect(nouns.some((noun) => normalizeAnswer(noun.dutch) === plural), plural).toBe(true);
    // Phrases that start with an article ("Het is al laat.") are not nouns.
    expect(courseItems.filter((item) => item.kind !== 'word' && course.item(articleItemId(item.id)))).toEqual([]);
  });

  it('cover the word track’s nouns except its plurals and those that take de or het', () => {
    for (const theme of wordThemes) {
      for (const entry of theme.words) {
        if (isCourseWord(entry)) continue;
        const has = course.item(articleItemId(`w-${theme.id}/${entry.key}`)) !== undefined;
        expect(has, entry.dutch).toBe(entry.pos === 'noun' && !entry.plural && !takesEitherArticle(entry));
      }
    }
  });

  it('cover the packs’ nouns except their plurals and those that take de or het', () => {
    for (const item of course.packs.flatMap((pack) => pack.items)) {
      const noun = item.kind === 'word' && articleOf(item.dutch) !== undefined && !item.plural && !takesEitherArticle(item);
      expect(course.item(articleItemId(item.id)) !== undefined, item.dutch).toBe(noun);
    }
  });

  // The Woordenlijst lists each of these as m/o, m/v/o or v/o (checked 2026-10-29).
  it('give none to the nouns that take de or het', () => {
    expect(course.items.filter((item) => takesEitherArticle(item)).map((item) => item.id)).toEqual([
      's3-read-notice/het-gft-afval',
      's3-write-form/het-afval',
      'w-home/deken',
      'w-home/gordijn',
      'w-food/snoep',
      'w-kitchen/aanrecht',
      'w-clothing/t-shirt',
      'w-fruit-veg/knoflook',
      'w-ideas/idee',
      'w-ideas/risico',
      'w-feelings/heimwee',
    ]);
  });

  it('number 129 course nouns and 480 from the word track (348 in tier 1, 132 in tier 2), besides the packs’', () => {
    const from = (prefix: string) => (item: { id: string }) => nounIdOf(item.id).startsWith(prefix);
    expect(course.articles.filter((item) => !from('w-')(item) && !from('sc-')(item))).toHaveLength(129);
    expect(course.articles.filter(from('w-'))).toHaveLength(480);
  });
});
