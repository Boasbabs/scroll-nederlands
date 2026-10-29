import { checkTyped } from '../../src/engine/answers';
import { generateExercise, seededRandom } from '../../src/engine/exercises';
import { exerciseSteps, introStepIds, planLesson, planWords } from '../../src/engine/plan';
import { completeLesson, completeNewItems } from '../../src/engine/progress';
import { DAY } from '../../src/engine/schedule';
import { getNewWordIds, getNextActivity, wordsIntroducedToday, wordsLeftToday } from '../../src/engine/selection';
import { summarizeProgress } from '../../src/engine/summary';
import { emptyProgress, type ExerciseResult, type LearnerProgress } from '../../src/engine/types';
import { bareWord, placeWords } from '../../src/words/assemble';
import { makeCourse, testWordThemes } from '../fixtures/curriculum';
import { setupLearning } from '../ui/harness';

const T0 = new Date(2026, 9, 28, 9).getTime();
const index = makeCourse({}, testWordThemes);

function answers(plan: ReturnType<typeof planWords>, correct = true): Array<ExerciseResult> {
  return exerciseSteps(plan).map((planned) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct }));
}

function finishLesson(progress: LearnerProgress, lessonId: string, at: number): LearnerProgress {
  const results = exerciseSteps(planLesson(index, lessonId, 'focused')).map((planned) => ({
    exerciseId: planned.exerciseId,
    stage: planned.exercise.stage,
    itemIds: planned.itemIds,
    correct: true,
  }));
  return completeLesson(progress, index, lessonId, results, 'focused', at);
}

function learnWords(progress: LearnerProgress, itemIds: Array<string>, at: number): LearnerProgress {
  const plan = planWords(index, itemIds, 'focused', 'test');
  return completeNewItems(progress, introStepIds(plan), answers(plan), 'focused', at);
}

describe('placing the basic-word list', () => {
  it('gives new words permanent ids and mixes themes in introduction order', () => {
    expect(index.words.map((item) => item.id)).toEqual([
      'w-kitchen/vork',
      'w-animals/hond',
      'w-kitchen/mes',
      'x0-a-thanks/dank-je-wel',
      'w-kitchen/lepel',
      'w-animals/kat',
      'w-kitchen/glas',
    ]);
    expect(index.item('w-kitchen/mes')).toMatchObject({ dutch: 'het mes', kind: 'word', stageId: 'words', moduleId: 'w-kitchen' });
  });

  it('counts a course word by reference instead of adding a second item', () => {
    expect(index.items.filter((item) => item.dutch === 'Dank je wel')).toHaveLength(1);
    // Five course items, six new words, and a de/het item for each of the six nouns.
    expect(index.items).toHaveLength(5 + 6 + 6);
    expect(index.lessons).toHaveLength(makeCourse().lessons.length);
  });

  it('reports references that match no course item', () => {
    const placed = placeWords([{ id: 'misc', title: 'Misc', words: [{ ref: 'de olifant' }] }], index.items);
    expect(placed.unresolved).toEqual(['misc: de olifant']);
    expect(placed.words).toEqual([]);
  });

  it('compares words without their article', () => {
    expect(bareWord('De fiets')).toBe('fiets');
    expect(bareWord('het mes')).toBe('mes');
    expect(bareWord('dertig')).toBe('dertig');
  });
});

