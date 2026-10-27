import { describe, expect, it } from 'vitest';
import { checkAnswer, normalizeAnswer } from '../../src/engine/answers';
import {
  CHECKPOINT_PASS_SCORE,
  completeLesson,
  createEmptyProgress,
  getNextLearningStage,
  recordAnswer,
  recordCheckpoint,
} from '../../src/engine/progress';
import { calculateNextReviewDate, DAY_MS, RELEARN_DELAY_MS } from '../../src/engine/schedule';
import {
  getDueReviews,
  getExerciseForStage,
  getInitialExercises,
  getNextActivity,
  isLessonUnlocked,
} from '../../src/engine/selection';
import { isItemStrong, summarizeProgress } from '../../src/engine/summary';
import type { LearnerProgress } from '../../src/engine/types';
import { fixtureCurriculum as curriculum, fixtureLesson, fixtureLessons as lessons } from '../fixtures/curriculum';

const T0 = Date.UTC(2026, 0, 5, 9, 0, 0);

function exercise(lessonId: string, id: string) {
  return fixtureLesson(lessonId).exercises.find((e) => e.id === id)!;
}

/** Learn a lesson and answer its recognition exercise. */
function learn(progress: LearnerProgress, lessonId: string, now: number, correct = true): LearnerProgress {
  const answered = recordAnswer(progress, { lessonId, exercise: exercise(lessonId, 'rec'), correct, mode: 'focused', now });
  return completeLesson(answered, lessonId, now);
}

describe('review intervals', () => {
  it('follows the 1, 3, 7, 14, 30 day ladder and relearns failures within minutes', () => {
    expect(calculateNextReviewDate(0, T0)).toBe(T0 + RELEARN_DELAY_MS);
    expect([1, 2, 3, 4, 5].map((step) => (calculateNextReviewDate(step, T0) - T0) / DAY_MS)).toEqual([1, 3, 7, 14, 30]);
  });
});

describe('getNextActivity', () => {
  it('starts a new learner at the first pre-A1 lesson', () => {
    const activity = getNextActivity(curriculum, lessons, createEmptyProgress(), { mode: 'micro', now: T0 });
    expect(activity.kind).toBe('new-lesson');
    expect(activity.kind === 'new-lesson' && activity.lesson.id).toBe('a1');
  });

  it('continues with the next lesson in order', () => {
    const progress = learn(createEmptyProgress(), 'a1', T0);
    const activity = getNextActivity(curriculum, lessons, progress, { mode: 'micro', now: T0 + 1000 });
    expect(activity.kind === 'new-lesson' && activity.lesson.id).toBe('a2');
  });

  it('prioritises a due review over an unrelated new lesson', () => {
    const progress = learn(createEmptyProgress(), 'a1', T0);
    const activity = getNextActivity(curriculum, lessons, progress, { mode: 'micro', now: T0 + DAY_MS + 1 });
    expect(activity.kind).toBe('review');
    expect(activity.kind === 'review' && activity.lesson.id).toBe('a1');
  });

  it('skips lessons excluded for this browsing session', () => {
    let progress = learn(createEmptyProgress(), 'a1', T0);
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'cloze'), correct: false, mode: 'micro', now: T0 + DAY_MS });
    const later = T0 + DAY_MS + RELEARN_DELAY_MS + 1;
    expect(getNextActivity(curriculum, lessons, progress, { mode: 'micro', now: later }).kind).toBe('review');
    const activity = getNextActivity(curriculum, lessons, progress, { mode: 'micro', now: later, excludeLessonIds: ['a1'] });
    expect(activity.kind === 'new-lesson' && activity.lesson.id).toBe('a2');
  });

  it('offers checkpoints only in focused practice', () => {
    let progress = createEmptyProgress();
    for (const id of ['a1', 'a2', 'a3']) progress = learn(progress, id, T0);
    expect(getNextActivity(curriculum, lessons, progress, { mode: 'focused', now: T0 }).kind).toBe('checkpoint');
    expect(getNextActivity(curriculum, lessons, progress, { mode: 'micro', now: T0 }).kind).toBe('focused-only');
  });

  it('opens the next stage once the previous stage checkpoint has been attempted', () => {
    let progress = createEmptyProgress();
    for (const id of ['a1', 'a2', 'a3']) progress = learn(progress, id, T0);
    expect(isLessonUnlocked(curriculum, progress, fixtureLesson('b1'))).toBe(false);
    const checkpoint = fixtureLesson('check0');
    progress = recordCheckpoint(progress, checkpoint, checkpoint.exercises.map((e) => ({ exercise: e, correct: true })), T0).progress;
    expect(isLessonUnlocked(curriculum, progress, fixtureLesson('b1'))).toBe(true);
    const activity = getNextActivity(curriculum, lessons, progress, { mode: 'focused', now: T0 + 1 });
    expect(activity.kind === 'new-lesson' && activity.lesson.id).toBe('b1');
  });

  it('reports done when everything is complete and nothing is due', () => {
    let progress = createEmptyProgress();
    for (const l of lessons) {
      if (l.kind === 'checkpoint') progress = recordCheckpoint(progress, l, l.exercises.map((e) => ({ exercise: e, correct: true })), T0).progress;
      else progress = learn(progress, l.id, T0);
    }
    expect(getNextActivity(curriculum, lessons, progress, { mode: 'focused', now: T0 + 1 }).kind).toBe('done');
  });
});

