// Phase 3: de/het items beside every singular noun, their drill and how they join the schedule.
import { ARTICLES_STAGE, articleItemId, articleOf, isArticleItemId, nounIdOf, withoutArticle } from '../../src/articles/assemble';
import { ARTICLES_PER_DAY, articlesStartedToday, catchUpArticles, introduceArticles, pendingArticleIds } from '../../src/engine/articles';
import { chooseReviewExercise, generateExercise, seededRandom } from '../../src/engine/exercises';
import { exerciseSteps, introStepIds, planLesson, planWords } from '../../src/engine/plan';
import { completeLesson } from '../../src/engine/progress';
import { DAY, introduceItem } from '../../src/engine/schedule';
import { getDueItemIds } from '../../src/engine/selection';
import { summarizeProgress } from '../../src/engine/summary';
import { emptyProgress, type LearnerProgress } from '../../src/engine/types';
import { bundledFile, pictureCheck } from '../../src/images/pictures';
import { EXERCISE_STAGES, type ChoiceExercise } from '../../src/curriculum/types';
import type { WordTheme } from '../../src/words/types';
import { makeCourse, testWordThemes } from '../fixtures/curriculum';
import { setupLearning } from '../ui/harness';

const T0 = new Date(2026, 9, 28, 9).getTime();
const index = makeCourse({}, testWordThemes);

/** The first lesson teaches a noun ("het huis"), a plural ("de huizen") and a phrase starting with "Het". */
const nounLesson = {
  'x0-a-hello': {
    items: [
      { key: 'hallo-daar', dutch: 'Hallo daar', english: 'Hello there', kind: 'phrase' as const },
      { key: 'het-huis', dutch: 'het huis', english: 'the house', kind: 'word' as const },
      { key: 'de-huizen', dutch: 'de huizen', english: 'the houses', kind: 'word' as const },
      { key: 'het-is-laat', dutch: 'Het is laat.', english: 'It is late.', kind: 'phrase' as const },
    ],
  },
};
const withNouns = makeCourse(nounLesson, testWordThemes);

function met(itemIds: ReadonlyArray<string>, at: number): LearnerProgress {
  const progress = emptyProgress();
  for (const id of itemIds) progress.items[id] = introduceItem({ correctStages: ['recognition'], mistakes: 0 }, at);
  return progress;
}

describe('article items', () => {
  it('sit beside every singular noun of the word track, with permanent ids', () => {
    expect(index.articles.map((item) => item.id)).toEqual([
      'w-kitchen/vork#article',
      'w-kitchen/mes#article',
      'w-kitchen/lepel#article',
      'w-kitchen/glas#article',
      'w-animals/hond#article',
      'w-animals/kat#article',
    ]);
    expect(index.item('w-kitchen/mes#article')).toMatchObject({
      dutch: 'het mes',
      kind: 'word',
      recognitionOnly: true,
      stageId: ARTICLES_STAGE,
      lessonId: ARTICLES_STAGE,
      primary: false,
    });
  });

  it('cover course nouns, but not plurals, phrases or the word track’s plurals', () => {
    const plural: WordTheme = { id: 'people', title: 'People', words: [{ key: 'mensen', dutch: 'de mensen', english: 'people', pos: 'noun', plural: true }] };
    const course = makeCourse(nounLesson, [...testWordThemes, plural]);
    expect(course.articles[0]?.id).toBe('x0-a-hello/het-huis#article');
    expect(course.articles).toHaveLength(1 + 6);
    expect(course.item('x0-a-hello/de-huizen#article')).toBeUndefined();
    expect(course.item('x0-a-hello/het-is-laat#article')).toBeUndefined();
    expect(course.item('w-people/mensen#article')).toBeUndefined();
  });

  it('read the article and the bare noun from the Dutch', () => {
    expect(articleOf('het mes')).toBe('het');
    expect(articleOf('De fiets')).toBe('de');
    expect(articleOf('een fiets')).toBeUndefined();
    expect(withoutArticle('het e-mailadres')).toBe('e-mailadres');
    expect(nounIdOf(articleItemId('w-kitchen/mes'))).toBe('w-kitchen/mes');
    expect(isArticleItemId('w-kitchen/mes')).toBe(false);
  });
});

