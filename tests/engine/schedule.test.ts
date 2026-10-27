import {
  DAY,
  RELEARN_DELAY,
  calculateNextReviewDate,
  exerciseStageFor,
  getNextLearningStage,
  introduceItem,
  itemStrength,
  recordAnswer,
  type GradedAnswer,
} from '../../src/engine/schedule';
import type { ItemProgress } from '../../src/engine/types';

const T0 = Date.UTC(2026, 9, 27, 9);

function answer(correct: boolean, stage: GradedAnswer['stage']): GradedAnswer {
  return { correct, stage, exerciseId: `x/${stage}`, mode: 'focused' };
}

/** Answers the item correctly each time it falls due, at the stage it needs. */
function reviewCorrectly(item: ItemProgress, times: number): ItemProgress {
  let current = item;
  for (let i = 0; i < times; i++) {
    current = recordAnswer(current, answer(true, exerciseStageFor(current.stage)), current.dueAt);
  }
  return current;
}

describe('stages and difficulty', () => {
  it('serves an exercise one stage harder than the stage reached', () => {
    expect(exerciseStageFor('introduced')).toBe('recognition');
    expect(exerciseStageFor('recognition')).toBe('supportedRecall');
    expect(exerciseStageFor('independentRecall')).toBe('transfer');
    expect(exerciseStageFor('transfer')).toBe('transfer');
  });

  it('moves up after success and down after failure, so the next exercise is easier', () => {
    expect(getNextLearningStage('recognition', 'supportedRecall', true)).toBe('supportedRecall');
    const afterFail = getNextLearningStage('supportedRecall', 'independentRecall', false);
    expect(afterFail).toBe('recognition');
    expect(exerciseStageFor(afterFail)).toBe('supportedRecall');
    expect(getNextLearningStage('introduced', 'recognition', false)).toBe('introduced');
  });
});

describe('introducing items after a lesson', () => {
  it('starts a cleanly practised item at supported recall, due in about a day', () => {
    const item = introduceItem({ correctStages: ['recognition', 'supportedRecall', 'independentRecall', 'transfer'], mistakes: 0 }, T0);
    expect(item.stage).toBe('supportedRecall');
    expect(item.dueAt).toBe(T0 + DAY);
    expect(itemStrength(item)).toBe('learning');
  });

  it('brings an item with an in-lesson mistake back within minutes, at an easier stage', () => {
    const item = introduceItem({ correctStages: ['recognition', 'transfer'], mistakes: 1 }, T0);
    expect(item.stage).toBe('recognition');
    expect(item.relearning).toBe(true);
    expect(item.dueAt).toBe(T0 + RELEARN_DELAY);
  });

  it('keeps a chunk that was only shown at introduced', () => {
    expect(introduceItem({ correctStages: [], mistakes: 0 }, T0).stage).toBe('introduced');
  });
});

describe('recordAnswer', () => {
  const fresh = introduceItem({ correctStages: ['recognition', 'supportedRecall'], mistakes: 0 }, T0);

  it('grows the interval after each successful review: 1, 3, 7, 14, 30 days', () => {
    const intervals: Array<number> = [];
    let item = fresh;
    for (let i = 0; i < 5; i++) {
      const at = item.dueAt;
      item = recordAnswer(item, answer(true, exerciseStageFor(item.stage)), at);
      intervals.push((item.dueAt - at) / DAY);
    }
    expect(intervals).toEqual([3, 7, 14, 30, 60]);
    expect(item.stage).toBe('transfer');
  });

  it('shortens the interval after a wrong answer and asks again in 10 minutes', () => {
    const known = reviewCorrectly(fresh, 3); // on the 14-day interval
    expect(known.step).toBe(3);
    const failed = recordAnswer(known, answer(false, 'transfer'), known.dueAt);
    expect(failed.dueAt).toBe(known.dueAt + RELEARN_DELAY);
    expect(failed.step).toBe(1);
    expect(failed.relearning).toBe(true);
    expect(failed.lapses).toBe(1);
    expect(exerciseStageFor(failed.stage)).toBe('independentRecall');
    // Recalled again: back on the shortened interval (3 days), not restarted.
    const recovered = recordAnswer(failed, answer(true, 'independentRecall'), failed.dueAt);
    expect(recovered.relearning).toBe(false);
    expect(recovered.dueAt - failed.dueAt).toBe(calculateNextReviewDate(1, 0));
  });

  it('does not push an item out when it is practised before it is due', () => {
    const early = recordAnswer(fresh, answer(true, 'independentRecall'), T0 + DAY / 2);
    expect(early.dueAt).toBe(fresh.dueAt);
    expect(early.step).toBe(0);
    expect(early.correct).toBe(fresh.correct + 1);
  });

  it('only calls an item strong after unaided recall survives a week-long gap', () => {
    expect(itemStrength(undefined)).toBe('new');
    expect(itemStrength(reviewCorrectly(fresh, 2))).toBe('learning');
    expect(itemStrength(reviewCorrectly(fresh, 3))).toBe('strong');
  });

  it('keeps a short history of attempts', () => {
    const item = reviewCorrectly(fresh, 20);
    expect(item.history.length).toBe(12);
    expect(item.history.at(-1)).toMatchObject({ correct: true, mode: 'focused' });
  });
});
