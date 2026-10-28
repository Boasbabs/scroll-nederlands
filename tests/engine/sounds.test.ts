import { chooseReviewExercise, generateExercise, seededRandom } from '../../src/engine/exercises';
import { CONTRAST_TRIALS, exerciseSteps, introStepIds, planLesson, planSounds, planWords } from '../../src/engine/plan';
import { completeLesson, completeNewItems } from '../../src/engine/progress';
import { DAY, MINUTE } from '../../src/engine/schedule';
import { getNewContrastId, getNextActivity } from '../../src/engine/selection';
import { summarizeProgress } from '../../src/engine/summary';
import { emptyProgress, type ExerciseResult, type LearnerProgress } from '../../src/engine/types';
import { makeCourse, testContrasts, testWordThemes } from '../fixtures/curriculum';
import { setupLearning } from '../ui/harness';

const T0 = new Date(2026, 9, 28, 9).getTime();
const index = makeCourse({}, testWordThemes, testContrasts);

function answers(plan: ReturnType<typeof planSounds>, correct: (i: number) => boolean = () => true): Array<ExerciseResult> {
  return exerciseSteps(plan).map((planned, i) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct: correct(i) }));
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

describe('placing the sound contrasts', () => {
  it('gives each contrast one permanent item beside the course', () => {
    expect(index.sounds.map((item) => item.id)).toEqual(['p-a-aa', 'p-g-h']);
    expect(index.item('p-a-aa')).toMatchObject({ kind: 'sound', recognitionOnly: true, stageId: 'sounds', dutch: 'man · maan', english: 'Ear training: a or aa' });
    expect(index.contrast('p-g-h')?.sounds).toEqual(['g', 'h']);
    expect(index.contrast('x0-a-hello/hallo-daar')).toBeUndefined();
    expect(index.lesson(index.item('p-a-aa')!.lessonId)).toBeUndefined();
  });

  it('keeps contrast text out of other items’ wrong options', () => {
    const random = seededRandom('options');
    for (const item of index.items.filter((other) => other.stageId !== 'sounds')) {
      const exercise = generateExercise(index, item, 'recognition', 0, random);
      if (exercise.kind === 'choice') expect(exercise.options.join(' ')).not.toMatch(/Ear training|·/);
    }
  });
});

describe('the pair drill', () => {
  it('plays one word of a pair and offers both, at every stage', () => {
    const item = index.item('p-a-aa')!;
    const random = seededRandom('pairs');
    for (const stage of ['recognition', 'supportedRecall', 'independentRecall', 'transfer'] as const) {
      const exercise = generateExercise(index, item, stage, 3, random);
      expect(exercise).toMatchObject({ kind: 'choice', stage, listenOnly: true, prompt: 'Listen. Which word did you hear?', items: ['p-a-aa'] });
      if (exercise.kind !== 'choice') continue;
      const pair = testContrasts[0]!.pairs.find(([first]) => exercise.options.includes(first.dutch))!;
      expect(exercise.options).toEqual([pair[0].dutch, pair[1].dutch]);
      expect(exercise.options).toContain(exercise.answer);
      expect(exercise.audioText).toBe(exercise.answer);
      expect(exercise.explanation).toBe(`${pair[0].dutch} means "${pair[0].english}"; ${pair[1].dutch} means "${pair[1].english}".`);
    }
  });

  it('is what a due contrast gets in a review', () => {
    const progress = completeNewItems(emptyProgress(), ['p-g-h'], [], 'focused', T0);
    const planned = chooseReviewExercise(index, 'p-g-h', progress.items['p-g-h'], 'micro', seededRandom('review'));
    expect(planned.generated).toBe(true);
    expect(planned.exerciseId).toMatch(/^gen:p-g-h:gen-pair-\d-[01]$/);
    expect(planned.exercise).toMatchObject({ kind: 'choice', stage: 'recognition', listenOnly: true });
    const later = chooseReviewExercise(index, 'p-g-h', { ...progress.items['p-g-h']!, stage: 'independentRecall' }, 'micro', seededRandom('review'));
    expect(later.exercise).toMatchObject({ kind: 'choice', stage: 'transfer', listenOnly: true });
  });
});