describe('the de or het drill', () => {
  it('asks for the article of the bare noun at every stage, with no audio before answering', () => {
    for (const stage of EXERCISE_STAGES) {
      const drill = generateExercise(index, index.item('w-kitchen/mes#article')!, stage, 0, seededRandom(stage)) as ChoiceExercise;
      expect(drill).toMatchObject({ kind: 'choice', stage, prompt: 'De or het?', noun: 'mes', options: ['de', 'het'], answer: 'het', items: ['w-kitchen/mes#article'] });
      expect(drill.audioText).toBeUndefined();
      expect(drill.picture).toBeUndefined();
      expect(drill.explanation).toBe('het mes means "the knife". It is a het-word.');
    }
  });

  it('says which sense is meant when the bare noun takes the other article in another sense', () => {
    const cv = makeCourse(
      { 'x0-a-hello': { items: [{ key: 'cv', dutch: 'het cv', english: 'the CV', kind: 'word' as const, articleCue: 'the CV you send when you apply for a job' }] } },
      testWordThemes,
    );
    const drill = generateExercise(cv, cv.item('x0-a-hello/cv#article')!, 'recognition', 0, seededRandom('x'));
    expect(drill).toMatchObject({ prompt: 'De or het?', noun: 'cv', situation: 'the CV you send when you apply for a job', answer: 'het' });
    expect(generateExercise(index, index.item('w-kitchen/mes#article')!, 'recognition', 0, seededRandom('x')).situation).toBeUndefined();
  });

  it('shows the noun’s picture when it has one', () => {
    const drill = generateExercise(index, index.item('w-kitchen/vork#article')!, 'recognition', 0, seededRandom('x'), { hasPicture: (id) => id === 'w-kitchen/vork' });
    expect(drill).toMatchObject({ picture: 'w-kitchen/vork', answer: 'de' });
  });

  it('is what a review of an article item gets', () => {
    const planned = chooseReviewExercise(index, 'w-kitchen/glas#article', undefined, 'micro', seededRandom('r'));
    expect(planned).toMatchObject({ exerciseId: 'gen:w-kitchen/glas#article:gen-article', generated: true, itemIds: ['w-kitchen/glas#article'] });
  });

  it('keeps article items out of other drills’ wrong options', () => {
    for (let seed = 0; seed < 40; seed++) {
      const random = seededRandom(`d${seed}`);
      for (const item of index.words) {
        const drill = generateExercise(index, item, 'recognition', 0, random);
        if (drill.kind === 'choice') expect(drill.options.join(' ')).not.toContain('(de or het)');
      }
    }
  });
});