describe('when new words come up', () => {
  it('never offers words in focused practice, which starts them from Today', () => {
    const progress = finishLesson(emptyProgress(), 'x0-a-hello', T0);
    expect(getNextActivity(index, progress, T0 + DAY / 2, { mode: 'focused', newWordsPerDay: 5 })).toEqual({ type: 'lesson', lessonId: 'x0-a-thanks' });
  });

  it('starts a new learner on a lesson, then alternates lessons and words in micro breaks', () => {
    const options = { mode: 'micro' as const, newWordsPerDay: 5 };
    expect(getNextActivity(index, emptyProgress(), T0, options)).toEqual({ type: 'lesson', lessonId: 'x0-a-hello' });

    const afterLesson = finishLesson(emptyProgress(), 'x0-a-hello', T0);
    const words = getNextActivity(index, afterLesson, T0 + 1000, options);
    expect(words).toEqual({ type: 'words', itemIds: ['w-kitchen/vork', 'w-animals/hond', 'w-kitchen/mes'] });

    const afterWords = learnWords(afterLesson, words.type === 'words' ? words.itemIds : [], T0 + 2000);
    expect(getNextActivity(index, afterWords, T0 + 3000, options)).toEqual({ type: 'lesson', lessonId: 'x0-a-thanks' });
  });

  it('keeps to the daily limit, counts words met in lessons, and starts again the next day', () => {
    const afterLesson = finishLesson(emptyProgress(), 'x0-a-thanks', T0);
    // The lesson taught "Dank je wel", a basic word: it counts toward today's limit.
    expect(wordsIntroducedToday(index, afterLesson, T0)).toBe(1);
    expect(wordsLeftToday(index, afterLesson, T0, 3)).toBe(2);

    const progress = learnWords(afterLesson, ['w-kitchen/vork', 'w-animals/hond'], T0 + 1000);
    const options = { mode: 'micro' as const, newWordsPerDay: 3 };
    expect(wordsLeftToday(index, progress, T0 + 2000, 3)).toBe(0);
    expect(getNextActivity(index, progress, T0 + 2000, options).type).toBe('lesson');
    expect(wordsLeftToday(index, progress, T0 + DAY, 3)).toBe(3);
    expect(wordsLeftToday(index, progress, T0, 0)).toBe(0);
  });

  it('puts due reviews first, and offers words while micro mode waits on a checkpoint', () => {
    let progress = emptyProgress();
    for (const lessonId of ['x0-a-hello', 'x0-a-thanks', 'x0-a-bye']) progress = finishLesson(progress, lessonId, T0 - 3 * DAY);
    const options = { mode: 'micro' as const, newWordsPerDay: 5 };
    expect(getNextActivity(index, progress, T0, options).type).toBe('review');

    const reviewed = { ...progress, items: Object.fromEntries(Object.entries(progress.items).map(([id, item]) => [id, { ...item, dueAt: T0 + DAY }])) };
    expect(getNextActivity(index, reviewed, T0, options)).toMatchObject({ type: 'words' });
    expect(getNextActivity(index, reviewed, T0, { mode: 'micro' })).toMatchObject({ type: 'caughtUp', checkpointLessonId: 'x0-check-one' });
  });
});

