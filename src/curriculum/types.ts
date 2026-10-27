// Curriculum content model. Pure data: no React, no browser APIs.

export type CurriculumLevel = 'pre-a1' | 'a1' | 'a1-a2' | 'a2';

export type Skill = 'listening' | 'reading' | 'speaking' | 'writing';

/**
 * The four exercise stages, ordered from most to least supported.
 * A learning item moves through them as the learner demonstrates recall.
 */
export type ExerciseStage =
  | 'recognition'
  | 'supportedRecall'
  | 'independentRecall'
  | 'transfer';

export type DutchEnglish = {
  dutch: string;
  english: string;
};

export type DialogueLine = {
  speaker: string;
  dutch: string;
  english: string;
};

type ExerciseBase = {
  /** Unique within its lesson, e.g. "rec", "cloze", "type", "transfer". */
  id: string;
  stage: ExerciseStage;
  /** Instruction or question shown to the learner, in English (may quote Dutch). */
  prompt: string;
  /** Dutch text played as audio before answering (listening tasks). */
  audioText?: string;
  /**
   * When true the audioText is the only way to get the content (the text is
   * hidden until after answering). Use for genuine listening comprehension.
   */
  listenOnly?: boolean;
  /** Dutch text the learner reads before answering (notice, message, dialogue). */
  passage?: string;
  /** Shown after answering, whether right or wrong. */
  explanation: string;
  /** Too long for a browsing break; only offered in focused practice. */
  focusedOnly?: boolean;
  /**
   * Checkpoints only: the earlier lesson this exercise assesses. A wrong
   * answer sends that lesson back into review.
   */
  testsLesson?: string;
};

/** Pick one option. `answer` must be one of `options`. */
export type ChoiceExercise = ExerciseBase & {
  kind: 'choice';
  options: Array<string>;
  answer: string;
};

/** Fill the gap marked "___" in `sentence`. Any entry of `answers` is accepted. */
export type ClozeExercise = ExerciseBase & {
  kind: 'cloze';
  sentence: string;
  answers: Array<string>;
  /** English meaning of the full sentence. */
  english?: string;
  hint?: string;
};

/** Arrange word tiles into a sentence. `words` is the correct order. */
export type OrderExercise = ExerciseBase & {
  kind: 'order';
  words: Array<string>;
  /** Extra tiles that do not belong in the answer. */
  distractors?: Array<string>;
  /** Other complete word orders that are also correct. */
  alternatives?: Array<Array<string>>;
  english: string;
};

/** Type a Dutch answer. Any entry of `answers` is accepted; the first is the model answer. */
export type TypeExercise = ExerciseBase & {
  kind: 'type';
  answers: Array<string>;
  hint?: string;
};

/**
 * Short free writing. Checked leniently: every group in `mustInclude` needs
 * at least one of its words, and the text needs `minWords` words.
 */
export type WriteExercise = ExerciseBase & {
  kind: 'write';
  mustInclude: Array<Array<string>>;
  minWords: number;
  modelAnswer: string;
};

export type Exercise =
  | ChoiceExercise
  | ClozeExercise
  | OrderExercise
  | TypeExercise
  | WriteExercise;

export type ExerciseKind = Exercise['kind'];

/**
 * core: introduces one new phrase, pattern or concept.
 * practice: recombines earlier lessons in a new situation (planned reinforcement).
 * checkpoint: cumulative assessment at the end of a module or stage.
 */
export type LessonKind = 'core' | 'practice' | 'checkpoint';

/** A lesson as authored in a module content file. */
export type LessonDraft = {
  /** Globally unique, kebab-case, e.g. "s0-greet-hello". */
  id: string;
  kind: LessonKind;
  title: string;
  /** Communicative objective: what the learner can do afterwards. */
  objective: string;
  /** A real-life situation in the Netherlands where this is used. */
  situation: string;
  /** The main Dutch phrase, sentence or pattern. */
  targetPhrase: string;
  meaningEn: string;
  wordBreakdown?: Array<DutchEnglish>;
  /** Short grammar or usage note. Only what is needed for this pattern. */
  patternExplanation?: string;
  /** How to say it, in plain English comparisons (no IPA-only notes). */
  pronunciationTip?: string;
  examples?: Array<DutchEnglish>;
  dialogue?: Array<DialogueLine>;
  /** A say-it-aloud instruction. Speaking is learner-led, not assessed. */
  speakingPrompt?: string;
  /** Lesson ids that must be completed first (beyond curriculum order). */
  prerequisites?: Array<string>;
  /** Earlier lesson ids this lesson deliberately revisits. */
  revisits?: Array<string>;
  skills: Array<Skill>;
  /** Required-objective tags this lesson teaches (see objectives.ts). */
  covers: Array<string>;
  /**
   * core/practice: at least one exercise per stage, in stage order.
   * checkpoint: 5+ exercises mixing skills; all are scored together.
   */
  exercises: Array<Exercise>;
};

/** A lesson placed in the curriculum (module and stage filled in on assembly). */
export type Lesson = LessonDraft & {
  moduleId: string;
  stageId: string;
  level: CurriculumLevel;
};

export type CurriculumModule = {
  id: string;
  stageId: string;
  title: string;
  description: string;
  lessons: Array<Lesson>;
};

export type CurriculumStage = {
  id: string;
  level: CurriculumLevel;
  title: string;
  objective: string;
  modules: Array<CurriculumModule>;
};

export type Curriculum = {
  stages: Array<CurriculumStage>;
};