describe('recordAnswer', () => {
  it('a correct first answer moves the item to recognition and schedules a review tomorrow', () => {
    const progress = learn(createEmptyProgress(), 'a1', T0);
    const item = progress.items.a1!;
    expect(item.level).toBe('recognition');
    expect(item.step).toBe(1);
    expect(item.dueAt).toBe(T0 + DAY_MS);
    expect(progress.completedLessons.a1).toBe(T0);
  });

  it('successful recall progresses difficulty and lengthens the interval', () => {
    let progress = learn(createEmptyProgress(), 'a1', T0);
    expect(getNextLearningStage(progress.items.a1!.level)).toBe('supportedRecall');

    const day1 = T0 + DAY_MS;
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'cloze'), correct: true, mode: 'micro', now: day1 });
    expect(progress.items.a1!.level).toBe('supportedRecall');
    expect(progress.items.a1!.dueAt).toBe(day1 + 3 * DAY_MS);

    const day4 = day1 + 3 * DAY_MS;
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'type'), correct: true, mode: 'micro', now: day4 });
    expect(progress.items.a1!.level).toBe('independentRecall');
    expect(progress.items.a1!.dueAt).toBe(day4 + 7 * DAY_MS);
    expect(getNextLearningStage(progress.items.a1!.level)).toBe('transfer');
  });

  it('practising before the review is due does not earn extra spacing', () => {
    let progress = learn(createEmptyProgress(), 'a1', T0);
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'cloze'), correct: true, mode: 'focused', now: T0 + 60_000 });
    expect(progress.items.a1!.step).toBe(1);
    expect(progress.items.a1!.dueAt).toBe(T0 + DAY_MS);
    expect(progress.items.a1!.level).toBe('supportedRecall');
  });

  it('a wrong answer lowers the level, shortens the interval and brings the review forward', () => {
    let progress = learn(createEmptyProgress(), 'a1', T0);
    const day1 = T0 + DAY_MS;
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'cloze'), correct: true, mode: 'micro', now: day1 });
    const day4 = day1 + 3 * DAY_MS;
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'type'), correct: false, mode: 'micro', now: day4 });
    const item = progress.items.a1!;
    expect(item.level).toBe('recognition');
    expect(item.step).toBe(0);
    expect(item.dueAt).toBe(day4 + RELEARN_DELAY_MS);
    expect(item.incorrectCount).toBe(1);
    // The next exercise is easier than the one that was failed.
    expect(getNextLearningStage(item.level)).toBe('supportedRecall');
    // Other lessons are untouched: one forgotten phrase does not restart the course.
    expect(Object.keys(progress.completedLessons)).toEqual(['a1']);
  });

  it('keeps a capped history of attempts', () => {
    let progress = learn(createEmptyProgress(), 'a1', T0);
    for (let i = 1; i <= 30; i++) {
      progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'rec'), correct: i % 2 === 0, mode: 'micro', now: T0 + i });
    }
    expect(progress.items.a1!.history).toHaveLength(20);
    expect(progress.items.a1!.correctCount + progress.items.a1!.incorrectCount).toBe(31);
  });

  it('only counts an item as strong after independent recall survives a week-long interval', () => {
    let progress = learn(createEmptyProgress(), 'a1', T0);
    expect(isItemStrong(progress.items.a1)).toBe(false);
    let now = T0;
    for (const id of ['cloze', 'type', 'transfer']) {
      now = progress.items.a1!.dueAt;
      progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', id), correct: true, mode: 'focused', now });
    }
    expect(progress.items.a1!.level).toBe('transfer');
    expect(isItemStrong(progress.items.a1)).toBe(true);
  });
});

