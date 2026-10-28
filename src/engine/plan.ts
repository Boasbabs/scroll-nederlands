// Session plans: the ordered steps of a lesson, review or checkpoint.
import type { CurriculumIndex } from '../curriculum/assemble';
import { exerciseItemIds } from '../curriculum/assemble';
import type { Exercise, ExerciseStage, Lesson } from '../curriculum/types';
import {
  chooseReviewExercise,
  exerciseKey,
  generateExercise,
  generateMatch,
  pairDrill,
  seededRandom,
  shuffle,
  type DrillContext,
  type PlannedExercise,
} from './exercises';
import type { LearnerProgress, PracticeMode } from './types';

export type SessionStep =
  /** The main phrase: audio, meaning, breakdown, examples, tip. */
  | { type: 'learn'; lessonId: string }
  /** The lesson's related chunks, each with audio. */
  | { type: 'chunks'; lessonId: string; itemIds: Array<string> }
  /** A model conversation to listen to and read. */
  | { type: 'dialogue'; lessonId: string }
  /** Listen, say it aloud, optionally record and compare. Not assessed. */
  | { type: 'speak'; lessonId: string }
  /** A new basic word: the Dutch with its article, audio and meaning. */
  | { type: 'word'; itemId: string }
  /** A new sound contrast: the two sounds, how they differ, and the word pairs to play. */
  | { type: 'contrast'; itemId: string }
  | { type: 'exercise'; planned: PlannedExercise };

export type SessionKind = 'lesson' | 'review' | 'checkpoint' | 'words' | 'sounds';

export type SessionPlan = {
  kind: SessionKind;
  mode: PracticeMode;
  /** The lesson being taught or assessed; reviews have none. */
  lessonId?: string;
  /** A stage checkpoint taken early to skip ahead (see completePlacement). */
  placement?: boolean;
  steps: Array<SessionStep>;
};

function authored(lesson: Lesson, exercise: Exercise): PlannedExercise {
  return {
    key: exerciseKey(lesson.id, exercise),
    exerciseId: exerciseKey(lesson.id, exercise),
    lessonId: lesson.id,
    exercise,
    itemIds: exerciseItemIds(lesson, exercise),
    generated: false,
  };
}

/** Most micro-lessons fit a browsing break: the phrase, then two short exercises. */
const MICRO_EXERCISES = 2;

/**
 * Focused: learn card, related chunks, dialogue, speaking, then every exercise
 * from recognition to transfer, with a match drill once the chunks are met.
 * Micro: learn card, then the first recognition and supported-recall
 * exercises that fit a browsing break; reviews pick up the rest later.
 */
export function planLesson(index: CurriculumIndex, lessonId: string, mode: PracticeMode, seed = lessonId): SessionPlan {
  const lesson = index.lesson(lessonId);
  if (!lesson) throw new Error(`Unknown lesson ${lessonId}`);
  if (lesson.kind === 'checkpoint') return planCheckpoint(index, lessonId);
  const random = seededRandom(`${seed}:${mode}`);
  const steps: Array<SessionStep> = [{ type: 'learn', lessonId }];

  if (mode === 'micro') {
    const quick = lesson.exercises.filter((exercise) => !exercise.focusedOnly);
    const picks = [
      quick.find((exercise) => exercise.stage === 'recognition'),
      quick.find((exercise) => exercise.stage === 'supportedRecall'),
    ].filter((exercise): exercise is Exercise => Boolean(exercise));
    const chosen = picks.length > 0 ? picks : quick.slice(0, MICRO_EXERCISES);
    for (const exercise of chosen.slice(0, MICRO_EXERCISES)) steps.push({ type: 'exercise', planned: authored(lesson, exercise) });
    return { kind: 'lesson', mode, lessonId, steps };
  }

  const chunks = lesson.items.slice(1);
  if (chunks.length > 0) steps.push({ type: 'chunks', lessonId, itemIds: chunks.map((item) => item.id) });
  if (lesson.dialogue?.length) steps.push({ type: 'dialogue', lessonId });
  if (lesson.speakingPrompt) steps.push({ type: 'speak', lessonId });

  const match = generateMatch(lesson.items, lessonId, random);
  let matchPlaced = !match;
  for (const exercise of lesson.exercises) {
    if (!matchPlaced && exercise.stage !== 'recognition') {
      steps.push({ type: 'exercise', planned: match! });
      matchPlaced = true;
    }
    steps.push({ type: 'exercise', planned: authored(lesson, exercise) });
  }
  if (!matchPlaced) steps.push({ type: 'exercise', planned: match! });
  return { kind: 'lesson', mode, lessonId, steps };
}