describe('a word session', () => {
  it('meets every word first, then recognises each, then (focused) types each', () => {
    const ids = ['w-kitchen/vork', 'w-animals/hond'];
    const focused = planWords(index, ids, 'focused', 'seed');
    expect(focused.kind).toBe('words');
    expect(focused.steps.slice(0, 2)).toEqual([
      { type: 'word', itemId: 'w-kitchen/vork' },
      { type: 'word', itemId: 'w-animals/hond' },
    ]);
    expect(exerciseSteps(focused).map((planned) => [planned.itemIds[0], planned.exercise.stage])).toEqual([
      ['w-kitchen/vork', 'recognition'],
      ['w-animals/hond', 'recognition'],
      ['w-kitchen/vork', 'supportedRecall'],
      ['w-animals/hond', 'supportedRecall'],
    ]);
    expect(exerciseSteps(planWords(index, ids, 'micro', 'seed')).map((planned) => planned.exercise.stage)).toEqual(['recognition', 'recognition']);
  });

  it('draws wrong options from the same theme', () => {
    const plan = planWords(index, ['w-kitchen/vork'], 'focused', 'seed');
    const recognition = exerciseSteps(plan)[0]!.exercise;
    expect(recognition.kind).toBe('choice');
    if (recognition.kind === 'choice') {
      expect(recognition.options).toContain('the fork');
      expect(recognition.options.filter((option) => option !== 'the fork').every((option) => ['the knife', 'the spoon', 'the glass'].includes(option))).toBe(true);
    }
  });

  it('keeps a word’s synonyms out of its wrong options', () => {
    const sudden = (key: string, english: string, accept: Array<string>) =>
      ({ key, dutch: key, english, pos: 'other', accept, example: { dutch: `${key} gaat het licht uit.`, english: 'The light goes out.' } }) as const;
    const linking = makeCourse({}, [
      ...testWordThemes,
      {
        id: 'linking',
        title: 'Linking words',
        tier: 2,
        words: [
          sudden('opeens', 'all of a sudden', ['plotseling', 'ineens']),
          sudden('plotseling', 'suddenly', ['opeens', 'ineens']),
          { key: 'zelfs', dutch: 'zelfs', english: 'even', pos: 'other', example: { dutch: 'Zelfs mijn oma heeft een telefoon.', english: 'Even my gran has a phone.' } },
          { key: 'bijna', dutch: 'bijna', english: 'almost', pos: 'other', example: { dutch: 'Het is bijna acht uur.', english: 'It is almost eight o’clock.' } },
        ],
      },
    ]);
    for (const seed of ['a', 'b', 'c']) {
      const recognition = exerciseSteps(planWords(linking, ['w-linking/opeens'], 'focused', seed))[0]!.exercise;
      expect(recognition.kind === 'choice' && [...recognition.options].sort()).toEqual(['all of a sudden', 'almost', 'even']);
    }
  });

  it('keeps near-synonyms out of each other’s wrong options without accepting them', () => {
    const near = makeCourse({}, [
      ...testWordThemes,
      {
        id: 'linking',
        title: 'Linking words',
        tier: 2,
        words: [
          { key: 'best', dutch: 'best', english: 'quite, pretty', pos: 'other', example: { dutch: 'Het is best koud vandaag.', english: 'It is pretty cold today.' } },
          { key: 'nogal', dutch: 'nogal', english: 'rather', pos: 'other', near: ['best'], example: { dutch: 'De huur is nogal hoog.', english: 'The rent is rather high.' } },
          { key: 'zelfs', dutch: 'zelfs', english: 'even', pos: 'other', example: { dutch: 'Zelfs mijn oma heeft een telefoon.', english: 'Even my gran has a phone.' } },
          { key: 'bijna', dutch: 'bijna', english: 'almost', pos: 'other', example: { dutch: 'Het is bijna acht uur.', english: 'It is almost eight o’clock.' } },
        ],
      },
    ]);
    for (const [id, own] of [['w-linking/best', 'quite, pretty'], ['w-linking/nogal', 'rather']] as const) {
      for (const seed of ['a', 'b', 'c']) {
        const recognition = exerciseSteps(planWords(near, [id], 'focused', seed))[0]!.exercise;
        expect(recognition.kind === 'choice' && [...recognition.options].sort()).toEqual([own, 'almost', 'even'].sort());
      }
    }
    const gap = generateExercise(near, near.item('w-linking/nogal')!, 'independentRecall', 0, seededRandom('x'));
    expect(gap.kind === 'cloze' && checkTyped('best', gap.answers).correct).toBe(false);
  });

  it('starts each word on its schedule and counts the answers for the day', () => {
    const plan = planWords(index, ['w-kitchen/vork', 'w-kitchen/mes'], 'focused', 'seed');
    const results = answers(plan).map((result) => (result.itemIds[0] === 'w-kitchen/mes' && result.stage === 'recognition' ? { ...result, correct: false } : result));
    const progress = completeNewItems(emptyProgress(), introStepIds(plan), results, 'focused', T0);
    expect(progress.items['w-kitchen/vork']).toMatchObject({ stage: 'supportedRecall', relearning: false, dueAt: T0 + DAY });
    expect(progress.items['w-kitchen/mes']).toMatchObject({ stage: 'recognition', relearning: true });
    expect(progress.days).toEqual({ '2026-10-28': 4 });
  });

  it('keeps course and basic-word counts apart in the summary', () => {
    const progress = learnWords(emptyProgress(), ['w-kitchen/vork', 'w-animals/hond'], T0);
    const summary = summarizeProgress(index, progress, T0);
    expect(summary.items.total).toBe(5);
    expect(summary.words).toEqual({ new: 5, learning: 2, strong: 0, total: 7 });
    expect(summary.upcoming.tomorrow).toBe(2);
  });
});

describe('starting and saving a word session', () => {
  it('starts today’s batch from Today and reports the new words', async () => {
    const setup = setupLearning(index);
    const plan = await setup.learning.startWords('focused');
    expect(plan && introStepIds(plan)).toEqual(['w-kitchen/vork', 'w-animals/hond', 'w-kitchen/mes', 'x0-a-thanks/dank-je-wel', 'w-kitchen/lepel']);

    const outcome = await setup.learning.finish(plan!, answers(plan!));
    expect(outcome.kind).toBe('words');
    expect(outcome.newItemIds).toHaveLength(5);
    expect((await setup.learning.snapshot('focused')).wordsLeftToday).toBe(0);
    expect(await setup.learning.startWords('focused')).toBeUndefined();
  });

  it('turns the track off at zero words a day', async () => {
    const setup = setupLearning(index);
    await setup.store.updatePreferences({ newWordsPerDay: 0 });
    expect(await setup.learning.startWords('focused')).toBeUndefined();
    expect((await setup.learning.snapshot('micro')).wordsLeftToday).toBe(0);
  });
});

