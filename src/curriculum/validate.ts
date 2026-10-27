import { countWords, missingWriteGroups, normalizeAnswer } from '../engine/answers';
import { allObjectiveTags, requiredObjectives } from './objectives';
import type { Curriculum, Exercise, ExerciseStage, Lesson } from './types';
import { flattenLessons } from './index';

export const STAGE_ORDER: Array<ExerciseStage> = [
  'recognition',
  'supportedRecall',
  'independentRecall',
  'transfer',
];

const SKILLS = new Set(['listening', 'reading', 'speaking', 'writing']);
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type ValidateOptions = {
  /** Only report lesson-level problems for these modules (used while authoring). */
  modules?: Array<string>;
  /** Check that every planned module has content and every objective is covered. */
  requireComplete?: boolean;
};

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

function validateExercise(
  lesson: Lesson,
  exercise: Exercise,
  earlierIds: Set<string>,
  isPendingRef: (id: string) => boolean,
): Array<string> {
  const errors: Array<string> = [];
  const where = `${lesson.id}/${exercise.id}`;

  if (!STAGE_ORDER.includes(exercise.stage)) errors.push(`${where}: unknown stage "${exercise.stage}"`);
  if (isBlank(exercise.prompt)) errors.push(`${where}: empty prompt`);
  if (isBlank(exercise.explanation)) errors.push(`${where}: empty explanation`);
  if (exercise.listenOnly && isBlank(exercise.audioText)) errors.push(`${where}: listenOnly without audioText`);
  if (lesson.kind === 'checkpoint') {
    if (!exercise.testsLesson) errors.push(`${where}: checkpoint exercise needs testsLesson`);
    else if (!earlierIds.has(exercise.testsLesson) && !isPendingRef(exercise.testsLesson)) {
      errors.push(`${where}: testsLesson "${exercise.testsLesson}" is not an earlier lesson`);
    }
  }

  const prompt = normalizeAnswer(exercise.prompt);

  switch (exercise.kind) {
    case 'choice': {
      if (exercise.options.length < 2 || exercise.options.length > 5) errors.push(`${where}: needs 2-5 options`);
      if (new Set(exercise.options).size !== exercise.options.length) errors.push(`${where}: duplicate options`);
      if (!exercise.options.includes(exercise.answer)) errors.push(`${where}: answer is not one of the options`);
      break;
    }
    case 'cloze': {
      const gaps = exercise.sentence.split('___').length - 1;
      if (gaps !== 1) errors.push(`${where}: cloze sentence needs exactly one ___ (found ${gaps})`);
      if (exercise.answers.length === 0 || exercise.answers.some(isBlank)) errors.push(`${where}: cloze needs answers`);
      break;
    }
    case 'order': {
      if (exercise.words.length < 2) errors.push(`${where}: order needs at least 2 words`);
      // Alternatives may differ in capitals and punctuation, but must use the same words.
      const tileSet = (words: Array<string>) => words.map(normalizeAnswer).sort().join('|');
      const sorted = tileSet(exercise.words);
      for (const alternative of exercise.alternatives ?? []) {
        if (tileSet(alternative) !== sorted) errors.push(`${where}: alternative uses different tiles`);
      }
      if (isBlank(exercise.english)) errors.push(`${where}: order needs english`);
      break;
    }
    case 'type': {
      if (exercise.answers.length === 0 || exercise.answers.some(isBlank)) {
        errors.push(`${where}: type needs answers`);
        break;
      }
      const model = normalizeAnswer(exercise.answers[0]!);
      if (model.length > 3 && prompt.includes(model)) errors.push(`${where}: prompt reveals the answer`);
      if (exercise.audioText && normalizeAnswer(exercise.audioText) === model && !exercise.listenOnly) {
        errors.push(`${where}: dictation (audioText = answer) must be listenOnly`);
      }
      break;
    }
    case 'write': {
      if (exercise.mustInclude.length === 0) errors.push(`${where}: write needs mustInclude groups`);
      if (missingWriteGroups(exercise.modelAnswer, exercise.mustInclude).length > 0) {
        errors.push(`${where}: modelAnswer does not satisfy mustInclude`);
      }
      if (countWords(exercise.modelAnswer) < exercise.minWords) errors.push(`${where}: modelAnswer shorter than minWords`);
      break;
    }
    default:
      errors.push(`${where}: unknown exercise kind`);
  }
  return errors;
}

