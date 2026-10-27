import { course } from '../../src/curriculum';
import { generateExercise, generateMatch, chooseReviewExercise, MATCH_TILE_CHARS, seededRandom } from '../../src/engine/exercises';
import { exerciseSteps, planCheckpoint, planLesson, planReview } from '../../src/engine/plan';
import { completeCheckpoint, completeLesson, mergeProgress, recordReviewResults } from '../../src/engine/progress';
import { DAY, RELEARN_DELAY } from '../../src/engine/schedule';
import { getDueItemIds, getNextActivity, isLessonUnlocked } from '../../src/engine/selection';
import { summarizeProgress } from '../../src/engine/summary';
import { emptyProgress, type ExerciseResult, type LearnerProgress } from '../../src/engine/types';
import { makeCourse } from '../fixtures/curriculum';

const T0 = Date.UTC(2026, 9, 27, 9);
const index = makeCourse();

function allCorrect(lessonId: string, mode: 'micro' | 'focused' = 'focused', correct = true): Array<ExerciseResult> {
  return exerciseSteps(planLesson(index, lessonId, mode)).map((planned) => ({
    exerciseId: planned.exerciseId,
    stage: planned.exercise.stage,
    itemIds: planned.itemIds,
    correct,
  }));
}

function finish(progress: LearnerProgress, lessonId: string, at = T0, correct = true): LearnerProgress {
  return completeLesson(progress, index, lessonId, allCorrect(lessonId, 'focused', correct), 'focused', at);
}

describe('where a learner starts', () => {
  it('starts a new learner on the first pre-A1 lesson of the real course', () => {
    const next = getNextActivity(course, emptyProgress(), T0, { mode: 'focused' });
    expect(next).toEqual({ type: 'lesson', lessonId: course.lessons[0]!.id });
    expect(course.lesson(course.lessons[0]!.id)?.level).toBe('pre-a1');
  });

  it('opens lessons in course order', () => {
    const progress = finish(emptyProgress(), 'x0-a-hello');
    expect(isLessonUnlocked(index, progress, 'x0-a-thanks')).toBe(true);
    expect(isLessonUnlocked(index, progress, 'x0-a-bye')).toBe(false);
    expect(getNextActivity(index, progress, T0, { mode: 'focused' })).toEqual({ type: 'lesson', lessonId: 'x0-a-thanks' });
  });
});

describe('getNextActivity', () => {
  it('puts due reviews before an unrelated new lesson', () => {
    const progress = finish(emptyProgress(), 'x0-a-hello');
    const tomorrow = T0 + DAY + 1;
    const next = getNextActivity(index, progress, tomorrow, { mode: 'focused' });
    expect(next).toMatchObject({ type: 'review', itemIds: ['x0-a-hello/hallo-daar'] });
    expect(getNextActivity(index, progress, T0 + 60_000, { mode: 'focused' })).toEqual({ type: 'lesson', lessonId: 'x0-a-thanks' });
  });

  it('takes small review batches in micro mode', () => {
    let progress = emptyProgress();
    for (const id of ['x0-a-hello', 'x0-a-thanks', 'x0-a-bye']) progress = finish(progress, id, T0, false);
    const due = getDueItemIds(progress, T0 + RELEARN_DELAY);
    expect(due.length).toBe(3);
    const micro = getNextActivity(index, progress, T0 + RELEARN_DELAY, { mode: 'micro' });
    expect(micro).toMatchObject({ type: 'review', dueCount: 3 });
  });

  it('does not offer an item again in the same browsing session after it was failed', () => {
    const progress = finish(emptyProgress(), 'x0-a-hello');
    const later = T0 + DAY + 1;
    const next = getNextActivity(index, progress, later, { mode: 'micro', excludeItemIds: new Set(['x0-a-hello/hallo-daar']) });
    expect(next).toEqual({ type: 'lesson', lessonId: 'x0-a-thanks' });
  });

  it('keeps checkpoints for focused practice and stage order behind them', () => {
    let progress = emptyProgress();
    for (const id of ['x0-a-hello', 'x0-a-thanks', 'x0-a-bye']) progress = finish(progress, id);
    expect(getNextActivity(index, progress, T0 + 1, { mode: 'focused' })).toEqual({ type: 'checkpoint', lessonId: 'x0-check-one' });
    expect(getNextActivity(index, progress, T0 + 1, { mode: 'micro' })).toMatchObject({ type: 'caughtUp', checkpointLessonId: 'x0-check-one' });
    expect(isLessonUnlocked(index, progress, 'x1-a-coffee')).toBe(false);
  });
});

