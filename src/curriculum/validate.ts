// Curriculum validation: structure, references, answers and coverage.
// Used by tests/curriculum and by `pnpm validate:curriculum`.
import { checkWriting, normalizeAnswer } from '../engine/answers';
import { exerciseItemIds, indexCurriculum } from './assemble';
import { requiredObjectives } from './objectives';
import { EXERCISE_STAGES, type Curriculum, type Exercise, type Lesson } from './types';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEVEL_ORDER = ['pre-a1', 'a1', 'a1-a2', 'a2'];

function blank(text: string | undefined): boolean {
  return !text || text.trim().length === 0;
}

/** Same tiles in any order; capitals and punctuation may move with the word order. */
function sameWords(a: ReadonlyArray<string>, b: ReadonlyArray<string>): boolean {
  const key = (words: ReadonlyArray<string>) => words.map(normalizeAnswer).sort().join('\u0000');
  return key(a) === key(b);
}

/** The prompt offers the answer as one side of a choice, e.g. "Complete with niet or geen." */
function offersChoice(text: string, answer: string): boolean {
  const needle = normalizeAnswer(answer);
  const pattern = /(\S+) or (\S+)/g;
  for (const match of normalizeAnswer(text).matchAll(pattern)) {
    if (match[1] === needle || match[2] === needle) return true;
  }
  return false;
}

/**
 * True when the whole answer (two or more words, or a word of 8+ letters)
 * already appears in `text`, so the learner could copy it instead of recalling it.
 */
function leaks(text: string, answer: string): boolean {
  const needle = normalizeAnswer(answer);
  if (needle.split(' ').length < 2 && needle.length < 8) return false;
  if (offersChoice(text, answer)) return false;
  return ` ${normalizeAnswer(text)} `.includes(` ${needle} `);
}

function exerciseIssues(lesson: Lesson, exercise: Exercise): Array<string> {
  const issues: Array<string> = [];
  if (blank(exercise.prompt)) issues.push('empty prompt');
  if (blank(exercise.explanation)) issues.push('empty explanation');
  if (!EXERCISE_STAGES.includes(exercise.stage)) issues.push(`unknown stage ${exercise.stage}`);
  if (exercise.listenOnly && blank(exercise.audioText)) issues.push('listenOnly without audioText');
  if (exercise.listenOnly && exercise.audioText && leaks(exercise.prompt, exercise.audioText)) {
    issues.push('prompt reveals the listening text');
  }
  if (exercise.context?.some((line) => blank(line.dutch) || blank(line.english) || blank(line.speaker))) {
    issues.push('context line with an empty field');
  }
  const recall = exercise.stage !== 'recognition';

  switch (exercise.kind) {
    case 'choice': {
      if (exercise.options.length < 2 || exercise.options.length > 5) issues.push('choice needs 2 to 5 options');
      if (!exercise.options.includes(exercise.answer)) issues.push('answer is not one of the options');
      const unique = new Set(exercise.options.map(normalizeAnswer));
      if (unique.size !== exercise.options.length) issues.push('duplicate options');
      break;
    }
    case 'match': {
      if (exercise.pairs.length < 3 || exercise.pairs.length > 5) issues.push('match needs 3 to 5 pairs');
      if (new Set(exercise.pairs.map((pair) => normalizeAnswer(pair.dutch))).size !== exercise.pairs.length) {
        issues.push('duplicate Dutch in match pairs');
      }
      if (new Set(exercise.pairs.map((pair) => normalizeAnswer(pair.english))).size !== exercise.pairs.length) {
        issues.push('duplicate English in match pairs');
      }
      break;
    }
    case 'cloze': {
      if (exercise.sentence.split('___').length !== 2) issues.push('cloze sentence needs exactly one ___');
      if (exercise.answers.length === 0 || exercise.answers.some(blank)) issues.push('cloze needs answers');
      if (recall && exercise.answers.some((answer) => leaks(`${exercise.prompt} ${exercise.sentence}`, answer))) {
        issues.push('cloze prompt or sentence reveals the answer');
      }
      break;
    }
    case 'order': {
      if (exercise.words.length < 2) issues.push('order needs at least 2 words');
      for (const alternative of exercise.alternatives ?? []) {
        if (!sameWords(alternative, exercise.words)) issues.push('order alternative uses different tiles');
      }
      if (exercise.distractors?.some((word) => exercise.words.includes(word))) {
        issues.push('order distractor is also an answer tile');
      }
      if (blank(exercise.english)) issues.push('order needs an English meaning');
      break;
    }
    case 'type': {
      if (exercise.answers.length === 0 || exercise.answers.some(blank)) issues.push('type needs answers');
      if (recall && exercise.answers.some((answer) => leaks(exercise.prompt, answer))) {
        issues.push('prompt reveals the answer');
      }
      break;
    }
    case 'write': {
      if (exercise.mustInclude.length === 0 || exercise.mustInclude.some((group) => group.length === 0)) {
        issues.push('write needs mustInclude groups');
      }
      if (exercise.minWords < 1) issues.push('write needs minWords');
      const self = checkWriting(exercise.modelAnswer, exercise.mustInclude, exercise.minWords, exercise.modelAnswer);
      if (!self.correct) issues.push(`model answer fails its own check (${self.note})`);
      break;
    }
  }
  return issues.map((issue) => `${lesson.id}/${exercise.id}: ${issue}`);
}

