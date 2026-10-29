import { exerciseSteps, introStepIds, planWords, type SessionPlan } from '../../src/engine/plan';
import { completeNewItems } from '../../src/engine/progress';
import { DAY } from '../../src/engine/schedule';
import { getNewWordIds, pickPracticeItems, themeWordsLeftToday, wordsLeftToday } from '../../src/engine/selection';
import { summarizeTopic } from '../../src/engine/summary';
import { emptyProgress, type ExerciseResult, type LearnerProgress } from '../../src/engine/types';
import type { WordTheme } from '../../src/words/types';
import { makeCourse, testWordThemes } from '../fixtures/curriculum';
import { setupLearning } from '../ui/harness';

const T0 = new Date(2026, 9, 29, 9).getTime();
const index = makeCourse({}, testWordThemes);

/** A theme longer than one batch, to show the one-batch-a-day rule. */
const nature: WordTheme = {
  id: 'nature',
  title: 'Nature',
  words: ['boom', 'bloem', 'berg', 'zee', 'rivier', 'wolk', 'zon'].map((word) => ({ key: word, dutch: `de ${word}`, english: word, pos: 'noun' as const })),
};
const big = makeCourse({}, [nature, ...testWordThemes]);

function answers(plan: SessionPlan): Array<ExerciseResult> {
  return exerciseSteps(plan).map((planned) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct: true }));
}

function learn(course: typeof index, progress: LearnerProgress, itemIds: Array<string>, at: number): LearnerProgress {
  const plan = planWords(course, itemIds, 'focused', 'test');
  return completeNewItems(progress, introStepIds(plan), answers(plan), 'focused', at);
}

describe('word themes in the index', () => {
  it('keeps each theme in its own order, course items included', () => {
    expect(index.themes.map((theme) => [theme.id, theme.title, theme.items.map((item) => item.id)])).toEqual([
      ['kitchen', 'Kitchen', ['w-kitchen/vork', 'w-kitchen/mes', 'w-kitchen/lepel', 'w-kitchen/glas']],
      ['animals', 'Animals', ['w-animals/hond', 'x0-a-thanks/dank-je-wel', 'w-animals/kat']],
    ]);
  });
});

describe('new words from one theme', () => {
  it('takes the theme’s unmet words in its own order', () => {
    const progress = learn(index, emptyProgress(), ['w-kitchen/vork'], T0 - DAY);
    expect(getNewWordIds(index, progress, 2, 'kitchen')).toEqual(['w-kitchen/mes', 'w-kitchen/lepel']);
    expect(getNewWordIds(index, progress, 2)).toEqual(['w-animals/hond', 'w-kitchen/mes']);
    expect(getNewWordIds(index, progress, 5, 'unknown')).toEqual([]);
  });

  it('stays within the daily limit, the theme’s words and one batch a theme a day', () => {
    expect(themeWordsLeftToday(index, emptyProgress(), T0, 10, 'kitchen')).toBe(4);
    expect(themeWordsLeftToday(index, emptyProgress(), T0, 3, 'kitchen')).toBe(3);
    expect(themeWordsLeftToday(index, emptyProgress(), T0, 0, 'kitchen')).toBe(0);
    expect(themeWordsLeftToday(index, emptyProgress(), T0, 10, 'unknown')).toBe(0);

    const batch = getNewWordIds(big, emptyProgress(), 5, 'nature');
    const today = learn(big, emptyProgress(), batch, T0);
    expect(themeWordsLeftToday(big, today, T0, 10, 'nature')).toBe(0);
    // Other themes still have today's limit left; tomorrow the theme gives its last two.
    expect(wordsLeftToday(big, today, T0, 10)).toBe(5);
    expect(themeWordsLeftToday(big, today, T0, 10, 'kitchen')).toBe(4);
    expect(themeWordsLeftToday(big, today, T0 + DAY, 10, 'nature')).toBe(2);
  });
});

describe('practising one topic', () => {
  it('keeps to the pool, due items first', () => {
    let progress = learn(index, emptyProgress(), ['w-kitchen/vork', 'w-animals/hond'], T0 - 30 * DAY);
    progress = learn(index, progress, ['w-kitchen/mes'], T0);
    const pool = new Set(index.themes[0]!.items.map((item) => item.id));
    expect(pickPracticeItems(index, progress, T0, 10, new Set(), pool)).toEqual(['w-kitchen/vork', 'w-kitchen/mes']);
    expect(pickPracticeItems(index, progress, T0, 10, new Set(), new Set())).toEqual([]);
  });

  it('summarizes a topic by strength and what is due now', () => {
    const progress = learn(index, emptyProgress(), ['w-kitchen/vork'], T0);
    const items = index.themes[0]!.items;
    expect(summarizeTopic(items, progress, T0)).toEqual({ new: 3, learning: 1, strong: 0, total: 4, due: 0 });
    expect(summarizeTopic(items, progress, T0 + 30 * DAY).due).toBe(1);
  });
});

describe('topic sessions', () => {
  it('learns a theme’s words, then practises only that theme', async () => {
    const setup = setupLearning(makeCourse({}, testWordThemes));
    await setup.store.updatePreferences({ onboarded: true, newWordsPerDay: 10 });
    expect(await setup.learning.startTopicPractice('kitchen')).toBeUndefined();

    const words = await setup.learning.startTopicWords('kitchen');
    expect(words?.kind).toBe('words');
    expect(introStepIds(words!)).toEqual(['w-kitchen/vork', 'w-kitchen/mes', 'w-kitchen/lepel', 'w-kitchen/glas']);
    await setup.learning.finish(words!, answers(words!));
    const animals = await setup.learning.startTopicWords('animals');
    await setup.learning.finish(animals!, answers(animals!));

    const practice = await setup.learning.startTopicPractice('kitchen');
    expect(practice?.kind).toBe('review');
    const practised = exerciseSteps(practice!).flatMap((step) => step.itemIds);
    expect(practised.length).toBeGreaterThan(0);
    for (const id of practised) expect(id).toMatch(/^w-kitchen\//);
    expect(await setup.learning.startTopicPractice('unknown')).toBeUndefined();
  });

  it('brings in no more than today’s limit from a theme', async () => {
    const setup = setupLearning(makeCourse({}, testWordThemes));
    await setup.store.updatePreferences({ onboarded: true, newWordsPerDay: 3 });
    const words = await setup.learning.startTopicWords('kitchen');
    expect(introStepIds(words!)).toHaveLength(3);
    await setup.learning.finish(words!, answers(words!));
    expect(await setup.learning.startTopicWords('kitchen')).toBeUndefined();
    expect(await setup.learning.startTopicWords('animals')).toBeUndefined();
  });
});