describe('lesson plans', () => {
  it('runs a focused lesson from learning the phrase through every stage', () => {
    const lesson = course.lessons.find((entry) => entry.id === 's0-greet-hello')!;
    const plan = planLesson(course, lesson.id, 'focused');
    expect(plan.steps[0]).toEqual({ type: 'learn', lessonId: lesson.id });
    expect(plan.steps.map((step) => step.type)).toEqual(expect.arrayContaining(['chunks', 'speak', 'exercise']));
    const stages = exerciseSteps(plan).map((planned) => planned.exercise.stage);
    expect(stages[0]).toBe('recognition');
    expect(stages.at(-1)).toBe('transfer');
    expect(exerciseSteps(plan).some((planned) => planned.exercise.kind === 'match')).toBe(true);
  });

  it('keeps match tiles short: long sentences stay out of generated pairs', () => {
    for (const lesson of course.lessons.filter((entry) => entry.kind !== 'checkpoint')) {
      for (const planned of exerciseSteps(planLesson(course, lesson.id, 'focused'))) {
        if (planned.exercise.kind !== 'match') continue;
        for (const pair of planned.exercise.pairs) {
          expect(pair.dutch.length, lesson.id).toBeLessThanOrEqual(MATCH_TILE_CHARS);
          expect(pair.english.length, lesson.id).toBeLessThanOrEqual(MATCH_TILE_CHARS);
        }
      }
    }
    const lesson = course.lesson('s1-connect-practice')!;
    const random = seededRandom('tiles');
    expect(lesson.items.some((item) => item.dutch.length > MATCH_TILE_CHARS)).toBe(true);
    expect(generateMatch(lesson.items, lesson.id, random)).toBeUndefined();
  });

  it('keeps a micro lesson short and free of focused-only exercises', () => {
    for (const lesson of course.lessons.filter((entry) => entry.kind !== 'checkpoint')) {
      const exercises = exerciseSteps(planLesson(course, lesson.id, 'micro'));
      expect(exercises.length, lesson.id).toBeGreaterThan(0);
      expect(exercises.length, lesson.id).toBeLessThanOrEqual(2);
      expect(exercises.every((planned) => !planned.exercise.focusedOnly), lesson.id).toBe(true);
    }
  });

  it('builds reviews at the stage each item needs, generating drills for chunks without authored ones', () => {
    let progress = emptyProgress();
    const lesson = course.lesson('s0-greet-hello')!;
    progress = completeLesson(progress, course, lesson.id, [], 'focused', T0);
    const chunk = lesson.items[1]!;
    const plan = planReview(course, progress, [lesson.items[0]!.id, chunk.id], 'micro', 'seed');
    const [main, drill] = exerciseSteps(plan);
    expect(main!.generated).toBe(false);
    expect(main!.exercise.stage).toBe('recognition');
    expect(drill!.generated).toBe(true);
    expect(drill!.itemIds).toEqual([chunk.id]);
  });

  it('generates sensible drills for every stage of every item', () => {
    const random = seededRandom('drills');
    for (const item of course.items.slice(0, 400)) {
      for (const stage of ['recognition', 'supportedRecall', 'independentRecall', 'transfer'] as const) {
        const exercise = generateExercise(course, item, stage, 1, random);
        if (exercise.kind === 'choice') {
          expect(exercise.options, item.id).toContain(exercise.answer);
          expect(new Set(exercise.options).size, item.id).toBe(exercise.options.length);
          expect(exercise.options.length, item.id).toBeGreaterThanOrEqual(2);
        }
        if (exercise.kind === 'type') expect(exercise.answers[0]).toBe(item.dutch);
      }
    }
  });

  it('does not repeat the exercise an item saw last when another fits', () => {
    let progress = completeLesson(emptyProgress(), course, 's0-greet-hello', [], 'focused', T0);
    const itemId = course.lesson('s0-greet-hello')!.items[0]!.id;
    const first = chooseReviewExercise(course, itemId, progress.items[itemId], 'focused', seededRandom('a'));
    progress = recordReviewResults(
      progress,
      [{ exerciseId: first.exerciseId, stage: first.exercise.stage, itemIds: [itemId], correct: false }],
      'focused',
      T0 + DAY,
    );
    const second = chooseReviewExercise(course, itemId, progress.items[itemId], 'focused', seededRandom('a'));
    expect(second.exercise.stage).toBe('recognition');
  });
});