describe('getExerciseForStage', () => {
  it('returns the exercise for the requested stage', () => {
    expect(getExerciseForStage(fixtureLesson('a1'), 'supportedRecall', 'micro')?.id).toBe('cloze');
  });

  it('never gives focused-only exercises in micro mode', () => {
    const picked = getExerciseForStage(fixtureLesson('a1'), 'transfer', 'micro');
    expect(picked?.id).toBe('transfer');
  });

  it('rotates to the least recently seen exercise at the same stage', () => {
    let progress = learn(createEmptyProgress(), 'a1', T0);
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'type'), correct: true, mode: 'focused', now: T0 + 5 });
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'write'), correct: true, mode: 'focused', now: T0 + 6 });
    // At the top level, independent recall and transfer exercises take turns, least recent first.
    expect(progress.items.a1!.level).toBe('transfer');
    expect(getExerciseForStage(fixtureLesson('a1'), 'transfer', 'focused', progress.items.a1)?.id).toBe('transfer');
    progress = recordAnswer(progress, { lessonId: 'a1', exercise: exercise('a1', 'transfer'), correct: true, mode: 'focused', now: T0 + 7 });
    expect(getExerciseForStage(fixtureLesson('a1'), 'transfer', 'focused', progress.items.a1)?.id).toBe('type');
  });

  it('starts a lesson with recognition, adding supported recall in focused practice', () => {
    expect(getInitialExercises(fixtureLesson('a1'), 'micro').map((e) => e.id)).toEqual(['rec']);
    expect(getInitialExercises(fixtureLesson('a1'), 'focused').map((e) => e.id)).toEqual(['rec', 'cloze']);
  });
});

describe('recordCheckpoint', () => {
  it('scores the attempt and sends lessons behind wrong answers back into review', () => {
    let progress = createEmptyProgress();
    for (const id of ['a1', 'a2', 'a3']) progress = learn(progress, id, T0);
    const checkpoint = fixtureLesson('check0');
    const now = T0 + 2 * DAY_MS;
    const answers = checkpoint.exercises.map((e) => ({ exercise: e, correct: e.testsLesson !== 'a2' }));
    const result = recordCheckpoint(progress, checkpoint, answers, now);

    expect(result.score).toBeCloseTo(3 / 5);
    expect(result.passed).toBe(3 / 5 >= CHECKPOINT_PASS_SCORE);
    expect(result.lessonsToReview).toEqual(['a2']);
    expect(result.progress.items.a2!.dueAt).toBe(now);
    expect(result.progress.checkpoints.check0).toMatchObject({ attempts: 1, passedAt: null });
    expect(getDueReviews(lessons, result.progress, now).map((r) => r.lesson.id)).toContain('a2');
  });

  it('records a pass and keeps the best score', () => {
    let progress = createEmptyProgress();
    for (const id of ['a1', 'a2', 'a3']) progress = learn(progress, id, T0);
    const checkpoint = fixtureLesson('check0');
    const all = checkpoint.exercises.map((e) => ({ exercise: e, correct: true }));
    progress = recordCheckpoint(progress, checkpoint, all, T0).progress;
    progress = recordCheckpoint(progress, checkpoint, all.map((a) => ({ ...a, correct: false })), T0 + 1).progress;
    expect(progress.checkpoints.check0).toMatchObject({ attempts: 2, bestScore: 1, lastScore: 0, passedAt: T0 });
  });
});

describe('summarizeProgress', () => {
  it('separates completed lessons from demonstrated recall', () => {
    let progress = learn(createEmptyProgress(), 'a1', T0);
    progress = learn(progress, 'a2', T0, false);
    const summary = summarizeProgress(curriculum, lessons, progress, T0 + 1);
    expect(summary.completedLessons).toBe(2);
    expect(summary.levelCounts.recognition).toBe(1);
    expect(summary.levelCounts.introduced).toBe(1);
    expect(summary.strongItems).toBe(0);
    expect(summary.nextLesson?.id).toBe('a3');
    expect(summary.currentModule?.id).toBe('m1');
  });
});

describe('checkAnswer', () => {
  it('ignores case, accents, punctuation and spacing but keeps apostrophes', () => {
    expect(normalizeAnswer('  Ik  wil GRAAG één koffie! ')).toBe('ik wil graag een koffie');
    expect(normalizeAnswer("’s Ochtends")).toBe("'s ochtends");
    expect(normalizeAnswer('Het kost €90.')).toBe(normalizeAnswer('het kost € 90'));
  });

  it('accepts listed variants and flags near misses as wrong', () => {
    const type = exercise('a1', 'type');
    expect(checkAnswer(type, 'ik wil koffie').correct).toBe(true);
    const near = checkAnswer(type, 'Ik wil kofie');
    expect(near.correct).toBe(false);
    expect(near.nearMiss).toBe(true);
    expect(checkAnswer(type, '').correct).toBe(false);
  });

  it('checks word order tiles and lenient writing tasks', () => {
    const order = { id: 'o', stage: 'supportedRecall' as const, kind: 'order' as const, prompt: 'p', explanation: 'e', english: 'e', words: ['Vandaag', 'werk', 'ik.'], alternatives: [['Ik', 'werk', 'vandaag.']] };
    expect(checkAnswer(order, ['Ik', 'werk', 'vandaag.']).correct).toBe(true);
    expect(checkAnswer(order, ['Vandaag', 'ik', 'werk.']).correct).toBe(false);
    const write = exercise('a1', 'write');
    expect(checkAnswer(write, 'Ik wil graag thee.').correct).toBe(true);
    expect(checkAnswer(write, 'Koffie.').missing).toEqual(['thee']);
  });
});
