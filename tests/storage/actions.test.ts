import { exerciseSteps } from '../../src/engine/plan';
import { DAY, RELEARN_DELAY } from '../../src/engine/schedule';
import type { ExerciseResult } from '../../src/engine/types';
import { createLearning } from '../../src/learning/actions';
import { createStore } from '../../src/storage/store';
import { makeCourse } from '../fixtures/curriculum';
import { createMemoryArea } from '../fixtures/memory-storage';

const T0 = Date.UTC(2026, 9, 27, 9);

function setup() {
  let clock = T0;
  const area = createMemoryArea();
  const course = makeCourse();
  const make = () => createLearning({ store: createStore(area), course, now: () => clock });
  return { panel: make(), page: make(), advance: (ms: number) => (clock += ms) };
}

function answerAll(plan: Parameters<typeof exerciseSteps>[0], correct: (i: number) => boolean): Array<ExerciseResult> {
  return exerciseSteps(plan).map((planned, i) => ({
    exerciseId: planned.exerciseId,
    stage: planned.exercise.stage,
    itemIds: planned.itemIds,
    correct: correct(i),
  }));
}

describe('shared learning actions', () => {
  it('lets micro-learning continue exactly where focused practice left off', async () => {
    const { panel, page, advance } = setup();
    const first = (await panel.startNext('focused'))!;
    expect(first).toMatchObject({ kind: 'lesson', lessonId: 'x0-a-hello' });
    const outcome = await panel.finish(first, answerAll(first, () => true));
    expect(outcome.newItemIds).toEqual(['x0-a-hello/hallo-daar']);
    expect(outcome.next).toEqual({ type: 'lesson', lessonId: 'x0-a-thanks' });

    // The in-page card (another page, same storage) picks up the next lesson…
    const micro = (await page.startNext('micro'))!;
    expect(micro).toMatchObject({ kind: 'lesson', lessonId: 'x0-a-thanks', mode: 'micro' });
    await page.finish(micro, answerAll(micro, () => true));

    // …and a day later both see the same due reviews first.
    advance(DAY + 1);
    const review = (await panel.startNext('focused'))!;
    expect(review.kind).toBe('review');
    expect(exerciseSteps(review).flatMap((planned) => planned.itemIds).sort()).toEqual([
      'x0-a-hello/hallo-daar',
      'x0-a-thanks/dank-je-wel',
    ]);
  });

  it('reports missed items so the browsing session can avoid repeating them', async () => {
    const { page } = setup();
    const plan = (await page.startNext('micro'))!;
    const outcome = await page.finish(plan, answerAll(plan, (i) => i > 0));
    expect(outcome.missedItemIds).toEqual(['x0-a-hello/hallo-daar']);
    expect(outcome.correct).toBe(outcome.total - 1);
  });

  it('refuses to start a locked lesson from the roadmap', async () => {
    const { panel } = setup();
    await expect(panel.startLesson('x1-a-coffee', 'focused')).rejects.toThrow(/locked/);
  });

  it('scores a checkpoint in focused practice', async () => {
    const { panel, advance } = setup();
    for (let i = 0; i < 3; i++) {
      const plan = (await panel.startNext('focused'))!;
      await panel.finish(plan, answerAll(plan, () => true));
    }
    const checkpoint = (await panel.startNext('focused'))!;
    expect(checkpoint.kind).toBe('checkpoint');
    const outcome = await panel.finish(checkpoint, answerAll(checkpoint, (i) => i < 3));
    expect(outcome.checkpoint).toEqual({ score: 0.6, passed: false, missedLessonIds: ['x0-a-thanks', 'x0-a-hello'] });
    expect((await panel.snapshot('focused')).summary.dueNow).toBe(0);
    advance(RELEARN_DELAY);
    const snapshot = await panel.snapshot('focused');
    expect(snapshot.summary.dueNow).toBe(2);
    expect(snapshot.next.type).toBe('review');
  });
});