describe('completing sessions', () => {
  it('separates lesson completion from demonstrated recall', () => {
    const progress = finish(emptyProgress(), 'x0-a-hello');
    expect(progress.lessons['x0-a-hello']?.completedAt).toBe(T0);
    const summary = summarizeProgress(index, progress, T0);
    expect(summary.lessons.completed).toBe(1);
    expect(summary.items.strong).toBe(0);
    expect(summary.items.learning).toBe(1);
  });

  it('scores a checkpoint and sends the items behind wrong answers back into review', () => {
    let progress = emptyProgress();
    for (const id of ['x0-a-hello', 'x0-a-thanks', 'x0-a-bye']) progress = finish(progress, id);
    const plan = planCheckpoint(index, 'x0-check-one');
    const results = exerciseSteps(plan).map((planned, i) => ({
      exerciseId: planned.exerciseId,
      stage: planned.exercise.stage,
      itemIds: planned.itemIds,
      correct: i !== 1,
    }));
    const outcome = completeCheckpoint(progress, index, 'x0-check-one', results, T0 + 2 * DAY);
    expect(outcome.score).toBe(0.8);
    expect(outcome.passed).toBe(true);
    expect(outcome.missedLessonIds).toEqual(['x0-a-thanks']);
    expect(outcome.progress.items['x0-a-thanks/dank-je-wel']?.relearning).toBe(true);
    expect(isLessonUnlocked(index, outcome.progress, 'x1-a-coffee')).toBe(true);
  });

  it('merges progress written by two pages without losing either', () => {
    const base = finish(emptyProgress(), 'x0-a-hello');
    const panel = finish(base, 'x0-a-thanks', T0 + 1000);
    const page = recordReviewResults(
      base,
      [{ exerciseId: 'x', stage: 'supportedRecall', itemIds: ['x0-a-hello/hallo-daar'], correct: false }],
      'micro',
      T0 + 2000,
    );
    const merged = mergeProgress(panel, page);
    expect(merged.lessons['x0-a-thanks']?.completedAt).toBe(T0 + 1000);
    expect(merged.items['x0-a-hello/hallo-daar']?.relearning).toBe(true);
    expect(merged.items['x0-a-thanks/dank-je-wel']).toBeDefined();
  });

  it('summarises stage progress, due reviews and the week ahead', () => {
    const progress = finish(emptyProgress(), 'x0-a-hello', T0, false);
    const summary = summarizeProgress(index, progress, T0 + RELEARN_DELAY);
    expect(summary.dueNow).toBe(1);
    expect(summary.forecast[0]).toBe(1);
    expect(summary.stages[0]).toMatchObject({ id: 'x0', completed: 1, total: 4 });
    expect(summary.current).toEqual({ stageId: 'x0', moduleId: 'x0-a', lessonId: 'x0-a-thanks' });
    expect(summary.activeDays).toBe(1);
  });
});
