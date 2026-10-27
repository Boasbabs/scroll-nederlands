import { checkTyped } from '../../src/engine/answers';
import { generateExercise, seededRandom } from '../../src/engine/exercises';
import { exerciseSteps, planCheckpoint, planLesson } from '../../src/engine/plan';
import { completeLesson, completePlacement, dayKey } from '../../src/engine/progress';
import { DAY, HOUR, RELEARN_DELAY } from '../../src/engine/schedule';
import { getNextActivity, isLessonDone, pickPracticeItems, stageCheckpointId } from '../../src/engine/selection';
import { itemsByStrength, summarizeProgress } from '../../src/engine/summary';
import { emptyProgress, type ExerciseResult, type LearnerProgress } from '../../src/engine/types';
import { createLearning } from '../../src/learning/actions';
import { createStore } from '../../src/storage/store';
import { makeCourse } from '../fixtures/curriculum';
import { createMemoryArea } from '../fixtures/memory-storage';

const T0 = new Date(2026, 9, 27, 9).getTime();
const index = makeCourse();

function results(plan: Parameters<typeof exerciseSteps>[0], correct: (i: number) => boolean): Array<ExerciseResult> {
  return exerciseSteps(plan).map((planned, i) => ({
    exerciseId: planned.exerciseId,
    stage: planned.exercise.stage,
    itemIds: planned.itemIds,
    correct: correct(i),
  }));
}

function finish(progress: LearnerProgress, lessonId: string, at: number, correct = true): LearnerProgress {
  return completeLesson(progress, index, lessonId, results(planLesson(index, lessonId, 'focused'), () => correct), 'focused', at);
}

describe('extra practice', () => {
  it('offers due items first, then the least secure ones, never unknown items', () => {
    let progress = finish(emptyProgress(), 'x0-a-hello', T0);
    progress = finish(progress, 'x0-a-thanks', T0, false);
    progress = finish(progress, 'x0-a-bye', T0);
    progress.items['gone/old'] = { ...progress.items['x0-a-bye/tot-ziens']!, dueAt: T0 };

    // Nothing is due yet: the relearning item leads.
    expect(pickPracticeItems(index, progress, T0 + 1, 2)).toEqual(['x0-a-thanks/dank-je-wel', 'x0-a-hello/hallo-daar']);
    // Once the relearning item is due it is simply first.
    expect(pickPracticeItems(index, progress, T0 + RELEARN_DELAY, 3)[0]).toBe('x0-a-thanks/dank-je-wel');
    expect(pickPracticeItems(index, progress, T0 + RELEARN_DELAY, 10)).not.toContain('gone/old');
  });
});

describe('placement checkpoints', () => {
  it('finds each stage’s final checkpoint', () => {
    expect(stageCheckpointId(index, 'x0')).toBe('x0-check-one');
    expect(stageCheckpointId(index, 'x1')).toBe('x1-check-one');
    expect(stageCheckpointId(index, 'nope')).toBeUndefined();
  });

  it('skips the stage when passed, without scheduling lessons that were never taught', () => {
    const plan = planCheckpoint(index, 'x0-check-one');
    const outcome = completePlacement(emptyProgress(), index, 'x0-check-one', results(plan, () => true), T0);
    expect(outcome.passed).toBe(true);
    for (const id of ['x0-a-hello', 'x0-a-thanks', 'x0-a-bye', 'x0-check-one']) expect(isLessonDone(outcome.progress, id)).toBe(true);
    expect(getNextActivity(index, outcome.progress, T0, { mode: 'focused' })).toEqual({ type: 'lesson', lessonId: 'x1-a-coffee' });
    expect(outcome.progress.items['x0-a-bye/tot-ziens']).toBeUndefined();
    expect(outcome.progress.items['x0-a-hello/hallo-daar']).toBeDefined();
  });

  it('keeps the path where it was when failed, but remembers the score', () => {
    const plan = planCheckpoint(index, 'x0-check-one');
    const outcome = completePlacement(emptyProgress(), index, 'x0-check-one', results(plan, (i) => i < 2), T0);
    expect(outcome.passed).toBe(false);
    expect(isLessonDone(outcome.progress, 'x0-check-one')).toBe(false);
    expect(outcome.progress.lessons['x0-check-one']).toMatchObject({ lastScore: 0.4, bestScore: 0.4 });
    expect(getNextActivity(index, outcome.progress, T0, { mode: 'focused' })).toEqual({ type: 'lesson', lessonId: 'x0-a-hello' });
  });

  it('runs end to end through the shared actions', async () => {
    const learning = createLearning({ store: createStore(createMemoryArea()), course: index, now: () => T0 });
    const plan = learning.startPlacement('x0');
    expect(plan).toMatchObject({ kind: 'checkpoint', placement: true, lessonId: 'x0-check-one' });
    const outcome = await learning.finish(plan, results(plan, () => true));
    expect(outcome.checkpoint?.passed).toBe(true);
    expect(outcome.next).toEqual({ type: 'lesson', lessonId: 'x1-a-coffee' });
    // Items the learner already knew skip the 1-day step.
    expect(outcome.nextReviewAt).toBe(T0 + 3 * DAY);
  });
});