/**
 * New basic words: meet each one, then recognise each, then (focused) type
 * each with a letter hint. Meeting them all first puts a short gap before
 * each word is recalled.
 */
export function planWords(
  index: CurriculumIndex,
  itemIds: ReadonlyArray<string>,
  mode: PracticeMode,
  seed: string,
  context: DrillContext = {},
): SessionPlan {
  const random = seededRandom(`${seed}:${itemIds.join(',')}`);
  const items = itemIds.flatMap((id) => index.item(id) ?? []);
  const stages: Array<ExerciseStage> = mode === 'micro' ? ['recognition'] : ['recognition', 'supportedRecall'];
  const drills = stages.flatMap((stage) =>
    items.map((item, i): SessionStep => {
      const exercise = generateExercise(index, item, stage, i, random, context);
      return {
        type: 'exercise',
        planned: {
          key: `words:${item.id}:${stage}`,
          exerciseId: `gen:${item.id}:${exercise.id}`,
          lessonId: item.lessonId,
          exercise,
          itemIds: [item.id],
          generated: true,
        },
      };
    }),
  );
  return { kind: 'words', mode, steps: [...items.map((item): SessionStep => ({ type: 'word', itemId: item.id })), ...drills] };
}

/** Listening trials after a new contrast's intro card. */
export const CONTRAST_TRIALS = 6;

/**
 * Ear training for one new contrast: its intro card, then six trials. The
 * pairs take turns and each sound is heard equally often, in random order.
 */
export function planSounds(index: CurriculumIndex, itemId: string, seed: string): SessionPlan {
  const item = index.item(itemId);
  const contrast = index.contrast(itemId);
  if (!item || !contrast) throw new Error(`${itemId} is not a sound contrast`);
  const random = seededRandom(`${seed}:${itemId}`);
  const pairs = shuffle(contrast.pairs.map((_, i) => i), random);
  const members = shuffle(Array.from({ length: CONTRAST_TRIALS }, (_, i): 0 | 1 => (i % 2 === 0 ? 0 : 1)), random);
  const trials = members.map((member, i): SessionStep => {
    const exercise = pairDrill(item, contrast, 'recognition', pairs[i % pairs.length]!, member);
    return {
      type: 'exercise',
      planned: { key: `sounds:${itemId}:${i}`, exerciseId: `gen:${itemId}:${exercise.id}`, lessonId: item.lessonId, exercise, itemIds: [itemId], generated: true },
    };
  });
  return { kind: 'sounds', mode: 'focused', steps: [{ type: 'contrast', itemId }, ...trials] };
}

/** The new items a word or ear-training session introduces. */
export function introStepIds(plan: SessionPlan): Array<string> {
  return plan.steps.flatMap((step) => (step.type === 'word' || step.type === 'contrast' ? [step.itemId] : []));
}

/** One exercise per due item, at the stage each item needs. */
export function planReview(
  index: CurriculumIndex,
  progress: LearnerProgress,
  itemIds: ReadonlyArray<string>,
  mode: PracticeMode,
  seed: string,
  context: DrillContext = {},
): SessionPlan {
  const random = seededRandom(`${seed}:${itemIds.join(',')}`);
  return {
    kind: 'review',
    mode,
    steps: itemIds.map((itemId): SessionStep => {
      const planned = chooseReviewExercise(index, itemId, progress.items[itemId], mode, random, context);
      return { type: 'exercise', planned: context.leech?.(itemId) ? { ...planned, leech: true } : planned };
    }),
  };
}

/** Every checkpoint question, in order, scored together. */
export function planCheckpoint(index: CurriculumIndex, lessonId: string): SessionPlan {
  const lesson = index.lesson(lessonId);
  if (!lesson || lesson.kind !== 'checkpoint') throw new Error(`${lessonId} is not a checkpoint`);
  return {
    kind: 'checkpoint',
    mode: 'focused',
    lessonId,
    steps: lesson.exercises.map((exercise) => ({ type: 'exercise', planned: authored(lesson, exercise) })),
  };
}

export function exerciseSteps(plan: SessionPlan): Array<PlannedExercise> {
  return plan.steps.flatMap((step) => (step.type === 'exercise' ? [step.planned] : []));
}