/** Every problem found, as "location: message". An empty list means the curriculum is valid. */
export function validateCurriculum(source: Curriculum): Array<string> {
  const issues: Array<string> = [];
  const index = indexCurriculum(source);
  const seenLessons = new Map<string, Lesson>();
  const seenModules = new Set<string>();
  const dutchTaughtBy = new Map<string, string>();
  const knownTags = new Set(Object.values(requiredObjectives).flatMap((tags) => Object.keys(tags)));

  let previousLevel = -1;
  for (const stage of source.stages) {
    const level = LEVEL_ORDER.indexOf(stage.level);
    if (level < previousLevel) issues.push(`${stage.id}: level ${stage.level} is out of order`);
    previousLevel = level;
    if (!stage.modules.some((module) => module.lessons.some((lesson) => lesson.kind === 'checkpoint'))) {
      issues.push(`${stage.id}: stage has no checkpoint`);
    }

    for (const module of stage.modules) {
      if (seenModules.has(module.id)) issues.push(`${module.id}: duplicate module id`);
      seenModules.add(module.id);
      if (module.lessons.length === 0) issues.push(`${module.id}: module has no lessons`);

      for (const lesson of module.lessons) {
        const at = lesson.id;
        if (seenLessons.has(lesson.id)) issues.push(`${at}: duplicate lesson id`);
        if (!KEBAB.test(lesson.id) || !lesson.id.startsWith(`${module.id}-`)) {
          issues.push(`${at}: id must be kebab-case and start with ${module.id}-`);
        }
        for (const field of ['title', 'objective', 'situation', 'targetPhrase', 'meaningEn'] as const) {
          if (blank(lesson[field])) issues.push(`${at}: empty ${field}`);
        }
        if (lesson.skills.length === 0) issues.push(`${at}: no skills`);
        if (lesson.kind === 'core' && lesson.covers.length === 0) issues.push(`${at}: core lesson covers no objective`);
        for (const tag of lesson.covers) {
          if (!knownTags.has(tag)) issues.push(`${at}: unknown objective tag ${tag}`);
        }
        for (const ref of [...(lesson.prerequisites ?? []), ...(lesson.revisits ?? [])]) {
          if (!seenLessons.has(ref)) issues.push(`${at}: prerequisite/revisit ${ref} is not an earlier lesson`);
        }

        // Learning items.
        if (lesson.kind === 'core' && lesson.items.length === 0) issues.push(`${at}: core lesson teaches no items`);
        if (lesson.kind === 'checkpoint' && lesson.items.length > 0) issues.push(`${at}: checkpoints teach no items`);
        const keys = new Set<string>();
        for (const item of lesson.items) {
          if (!KEBAB.test(item.key)) issues.push(`${at}: item key ${item.key} is not kebab-case`);
          if (keys.has(item.key)) issues.push(`${at}: duplicate item key ${item.key}`);
          keys.add(item.key);
          if (blank(item.dutch) || blank(item.english)) issues.push(`${item.id}: item needs Dutch and English`);
          if (item.accept?.some(blank)) issues.push(`${item.id}: empty accepted answer`);
          const dutch = normalizeAnswer(item.dutch);
          const earlier = dutchTaughtBy.get(dutch);
          if (earlier) issues.push(`${item.id}: "${item.dutch}" is already taught by ${earlier}`);
          else dutchTaughtBy.set(dutch, item.id);
        }

        // Exercises.
        const exerciseIds = new Set<string>();
        let lastStage = 0;
        for (const exercise of lesson.exercises) {
          if (exerciseIds.has(exercise.id)) issues.push(`${at}/${exercise.id}: duplicate exercise id`);
          exerciseIds.add(exercise.id);
          issues.push(...exerciseIssues(lesson, exercise));

          const itemIds = exerciseItemIds(lesson, exercise);
          if (itemIds.length === 0) issues.push(`${at}/${exercise.id}: practises no learning item`);
          for (const itemId of itemIds) {
            const item = index.item(itemId);
            const owner = item ? index.lesson(item.lessonId) : undefined;
            if (!item || !owner || owner.order > lesson.order) {
              issues.push(`${at}/${exercise.id}: item ${itemId} is not taught by this or an earlier lesson`);
            }
          }

          if (lesson.kind === 'checkpoint') {
            if (!exercise.testsLesson || !seenLessons.has(exercise.testsLesson)) {
              issues.push(`${at}/${exercise.id}: checkpoint exercise must test an earlier lesson`);
            }
          } else {
            const stageIndex = EXERCISE_STAGES.indexOf(exercise.stage);
            if (stageIndex < lastStage) issues.push(`${at}/${exercise.id}: exercises are not in stage order`);
            lastStage = Math.max(lastStage, stageIndex);
          }
        }
        if (lesson.kind === 'checkpoint') {
          if (lesson.exercises.length < 5) issues.push(`${at}: checkpoint needs at least 5 exercises`);
        } else {
          for (const stageName of EXERCISE_STAGES) {
            if (!lesson.exercises.some((exercise) => exercise.stage === stageName)) {
              issues.push(`${at}: no ${stageName} exercise`);
            }
          }
          if (!lesson.exercises.some((exercise) => !exercise.focusedOnly)) {
            issues.push(`${at}: needs at least one exercise that fits a browsing break`);
          }
        }
        seenLessons.set(lesson.id, lesson);
      }
    }

    // Coverage of the stage's required objectives.
    const stageTags = new Set(stage.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.covers)));
    for (const [tag, description] of Object.entries(requiredObjectives[stage.id] ?? {})) {
      if (!stageTags.has(tag)) issues.push(`${stage.id}: objective "${description}" (${tag}) has no lesson`);
    }
  }
  return issues;
}

export type CurriculumStats = {
  stages: number;
  modules: number;
  lessons: Record<'core' | 'practice' | 'checkpoint', number>;
  items: number;
  exercises: number;
  exercisesByKind: Record<string, number>;
  listening: number;
  reading: number;
};

export function curriculumStats(source: Curriculum): CurriculumStats {
  const index = indexCurriculum(source);
  const exercises = index.lessons.flatMap((lesson) => lesson.exercises);
  const exercisesByKind: Record<string, number> = {};
  for (const exercise of exercises) exercisesByKind[exercise.kind] = (exercisesByKind[exercise.kind] ?? 0) + 1;
  return {
    stages: source.stages.length,
    modules: source.stages.reduce((sum, stage) => sum + stage.modules.length, 0),
    lessons: {
      core: index.lessons.filter((lesson) => lesson.kind === 'core').length,
      practice: index.lessons.filter((lesson) => lesson.kind === 'practice').length,
      checkpoint: index.lessons.filter((lesson) => lesson.kind === 'checkpoint').length,
    },
    items: index.items.length,
    exercises: exercises.length,
    exercisesByKind,
    listening: exercises.filter((exercise) => exercise.audioText).length,
    reading: exercises.filter((exercise) => exercise.passage).length,
  };
}
