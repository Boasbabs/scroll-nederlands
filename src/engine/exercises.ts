// Choosing an exercise for a learning item, and generating simple drills for
// items that have no authored exercise at the stage they need.
import { ARTICLES_STAGE, articleOf, isArticleItemId, nounIdOf, withoutArticle } from '../articles/assemble';
import { CORRECTIONS_STAGE } from '../corrections/assemble';
import type { Correction } from '../corrections/types';
import { exerciseItemIds, type CurriculumIndex } from '../curriculum/assemble';
import type { Exercise, ExerciseStage, LearningItem, Lesson } from '../curriculum/types';
import { SOUNDS_STAGE } from '../sounds/assemble';
import type { SoundContrast } from '../sounds/types';
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
  /** A review of an item that keeps slipping and has nothing of the learner's yet: a miss offers "Make it yours". */
  leech?: boolean;
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

/** Other items to use as wrong options: same module first, then same stage, then anywhere. */
function distractors(
  index: CurriculumIndex,
  item: LearningItem,
  field: 'dutch' | 'english',
  count: number,
  random: () => number,
  usable: (other: LearningItem) => boolean = () => true,
): Array<LearningItem> {
  const taken = new Set([normalizeAnswer(item.dutch), normalizeAnswer(item.english)]);
  const picked: Array<LearningItem> = [];
  const pools = [
    index.items.filter((other) => other.moduleId === item.moduleId && other.kind === item.kind),
    index.items.filter((other) => other.moduleId === item.moduleId),
    index.items.filter((other) => other.stageId === item.stageId && other.kind === item.kind),
    // A contrast item's text ("man · maan") is not an answer to anything; an article item repeats its
    // noun; a correction is the learner's own sentence.
    index.items.filter((other) => ![SOUNDS_STAGE, ARTICLES_STAGE, CORRECTIONS_STAGE].includes(other.stageId)),
  ];
  for (const pool of pools) {
    for (const other of shuffle(pool, random)) {
      if (picked.length >= count) return picked;
      const key = normalizeAnswer(other[field]);
      if (other.id === item.id || taken.has(key) || !usable(other)) continue;
      taken.add(key);
      picked.push(other);
    }
  }
  return picked;
}