describe('scheduling article items', () => {
  it('starts a new noun’s article item with it, first asked a day later', async () => {
    const setup = setupLearning(index);
    const plan = (await setup.learning.startWords('focused'))!;
    expect(introStepIds(plan)).toEqual(['w-kitchen/vork', 'w-animals/hond', 'w-kitchen/mes', 'x0-a-thanks/dank-je-wel', 'w-kitchen/lepel']);
    const results = exerciseSteps(plan).map((planned) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct: true }));
    const outcome = await setup.learning.finish(plan, results);
    expect(outcome.newItemIds).toHaveLength(5);
    const progress = await setup.store.readProgress();
    expect(Object.keys(progress.items).filter(isArticleItemId).sort()).toEqual([
      'w-animals/hond#article',
      'w-kitchen/lepel#article',
      'w-kitchen/mes#article',
      'w-kitchen/vork#article',
    ]);
    expect(progress.items['w-kitchen/mes#article']).toMatchObject({ stage: 'introduced', introducedAt: setup.now(), dueAt: setup.now() + DAY });
    expect(getDueItemIds(progress, setup.now() + DAY).filter(isArticleItemId)).toHaveLength(4);
  });

  it('starts the article items of a lesson’s nouns with the lesson', async () => {
    const setup = setupLearning(withNouns);
    const plan = await setup.learning.startLesson('x0-a-hello', 'focused');
    const results = exerciseSteps(plan).map((planned) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct: true }));
    await setup.learning.finish(plan, results);
    const progress = await setup.store.readProgress();
    expect(Object.keys(progress.items).filter(isArticleItemId)).toEqual(['x0-a-hello/het-huis#article']);
  });

  it('does not start article items for nouns the session did not introduce', () => {
    const progress = introduceArticles(index, emptyProgress(), ['x0-a-thanks/dank-je-wel', 'p-a-aa'], T0);
    expect(progress.items).toEqual({});
  });

  it('lets nouns met before catch up, a few a day, due straight away', () => {
    const nouns: WordTheme = {
      id: 'things',
      title: 'Things',
      words: Array.from({ length: 14 }, (_, i) => ({ key: `ding-${i}`, dutch: `het ding${i}`, english: `thing ${i}`, pos: 'noun' as const })),
    };
    const course = makeCourse({}, [nouns]);
    // Met on two earlier days: the older ones catch up first.
    let progress = met(nouns.words.slice(0, 7).map((word) => `w-things/${'key' in word ? word.key : ''}`), T0 - 5 * DAY);
    progress = { ...progress, items: { ...progress.items, ...met(nouns.words.slice(7).map((word) => `w-things/${'key' in word ? word.key : ''}`), T0 - 9 * DAY).items } };
    expect(pendingArticleIds(course, progress)[0]).toBe('w-things/ding-7#article');

    const today = catchUpArticles(course, progress, T0);
    const started = Object.keys(today.items).filter(isArticleItemId);
    expect(started).toHaveLength(ARTICLES_PER_DAY);
    expect(today.items['w-things/ding-7#article']).toMatchObject({ stage: 'introduced', dueAt: T0 });
    expect(articlesStartedToday(course, today, T0)).toBe(ARTICLES_PER_DAY);
    // Nothing more today: the same object comes back.
    expect(catchUpArticles(course, today, T0 + 1000)).toBe(today);

    const tomorrow = catchUpArticles(course, today, T0 + DAY);
    expect(Object.keys(tomorrow.items).filter(isArticleItemId)).toHaveLength(14);
    expect(pendingArticleIds(course, tomorrow)).toEqual([]);
    expect(catchUpArticles(course, tomorrow, T0 + 2 * DAY)).toBe(tomorrow);
  });

  it('counts a new noun’s article item toward the day’s catch-up', () => {
    let progress = met(['w-kitchen/vork', 'w-kitchen/mes', 'w-kitchen/lepel'], T0 - 3 * DAY);
    progress = introduceArticles(index, { ...progress, items: { ...progress.items, ...met(['w-kitchen/glas'], T0).items } }, ['w-kitchen/glas'], T0);
    expect(articlesStartedToday(index, progress, T0)).toBe(1);
    const caught = catchUpArticles(index, progress, T0);
    expect(Object.keys(caught.items).filter(isArticleItemId)).toHaveLength(4);
  });

  it('happens when the learner opens the panel or a prompt (the snapshot)', async () => {
    const setup = setupLearning(index);
    await setup.store.updateProgress(() => met(['w-kitchen/vork', 'w-kitchen/mes'], T0 - 3 * DAY));
    const snap = await setup.learning.snapshot('focused');
    expect(Object.keys(snap.progress.items).filter(isArticleItemId)).toEqual(['w-kitchen/vork#article', 'w-kitchen/mes#article']);
    expect(snap.next).toMatchObject({ type: 'review', itemIds: expect.arrayContaining(['w-kitchen/vork#article', 'w-kitchen/mes#article']) });
    expect(Object.keys((await setup.store.readProgress()).items)).toHaveLength(4);
  });

  it('counts articles on their own in the summary', () => {
    let progress = completeLesson(emptyProgress(), withNouns, 'x0-a-hello', [], 'focused', T0);
    progress = introduceArticles(withNouns, progress, ['x0-a-hello/het-huis'], T0);
    const summary = summarizeProgress(withNouns, progress, T0);
    expect(summary.articles).toEqual({ new: 6, learning: 1, strong: 0, total: 7 });
    expect(summary.items.total).toBe(withNouns.lessons.flatMap((lesson) => lesson.items).length);
  });

  it('show their noun’s picture', () => {
    const images = { 'de vork': { file: 'vork-1.webp', author: 'A', source: '', license: 'CC0 1.0', licenseUrl: '' } };
    expect(bundledFile(index, images, 'w-kitchen/vork#article')).toBe('vork-1.webp');
    const has = pictureCheck(index, images, { 'w-kitchen/mes': T0 });
    expect(has('w-kitchen/mes#article')).toBe(true);
    expect(has('w-kitchen/vork#article')).toBe(true);
    expect(has('w-kitchen/lepel#article')).toBe(false);
  });
});

describe('lesson plans', () => {
  it('stay as they were: article items are drilled in reviews, not in the lesson', () => {
    const plan = planLesson(withNouns, 'x0-a-hello', 'focused');
    expect(exerciseSteps(plan).flatMap((planned) => planned.itemIds).some(isArticleItemId)).toBe(false);
    expect(exerciseSteps(planWords(index, ['w-kitchen/mes'], 'focused', 's')).flatMap((planned) => planned.itemIds)).toEqual(['w-kitchen/mes', 'w-kitchen/mes']);
  });
});
