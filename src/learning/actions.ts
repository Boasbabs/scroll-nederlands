// The one place where UI code turns learner actions into engine updates.
// The side panel and the in-page micro lesson both use these functions.
import { allLessons, curriculum } from '../curriculum';
import type { Curriculum, Exercise, Lesson } from '../curriculum/types';
import { type AnswerCheck, checkAnswer, type ExerciseResponse } from '../engine/answers';
import { type CheckpointAnswer, completeLesson, recordAnswer, recordCheckpoint } from '../engine/progress';
import { getNextActivity } from '../engine/selection';
import type { Activity, LearningMode } from '../engine/types';
import type { LearningStore } from '../storage/store';
import { recordSessionFailure } from '../trigger/browsing';

export type LearningActions = ReturnType<typeof createLearningActions>;

export function createLearningActions(
  store: LearningStore,
  source: Curriculum = curriculum,
  lessons: Array<Lesson> = allLessons,
) {
  return {
    async nextActivity(mode: LearningMode, now: number): Promise<Activity> {
      const [progress, browsing] = await Promise.all([store.getProgress(), store.getBrowsing(now)]);
      const excludeLessonIds = mode === 'micro' ? browsing.failedLessonIds : [];
      return getNextActivity(source, lessons, progress, { mode, now, excludeLessonIds });
    },

    /** Grade a response and save it. Retries after feedback should not call this again. */
    async answer(input: {
      lesson: Lesson;
      exercise: Exercise;
      response: ExerciseResponse;
      mode: LearningMode;
      now: number;
    }): Promise<AnswerCheck> {
      const check = checkAnswer(input.exercise, input.response);
      await store.updateProgress((progress) =>
        recordAnswer(progress, {
          lessonId: input.lesson.id,
          exercise: input.exercise,
          correct: check.correct,
          mode: input.mode,
          now: input.now,
        }),
      );
      if (!check.correct && input.mode === 'micro') {
        await store.updateBrowsing(input.now, (state) => recordSessionFailure(state, input.lesson.id));
      }
      return check;
    },

    completeLesson(lessonId: string, now: number) {
      return store.updateProgress((progress) => completeLesson(progress, lessonId, now));
    },

    async submitCheckpoint(lesson: Lesson, answers: Array<CheckpointAnswer>, now: number) {
      let outcome: ReturnType<typeof recordCheckpoint> | undefined;
      await store.updateProgress((progress) => {
        outcome = recordCheckpoint(progress, lesson, answers, now);
        return outcome.progress;
      });
      return outcome!;
    },
  };
}