describe('tier 2 (words 626–1,000)', () => {
  /** Two tier-1 themes (seven words, one a course word) and a tier-2 theme of abstract words with sentences. */
  const tiered = makeCourse({}, [
    ...testWordThemes,
    {
      id: 'ideas',
      title: 'Everyday ideas',
      tier: 2,
      words: [
        { key: 'probleem', dutch: 'het probleem', english: 'the problem', pos: 'noun', example: { dutch: 'Dat is geen groot probleem.', english: 'That is not a big problem.' } },
        { key: 'reden', dutch: 'de reden', english: 'the reason', pos: 'noun', example: { dutch: 'Wat is de reden?', english: 'What is the reason?' } },
        { key: 'trots', dutch: 'trots', english: 'proud', pos: 'adjective', example: { dutch: 'Ik ben trots op je.', english: 'I am proud of you.' } },
        { key: 'kans', dutch: 'de kans', english: 'the chance', pos: 'noun', example: { dutch: 'Je hebt een goede kans.', english: 'You have a good chance.' } },
      ],
    },
  ]);
  const tierOne = tiered.themes.filter((theme) => theme.tier === 1).flatMap((theme) => theme.items);

  function meet(progress: LearnerProgress, itemIds: ReadonlyArray<string>): LearnerProgress {
    const plan = planWords(tiered, itemIds, 'focused', 'tiers');
    return completeNewItems(progress, introStepIds(plan), answers(plan), 'focused', T0);
  }

  it('places tier 2 after the whole of tier 1, its themes mixed among themselves', () => {
    expect(tiered.words.slice(0, tierOne.length).every((item) => tierOne.includes(item))).toBe(true);
    expect(tiered.words.slice(tierOne.length).map((item) => item.id)).toEqual(['w-ideas/probleem', 'w-ideas/reden', 'w-ideas/trots', 'w-ideas/kans']);
  });

  it('keeps tier 2 out of the mixed list until 90% of tier 1 is met', () => {
    const almost = meet(emptyProgress(), tierOne.slice(0, Math.ceil(0.9 * tierOne.length) - 1).map((item) => item.id));
    expect(getNewWordIds(tiered, almost, 10).every((id) => !id.startsWith('w-ideas/'))).toBe(true);
    const enough = meet(almost, [tierOne.find((item) => !almost.items[item.id])!.id]);
    expect(getNewWordIds(tiered, enough, 10)).toContain('w-ideas/probleem');
  });

  it('takes a noun’s other forms without their article in its gap', () => {
    const keuze = makeCourse({}, [
      ...testWordThemes,
      {
        id: 'ideas',
        title: 'Everyday ideas',
        tier: 2,
        words: [
          { key: 'keuze', dutch: 'de keuze', english: 'the choice', pos: 'noun', accept: ['de keus'], example: { dutch: 'Je hebt de keuze: thee of koffie.', english: 'You have the choice: tea or coffee.' } },
          { key: 'reden', dutch: 'de reden', english: 'the reason', pos: 'noun', example: { dutch: 'Wat is de reden?', english: 'What is the reason?' } },
          { key: 'trots', dutch: 'trots', english: 'proud', pos: 'adjective', example: { dutch: 'Ik ben trots op je.', english: 'I am proud of you.' } },
          { key: 'kans', dutch: 'de kans', english: 'the chance', pos: 'noun', example: { dutch: 'Je hebt een goede kans.', english: 'You have a good chance.' } },
        ],
      },
    ]);
    const gap = generateExercise(keuze, keuze.item('w-ideas/keuze')!, 'independentRecall', 0, seededRandom('x'));
    expect(gap).toMatchObject({ kind: 'cloze', sentence: 'Je hebt de ___: thee of koffie.' });
    if (gap.kind !== 'cloze') throw new Error('no gap');
    expect(checkTyped('keus', gap.answers).verdict).toBe('correct');
    expect(checkTyped('keuze', gap.answers).verdict).toBe('correct');
  });

  it('teaches a tier-2 theme opened in Topics straight away', () => {
    expect(getNewWordIds(tiered, emptyProgress(), 2, 'ideas')).toEqual(['w-ideas/probleem', 'w-ideas/reden']);
  });

  it('recalls a word from its own sentence with the word blanked out', () => {
    const plan = planWords(tiered, ['w-ideas/probleem', 'w-ideas/reden'], 'focused', 'gap');
    const recall = exerciseSteps(plan).filter((step) => step.exercise.stage === 'supportedRecall');
    expect(recall.map((step) => step.exercise)).toEqual([
      expect.objectContaining({ kind: 'cloze', sentence: 'Dat is geen groot ___.', answers: expect.arrayContaining(['probleem']) }),
      // The article stays in view: the de/het drill asks for it apart.
      expect.objectContaining({ kind: 'cloze', sentence: 'Wat is de ___?', answers: expect.arrayContaining(['reden']) }),
    ]);
  });

  it('counts both tiers as core words', () => {
    expect(summarizeProgress(tiered, emptyProgress(), T0).words.total).toBe(tiered.words.length);
  });
});
