// Choosing an exercise for a learning item, and generating simple drills for
// items that have no authored exercise at the stage they need.
import { exerciseItemIds, type CurriculumIndex } from '../curriculum/assemble';
import type { Exercise, ExerciseStage, LearningItem } from '../curriculum/types';
import { normalizeAnswer } from './answers';
import { exerciseStageFor } from './schedule';
import type { ItemProgress, PracticeMode } from './types';

export type PlannedExercise = {
  /** Unique within a session (a React key). */
  key: string;
  /**
   * Stable id recorded in results and history: "lesson-id/exercise-id" for
   * authored exercises, "gen:item-id:drill" for generated ones.
   */
  exerciseId: string;
  /** The lesson that gives the exercise its context. */
  lessonId: string;
  exercise: Exercise;
  /** The items this exercise grades. */
  itemIds: Array<string>;
  generated: boolean;
};

/** Small deterministic PRNG (mulberry32) seeded from a string, so plans are reproducible. */
export function seededRandom(seed: string): () => number {
  let hash = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(values: ReadonlyArray<T>, random: () => number): Array<T> {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Other items' text to use as wrong options: same module first, then same stage, then anywhere. */
function distractorTexts(
  index: CurriculumIndex,
  item: LearningItem,
  field: 'dutch' | 'english',
  count: number,
  random: () => number,
): Array<string> {
  const taken = new Set([normalizeAnswer(item.dutch), normalizeAnswer(item.english)]);
  const picked: Array<string> = [];
  const pools = [
    index.items.filter((other) => other.moduleId === item.moduleId && other.kind === item.kind),
    index.items.filter((other) => other.moduleId === item.moduleId),
    index.items.filter((other) => other.stageId === item.stageId && other.kind === item.kind),
    index.items,
  ];
  for (const pool of pools) {
    for (const other of shuffle(pool, random)) {
      if (picked.length >= count) return picked;
      const text = other[field];
      const key = normalizeAnswer(text);
      if (other.id === item.id || taken.has(key)) continue;
      taken.add(key);
      picked.push(text);
    }
  }
  return picked;
}

function letterHint(dutch: string): string {
  return dutch
    .split(' ')
    .map((word) => word.replace(/(?<=\p{L}.*)\p{L}/gu, '_'))
    .join(' ');
}

function explain(item: LearningItem): string {
  return `${item.dutch} means "${item.english}".${item.note ? ` (${item.note})` : ''}`;
}

/**
 * A drill for one item at one stage. `variant` rotates between equivalent
 * forms (reading vs listening) so reviews do not always look the same.
 */
export function generateExercise(
  index: CurriculumIndex,
  item: LearningItem,
  stage: ExerciseStage,
  variant: number,
  random: () => number,
): Exercise {
  const base = { id: `gen-${stage}-${variant % 2}`, stage, items: [item.id], explanation: explain(item) };
  const meaningChoice = (listen: boolean): Exercise => ({
    ...base,
    kind: 'choice',
    prompt: listen ? 'Listen. What does it mean?' : `What does "${item.dutch}" mean?`,
    audioText: item.dutch,
    listenOnly: listen || undefined,
    options: shuffle([item.english, ...distractorTexts(index, item, 'english', 2, random)], random),
    answer: item.english,
  });
  const dutchChoice = (): Exercise => ({
    ...base,
    kind: 'choice',
    prompt: `Which one means "${item.english}"?`,
    options: shuffle([item.dutch, ...distractorTexts(index, item, 'dutch', 2, random)], random),
    answer: item.dutch,
  });
  const answers = [item.dutch, ...(item.accept ?? [])];

  switch (stage) {
    case 'recognition':
      return meaningChoice(variant % 2 === 1);
    case 'supportedRecall': {
      if (item.recognitionOnly) return meaningChoice(true);
      const words = item.dutch.split(' ');
      if (words.length >= 3) {
        const extra = distractorTexts(index, item, 'dutch', 3, random)
          .flatMap((text) => text.split(' '))
          .filter((word) => !words.some((own) => normalizeAnswer(own) === normalizeAnswer(word)));
        return {
          ...base,
          kind: 'order',
          prompt: `Build the Dutch for "${item.english}".`,
          words,
          distractors: extra.slice(0, 1),
          english: item.english,
        };
      }
      return { ...base, kind: 'type', prompt: `Type the Dutch for "${item.english}".`, answers, hint: letterHint(item.dutch) };
    }
    case 'independentRecall':
      if (item.recognitionOnly) return dutchChoice();
      return { ...base, kind: 'type', prompt: `How do you say "${item.english}" in Dutch?`, answers };
    case 'transfer':
      if (item.recognitionOnly) return dutchChoice();
      return {
        ...base,
        kind: 'type',
        prompt: 'Listen and type what you hear.',
        audioText: item.dutch,
        listenOnly: true,
        // Dictation: only what was heard. `accept` may hold synonyms ("Wat is je naam?" for "Hoe heet je?").
        answers: [item.dutch],
        explanation: `You heard: ${item.dutch} ("${item.english}").`,
      };
  }
}

type AuthoredExercise = { lessonId: string; exercise: Exercise };

/** Authored exercises that practise an item, outside checkpoints (kept fresh for assessment). */
export function authoredExercisesFor(index: CurriculumIndex, itemId: string, mode: PracticeMode): Array<AuthoredExercise> {
  const found: Array<AuthoredExercise> = [];
  for (const lesson of index.lessons) {
    if (lesson.kind === 'checkpoint') continue;
    for (const exercise of lesson.exercises) {
      if (mode === 'micro' && exercise.focusedOnly) continue;
      if (exerciseItemIds(lesson, exercise).includes(itemId)) found.push({ lessonId: lesson.id, exercise });
    }
  }
  return found;
}

export function exerciseKey(lessonId: string, exercise: Exercise): string {
  return `${lessonId}/${exercise.id}`;
}

/**
 * The exercise for reviewing one item: an authored exercise at the stage the
 * item needs (not the one it saw last), otherwise a generated drill at that
 * stage. Only the reviewed item is graded.
 */
export function chooseReviewExercise(
  index: CurriculumIndex,
  itemId: string,
  progress: ItemProgress | undefined,
  mode: PracticeMode,
  random: () => number,
): PlannedExercise {
  const item = index.item(itemId);
  if (!item) throw new Error(`Unknown learning item ${itemId}`);
  const stage = exerciseStageFor(progress?.stage ?? 'introduced');
  const last = progress?.history.at(-1)?.exerciseId;
  const authored = authoredExercisesFor(index, itemId, mode).filter((entry) => entry.exercise.stage === stage);
  const fresh = authored.filter((entry) => exerciseKey(entry.lessonId, entry.exercise) !== last);
  const choice = fresh.length > 0 ? fresh[Math.floor(random() * fresh.length)] : undefined;
  if (choice) {
    return {
      key: `review:${itemId}:${choice.exercise.id}`,
      exerciseId: exerciseKey(choice.lessonId, choice.exercise),
      lessonId: choice.lessonId,
      exercise: choice.exercise,
      itemIds: [itemId],
      generated: false,
    };
  }
  const exercise = generateExercise(index, item, stage, progress?.history.length ?? 0, random);
  return {
    key: `review:${itemId}:${exercise.id}`,
    exerciseId: `gen:${itemId}:${exercise.id}`,
    lessonId: item.lessonId,
    exercise,
    itemIds: [itemId],
    generated: true,
  };
}

/** Longer text does not fit a match tile (two lines in a 160px column). */
export const MATCH_TILE_CHARS = 32;

/** A match-the-pairs drill over a few items (3 to 5), e.g. a lesson's related chunks. */
export function generateMatch(items: ReadonlyArray<LearningItem>, lessonId: string, random: () => number): PlannedExercise | undefined {
  const short = items.filter((item) => item.dutch.length <= MATCH_TILE_CHARS && item.english.length <= MATCH_TILE_CHARS);
  const usable = short.filter((item, i) =>
    short.findIndex((other) => normalizeAnswer(other.english) === normalizeAnswer(item.english)) === i,
  );
  if (usable.length < 3) return undefined;
  const chosen = shuffle(usable, random).slice(0, 5);
  return {
    key: `match:${lessonId}`,
    exerciseId: `gen:${lessonId}:match`,
    lessonId,
    generated: true,
    itemIds: chosen.map((item) => item.id),
    exercise: {
      id: 'gen-match',
      stage: 'recognition',
      kind: 'match',
      prompt: 'Match the Dutch with the English.',
      pairs: chosen.map((item) => ({ dutch: item.dutch, english: item.english })),
      items: chosen.map((item) => item.id),
      explanation: chosen.map((item) => `${item.dutch}: ${item.english}`).join(' · '),
    },
  };
}