describe('progress summary for the panel', () => {
  it('counts the streak, the week strip and when reviews fall due', () => {
    let progress = finish(emptyProgress(), 'x0-a-hello', T0 - 2 * DAY);
    progress = finish(progress, 'x0-a-thanks', T0 - DAY);
    progress = finish(progress, 'x0-a-bye', T0, false);
    const summary = summarizeProgress(index, progress, T0 + 1);
    expect(summary.week).toEqual([false, false, false, false, true, true, true]);
    expect(summary.streak).toBe(3);
    expect(summary.upcoming).toEqual({ today: 3, tomorrow: 0, thisWeek: 0, later: 0 });
    expect(summary.nextReview).toBeUndefined();

    // Tomorrow, before practising, the streak still counts up to yesterday.
    const tomorrow = summarizeProgress(index, progress, T0 + DAY);
    expect(tomorrow.streak).toBe(3);
    expect(progress.days[dayKey(T0)]).toBeGreaterThan(0);
  });

  it('says when the next review comes once nothing is due', () => {
    const progress = finish(emptyProgress(), 'x0-a-hello', T0);
    const summary = summarizeProgress(index, progress, T0 + HOUR);
    expect(summary.dueNow).toBe(0);
    expect(summary.nextReview).toEqual({ at: T0 + DAY, count: 1 });
    expect(summary.upcoming).toEqual({ today: 0, tomorrow: 1, thisWeek: 0, later: 0 });
    const groups = itemsByStrength(index, progress);
    expect(groups.learning.map((item) => item.id)).toEqual(['x0-a-hello/hallo-daar']);
    expect(groups.new.length).toBe(index.items.length - 1);
  });
});

describe('dictation drills', () => {
  it('accept only the sentence that was heard, not its synonyms', () => {
    const course = makeCourse({
      'x0-a-hello': {
        items: [{ key: 'hoe-heet-je', dutch: 'Hoe heet je?', english: 'What is your name?', kind: 'phrase', accept: ['Wat is je naam?'] }],
      },
    });
    const item = course.item('x0-a-hello/hoe-heet-je')!;
    const dictation = generateExercise(course, item, 'transfer', 0, seededRandom('t'));
    expect(dictation).toMatchObject({ kind: 'type', listenOnly: true, audioText: 'Hoe heet je?', answers: ['Hoe heet je?'] });
    if (dictation.kind !== 'type') throw new Error('expected a typed drill');
    expect(checkTyped('Wat is je naam?', dictation.answers).correct).toBe(false);
    // Typo tolerance stays.
    expect(checkTyped('hoe het je', dictation.answers)).toMatchObject({ verdict: 'typo', correct: true });

    // Recall from English still accepts the synonym.
    const recall = generateExercise(course, item, 'independentRecall', 0, seededRandom('t'));
    expect(recall).toMatchObject({ kind: 'type', answers: ['Hoe heet je?', 'Wat is je naam?'] });
  });
});