describe('an ear-training session', () => {
  it('shows the contrast, then six trials that hear each sound equally often and rotate the pairs', () => {
    const plan = planSounds(index, 'p-a-aa', 'seed');
    expect(plan).toMatchObject({ kind: 'sounds', mode: 'focused' });
    expect(plan.steps[0]).toEqual({ type: 'contrast', itemId: 'p-a-aa' });
    const trials = exerciseSteps(plan);
    expect(trials).toHaveLength(CONTRAST_TRIALS);
    expect(new Set(trials.map((planned) => planned.key)).size).toBe(CONTRAST_TRIALS);
    const heard = trials.map((planned) => (planned.exercise.kind === 'choice' ? planned.exercise : undefined)!);
    expect(heard.every((exercise) => exercise.stage === 'recognition' && exercise.listenOnly)).toBe(true);
    const firstSound = heard.filter((exercise) => exercise.answer === exercise.options[0]);
    expect(firstSound).toHaveLength(CONTRAST_TRIALS / 2);
    // Three pairs over six trials: each pair twice.
    const pairCounts = new Map<string, number>();
    for (const exercise of heard) pairCounts.set(exercise.options[0]!, (pairCounts.get(exercise.options[0]!) ?? 0) + 1);
    expect([...pairCounts.values()]).toEqual([2, 2, 2]);
    expect(introStepIds(plan)).toEqual(['p-a-aa']);
  });

  it('refuses an item that is not a contrast', () => {
    expect(() => planSounds(index, 'w-kitchen/vork', 'seed')).toThrow('not a sound contrast');
  });

  it('schedules the contrast from the trials: all heard right waits a day, a slip comes back soon', () => {
    const plan = planSounds(index, 'p-a-aa', 'seed');
    const clean = completeNewItems(emptyProgress(), introStepIds(plan), answers(plan), 'focused', T0);
    expect(clean.items['p-a-aa']).toMatchObject({ stage: 'recognition', relearning: false, dueAt: T0 + DAY });
    expect(clean.days).toEqual({ '2026-10-28': CONTRAST_TRIALS });

    const slipped = completeNewItems(emptyProgress(), introStepIds(plan), answers(plan, (i) => i !== 2), 'focused', T0);
    expect(slipped.items['p-a-aa']).toMatchObject({ relearning: true, dueAt: T0 + 10 * MINUTE, incorrect: 1 });
  });
});

describe('what comes next', () => {
  it('offers contrasts in the list’s order', () => {
    expect(getNewContrastId(index, emptyProgress())).toBe('p-a-aa');
    const met = completeNewItems(emptyProgress(), ['p-a-aa'], [], 'focused', T0);
    expect(getNewContrastId(index, met)).toBe('p-g-h');
    expect(getNewContrastId(index, completeNewItems(met, ['p-g-h'], [], 'focused', T0))).toBeUndefined();
  });

  it('leaves the micro-break turns of lessons and words alone', () => {
    const options = { mode: 'micro' as const, newWordsPerDay: 5 };
    const afterLesson = finishLesson(emptyProgress(), 'x0-a-hello', T0);
    const plan = planWords(index, ['w-kitchen/vork', 'w-animals/hond', 'w-kitchen/mes'], 'micro', 'seed');
    const afterWords = completeNewItems(afterLesson, introStepIds(plan), [], 'micro', T0 + 1000);
    const afterSounds = completeNewItems(afterWords, ['p-a-aa'], [], 'focused', T0 + 2000);
    expect(getNextActivity(index, afterSounds, T0 + 3000, options)).toEqual({ type: 'lesson', lessonId: 'x0-a-thanks' });
  });

  it('counts contrasts apart from the course and the basic words', () => {
    const progress = completeNewItems(emptyProgress(), ['p-a-aa'], [], 'focused', T0);
    const summary = summarizeProgress(index, progress, T0);
    expect(summary.sounds).toEqual({ new: 1, learning: 1, strong: 0, total: 2 });
    expect(summary.items.total).toBe(5);
    expect(summary.words.total).toBe(7);
    expect(summary.upcoming.tomorrow).toBe(1);
  });
});

describe('starting and saving ear training', () => {
  it('starts the next contrast, saves it, then practises the met ones once all are met', async () => {
    const setup = setupLearning(index);
    const first = await setup.learning.startSounds();
    expect(first && introStepIds(first)).toEqual(['p-a-aa']);
    const outcome = await setup.learning.finish(first!, answers(first!));
    expect(outcome).toMatchObject({ kind: 'sounds', correct: CONTRAST_TRIALS, total: CONTRAST_TRIALS, newItemIds: ['p-a-aa'], nextReviewAt: setup.now() + DAY });

    const second = await setup.learning.startSounds();
    expect(second && introStepIds(second)).toEqual(['p-g-h']);
    await setup.learning.finish(second!, answers(second!));

    const practice = await setup.learning.startSounds();
    expect(practice?.kind).toBe('review');
    expect(exerciseSteps(practice!).map((planned) => planned.itemIds[0]).sort()).toEqual(['p-a-aa', 'p-g-h']);
  });

  it('has nothing to start when the course has no contrasts', async () => {
    const setup = setupLearning(makeCourse());
    expect(await setup.learning.startSounds()).toBeUndefined();
  });
});