function distractorTexts(index: CurriculumIndex, item: LearningItem, field: 'dutch' | 'english', count: number, random: () => number): Array<string> {
  return distractors(index, item, field, count, random).map((other) => other[field]);
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

/** A lesson example with the phrase blanked out, for recalling it in context. */
export type ExampleGap = { sentence: string; answer: string; english: string };

/**
 * The first example of the lesson that contains the phrase word for word
 * (case and punctuation aside) and says something more, with the phrase
 * replaced by "___". The answer is the phrase as the example writes it.
 * Two-word examples are word lists from the sound lessons ("vel, veel"), not context.
 */
export function exampleGap(lesson: Pick<Lesson, 'examples'>, dutch: string): ExampleGap | undefined {
  const target = normalizeAnswer(dutch.replace(/…|\.{3}/g, ' ')).split(' ').filter(Boolean);
  if (target.length === 0) return undefined;
  for (const example of lesson.examples ?? []) {
    const tokens = example.dutch.split(/\s+/).filter(Boolean);
    if (tokens.length <= target.length || tokens.length < 3) continue;
    const plain = tokens.map((token) => normalizeAnswer(token));
    for (let start = 0; start + target.length <= tokens.length; start++) {
      if (!target.every((word, i) => plain[start + i] === word)) continue;
      const span = tokens.slice(start, start + target.length).join(' ');
      const lead = /^[^\p{L}\p{N}]*/u.exec(span)![0];
      const trail = /[^\p{L}\p{N}]*$/u.exec(span)![0];
      const sentence = [...tokens.slice(0, start), `${lead}___${trail}`, ...tokens.slice(start + target.length)].join(' ');
      return { sentence, answer: span.slice(lead.length, span.length - trail.length), english: example.english };
    }
  }
  return undefined;
}

/**
 * The learner's note with the item blanked out, when the note uses it word
 * for word: the whole Dutch ("de vork"), else a noun without its article
 * ("Mijn vork is van zilver." → "Mijn ___ is van zilver.").
 */
export function personalGap(note: string, dutch: string): ExampleGap | undefined {
  const examples = [{ dutch: note, english: '' }];
  return exampleGap({ examples }, dutch) ?? (articleOf(dutch) ? exampleGap({ examples }, withoutArticle(dutch)) : undefined);
}

/** What the learner has added that changes how drills look. */
export type DrillContext = {
  /** Whether an item has a picture (bundled or the learner's own) to use as a cue. */
  hasPicture?: (itemId: string) => boolean;
  /** The learner's own line about an item (Make it yours). */
  noteFor?: (itemId: string) => string | undefined;
  /** Items to offer "Make it yours" if missed (see leechCheck). */
  leech?: (itemId: string) => boolean;
};

/** Recall stages answered from the learner's own note when it uses the word. */
function isRecallStage(stage: ExerciseStage): boolean {
  return stage === 'supportedRecall' || stage === 'independentRecall';
}

/**
 * Ear training: one word of a minimal pair is played and the learner picks
 * which it was. The same drill serves every stage, so a contrast climbs the
 * stages (and becomes strong) by ear alone.
 */
export function pairDrill(item: LearningItem, contrast: SoundContrast, stage: ExerciseStage, pairIndex: number, member: 0 | 1): Exercise {
  const pair = contrast.pairs[pairIndex % contrast.pairs.length]!;
  const [first, second] = pair;
  return {
    id: `gen-pair-${pairIndex % contrast.pairs.length}-${member}`,
    stage,
    items: [item.id],
    kind: 'choice',
    prompt: 'Listen. Which word did you hear?',
    audioText: pair[member].dutch,
    listenOnly: true,
    options: [first.dutch, second.dutch],
    answer: pair[member].dutch,
    explanation: `${first.dutch} means "${first.english}"; ${second.dutch} means "${second.english}".`,
  };
}

/**
 * De or het: the noun without its article (and its picture, if it has one),
 * options de and het. The same drill serves every stage, so an article item
 * climbs the stages by itself, apart from the noun's meaning.
 */
export function articleDrill(item: LearningItem, noun: LearningItem, stage: ExerciseStage, pictured: boolean): Exercise {
  const article = articleOf(noun.dutch) ?? 'de';
  return {
    id: 'gen-article',
    stage,
    items: [item.id],
    kind: 'choice',
    prompt: 'De or het?',
    noun: withoutArticle(noun.dutch),
    ...(pictured ? { picture: noun.id } : {}),
    options: ['de', 'het'],
    answer: article,
    explanation: `${noun.dutch} means "${noun.english}". It is a ${article}-word.`,
  };
}

/**
 * A correction of the learner's writing: the corrected sentence with the
 * changed words blanked, at every stage (the hint is what they wrote), and
 * dictation of the whole sentence at transfer.
 */
export function correctionDrill(item: LearningItem, correction: Correction, stage: ExerciseStage): Exercise {
  const explanation = correction.wrote ? `You wrote "${correction.wrote}"; the correction says "${correction.answers[0]}".` : `The correction adds "${correction.answers[0]}".`;
  if (stage === 'transfer') {
    return { id: 'gen-correction-dictation', stage, items: [item.id], kind: 'type', prompt: 'Listen and type what you hear.', audioText: correction.dutch, listenOnly: true, answers: [correction.dutch], explanation };
  }
  return {
    id: 'gen-correction',
    stage,
    items: [item.id],
    kind: 'cloze',
    prompt: 'Fill the gap the way it was corrected.',
    sentence: correction.sentence,
    answers: correction.answers,
    hint: correction.wrote ? `You first wrote "${correction.wrote}".` : 'You first left this out.',
    explanation,
  };
}

/**
 * A drill for one item at one stage. `variant` rotates between equivalent
 * forms (reading vs listening) so reviews do not always look the same.
 * Sound contrasts always get a pair drill: a random pair, a random word of it.
 * Article items always get "de or het?", and corrections their own fill-the-gap.
 *
 * Recall drills avoid the English where they can (Fluent Forever): the
 * learner's own note with the word blanked if it uses the word, else a
 * picture if the item has one, else the lesson's situation for its main
 * phrase, else a lesson example with the phrase blanked, else the English
 * meaning. A note that does not use the word is shown beside the cue.
 */
export function generateExercise(
  index: CurriculumIndex,
  item: LearningItem,
  stage: ExerciseStage,
  variant: number,
  random: () => number,
  context: DrillContext = {},
): Exercise {
  const contrast = index.contrast(item.id);
  if (contrast) return pairDrill(item, contrast, stage, Math.floor(random() * contrast.pairs.length), random() < 0.5 ? 0 : 1);
  const hasPicture = context.hasPicture ?? (() => false);
  const noun = isArticleItemId(item.id) ? index.item(nounIdOf(item.id)) : undefined;
  if (noun) return articleDrill(item, noun, stage, hasPicture(noun.id));
  const correction = index.correction(item.id);
  if (correction) return correctionDrill(item, correction, stage);
  const base = { id: `gen-${stage}-${variant % 2}`, stage, items: [item.id], explanation: explain(item) };
  const note = item.recognitionOnly ? undefined : context.noteFor?.(item.id);
  const mine = note ? personalGap(note, item.dutch) : undefined;
  if (mine && isRecallStage(stage)) {
    return { ...base, id: `gen-note-${stage}`, kind: 'cloze', prompt: 'Fill the gap in your note.', sentence: mine.sentence, answers: [mine.answer] };
  }
  const noteCue = note && !mine ? { note } : {};
  const pictured = !item.recognitionOnly && hasPicture(item.id);
  const lesson = index.lesson(item.lessonId);
  const situation = !pictured && item.primary ? lesson?.situation : undefined;
  const gap = !pictured && !item.primary && lesson ? exampleGap(lesson, item.dutch) : undefined;
  const cue = pictured ? { picture: item.id } : situation ? { situation } : {};
  const asked = pictured ? 'What is this in Dutch?' : situation ? 'What do you say?' : undefined;
  // Up to four pictures in a 2×2 grid (three at least), so each is big enough to read.
  const pictureChoice = (listen: boolean): Exercise | undefined => {
    if (!pictured) return undefined;
    const others = distractors(index, item, 'english', 3, random, (other) => hasPicture(other.id));
    if (others.length < 2) return undefined;
    const shown = shuffle([item, ...others], random);
    return {
      ...base,
      kind: 'choice',
      prompt: listen ? 'Listen. Which picture?' : `Which picture is "${item.dutch}"?`,
      audioText: item.dutch,
      listenOnly: listen || undefined,
      options: shown.map((option) => option.english),
      answer: item.english,
      optionPictures: Object.fromEntries(shown.map((option) => [option.english, option.id])),
    };
  };
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
  const gapAnswers = gap ? [gap.answer, ...answers] : answers;

  switch (stage) {
    case 'recognition':
      return pictureChoice(variant % 2 === 1) ?? meaningChoice(variant % 2 === 1);
    case 'supportedRecall': {
      if (item.recognitionOnly) return meaningChoice(true);
      if (gap) return { ...base, kind: 'cloze', prompt: 'Fill the gap.', sentence: gap.sentence, answers: gapAnswers, english: gap.english };
      const words = item.dutch.split(' ');
      if (words.length >= 3) {
        const extra = distractorTexts(index, item, 'dutch', 3, random)
          .flatMap((text) => text.split(' '))
          .filter((word) => !words.some((own) => normalizeAnswer(own) === normalizeAnswer(word)));
        return {
          ...base,
          ...cue,
          ...noteCue,
          kind: 'order',
          prompt: pictured ? 'Build the Dutch for this picture.' : situation ? 'Build what you would say.' : `Build the Dutch for "${item.english}".`,
          words,
          distractors: extra.slice(0, 1),
          english: item.english,
        };
      }
      return { ...base, ...cue, ...noteCue, kind: 'type', prompt: asked ?? `Type the Dutch for "${item.english}".`, answers, hint: letterHint(item.dutch) };
    }
    case 'independentRecall':
      if (item.recognitionOnly) return dutchChoice();
      if (gap) return { ...base, kind: 'cloze', prompt: 'Fill the gap.', sentence: gap.sentence, answers: gapAnswers };
      return { ...base, ...cue, ...noteCue, kind: 'type', prompt: asked ?? `How do you say "${item.english}" in Dutch?`, answers };
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
  context: DrillContext = {},
): PlannedExercise {
  const item = index.item(itemId);
  if (!item) throw new Error(`Unknown learning item ${itemId}`);
  const stage = exerciseStageFor(progress?.stage ?? 'introduced');
  const last = progress?.history.at(-1)?.exerciseId;
  // The learner's own note that uses the item beats a lesson's exercise at the recall stages.
  const note = item.recognitionOnly ? undefined : context.noteFor?.(itemId);
  const personal = isRecallStage(stage) && note !== undefined && personalGap(note, item.dutch) !== undefined;
  const authored = personal ? [] : authoredExercisesFor(index, itemId, mode).filter((entry) => entry.exercise.stage === stage);
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
  const exercise = generateExercise(index, item, stage, progress?.history.length ?? 0, random, context);
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