function validateLesson(
  lesson: Lesson,
  earlierIds: Set<string>,
  knownTags: Set<string>,
  isPendingRef: (id: string) => boolean,
): Array<string> {
  const errors: Array<string> = [];
  const where = lesson.id;

  if (!ID_PATTERN.test(lesson.id)) errors.push(`${where}: id must be kebab-case`);
  if (!lesson.id.startsWith(`${lesson.moduleId}-`)) errors.push(`${where}: id must start with "${lesson.moduleId}-"`);
  for (const field of ['title', 'objective', 'situation', 'targetPhrase', 'meaningEn'] as const) {
    if (isBlank(lesson[field])) errors.push(`${where}: missing ${field}`);
  }
  if (!['core', 'practice', 'checkpoint'].includes(lesson.kind)) errors.push(`${where}: unknown kind`);
  if (lesson.skills.length === 0 || lesson.skills.some((skill) => !SKILLS.has(skill))) {
    errors.push(`${where}: skills must be a non-empty list of listening/reading/speaking/writing`);
  }
  if (lesson.covers.length === 0) errors.push(`${where}: covers must list at least one objective tag`);
  for (const tag of lesson.covers) {
    if (!knownTags.has(tag)) errors.push(`${where}: unknown objective tag "${tag}"`);
  }
  for (const entry of [...(lesson.examples ?? []), ...(lesson.wordBreakdown ?? []), ...(lesson.dialogue ?? [])]) {
    if (isBlank(entry.dutch) || isBlank(entry.english)) errors.push(`${where}: example, breakdown or dialogue line with empty text`);
  }
  for (const ref of [...(lesson.prerequisites ?? []), ...(lesson.revisits ?? [])]) {
    if (!earlierIds.has(ref) && !isPendingRef(ref)) errors.push(`${where}: references "${ref}", which is not an earlier lesson`);
  }

  const exerciseIds = new Set<string>();
  for (const exercise of lesson.exercises) {
    if (exerciseIds.has(exercise.id)) errors.push(`${where}: duplicate exercise id "${exercise.id}"`);
    exerciseIds.add(exercise.id);
    errors.push(...validateExercise(lesson, exercise, earlierIds, isPendingRef));
  }

  if (lesson.kind === 'checkpoint') {
    if (lesson.exercises.length < 5) errors.push(`${where}: checkpoint needs at least 5 exercises`);
    if ((lesson.revisits ?? []).length < 3) errors.push(`${where}: checkpoint must revisit at least 3 lessons`);
    if (new Set(lesson.skills).size < 2) errors.push(`${where}: checkpoint must mix at least 2 skills`);
  } else {
    const stages = lesson.exercises.map((exercise) => exercise.stage);
    for (const stage of STAGE_ORDER) {
      if (!stages.includes(stage)) errors.push(`${where}: missing a ${stage} exercise`);
    }
    const ranks = stages.map((stage) => STAGE_ORDER.indexOf(stage));
    if (ranks.some((rank, i) => i > 0 && rank < ranks[i - 1]!)) errors.push(`${where}: exercises must be in stage order`);
    const first = lesson.exercises[0];
    if (first && (first.stage !== 'recognition' || first.focusedOnly)) {
      errors.push(`${where}: first exercise must be a recognition exercise usable in micro mode`);
    }
    if (lesson.kind === 'practice' && (lesson.revisits ?? []).length === 0) {
      errors.push(`${where}: practice lessons must list the lessons they revisit`);
    }
  }
  return errors;
}

export function validateCurriculum(source: Curriculum, options: ValidateOptions = {}): Array<string> {
  const errors: Array<string> = [];
  const knownTags = allObjectiveTags();
  const earlierIds = new Set<string>();
  const seenPhrases = new Map<string, string>();
  const inScope = (moduleId: string) => !options.modules || options.modules.includes(moduleId);
  // While authoring a subset, references into modules that have no content yet are not errors.
  const emptyModuleIds = source.stages
    .flatMap((stage) => stage.modules)
    .filter((module) => module.lessons.length === 0)
    .map((module) => module.id);
  const isPendingRef = (id: string) =>
    !options.requireComplete && emptyModuleIds.some((moduleId) => id.startsWith(`${moduleId}-`));

  for (const lesson of flattenLessons(source)) {
    if (earlierIds.has(lesson.id)) errors.push(`${lesson.id}: duplicate lesson id`);
    if (inScope(lesson.moduleId)) {
      errors.push(...validateLesson(lesson, earlierIds, knownTags, isPendingRef));
      if (lesson.kind === 'core') {
        const phrase = normalizeAnswer(lesson.targetPhrase);
        const owner = seenPhrases.get(phrase);
        if (owner) errors.push(`${lesson.id}: same targetPhrase as ${owner}`);
        seenPhrases.set(phrase, lesson.id);
      }
    }
    earlierIds.add(lesson.id);
  }

  for (const stage of source.stages) {
    for (const module of stage.modules) {
      if (!inScope(module.id)) continue;
      const hasContent = module.lessons.length > 0;
      if (!hasContent && !options.requireComplete) continue;
      if (module.lessons.length < 2) errors.push(`${module.id}: module needs at least 2 lessons`);
      const coreCount = module.lessons.filter((lesson) => lesson.kind === 'core').length;
      if (coreCount >= 4 && !module.lessons.some((lesson) => lesson.kind !== 'core')) {
        errors.push(`${module.id}: module with ${coreCount} core lessons needs a practice or checkpoint lesson`);
      }
    }

    if (options.requireComplete) {
      const stageLessons = stage.modules.flatMap((module) => module.lessons);
      if (!stageLessons.some((lesson) => lesson.kind === 'checkpoint')) errors.push(`${stage.id}: stage has no checkpoint`);
      const covered = new Set(stageLessons.filter((lesson) => lesson.kind !== 'checkpoint').flatMap((lesson) => lesson.covers));
      for (const tag of Object.keys(requiredObjectives[stage.id] ?? {})) {
        if (!covered.has(tag)) errors.push(`${stage.id}: objective "${tag}" is not covered by any lesson`);
      }
    }
  }
  return errors;
}
