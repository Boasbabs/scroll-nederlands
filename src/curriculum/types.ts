// Curriculum content model. Pure data: no React, no browser APIs.

export type CurriculumLevel = 'pre-a1' | 'a1' | 'a1-a2' | 'a2';

export type Skill = 'listening' | 'reading' | 'speaking' | 'writing';

/** Exercise difficulty, ordered from most to least supported. */
export type ExerciseStage = 'recognition' | 'supportedRecall' | 'independentRecall' | 'transfer';

export const EXERCISE_STAGES: ReadonlyArray<ExerciseStage> = [
  'recognition',
  'supportedRecall',
  'independentRecall',
  'transfer',
];

export type DutchEnglish = {
  dutch: string;
  english: string;
};

export type DialogueLine = {
  speaker: string;
  dutch: string;
  english: string;
};

/**
 * phrase: a reusable chunk ("Ik wil graag betalen.").
 * word: a single word worth recalling on its own ("de rekening").
 * pattern: a sentence frame with a slot ("Ik wil graag …").
 * sound: a spelling or sound pattern ("ui as in huis"); recognised, never typed from English.
 */
export type ItemKind = 'phrase' | 'word' | 'pattern' | 'sound';

/**
 * Something the learner should be able to remember. The review engine tracks
 * each item separately, so a lesson can teach a main phrase plus a few
 * related chunks without them sharing one schedule.
 */
export type LearningItemDraft = {
  /** Unique within its lesson, kebab-case, e.g. "goedemiddag". */
  key: string;
  /** The Dutch as the learner should recall it. */
  dutch: string;
  /** A short English meaning, usable as a recall prompt. */
  english: string;
  kind: ItemKind;
  /**
   * Other correct Dutch forms accepted when the learner types it. A noun that
   * takes de or het lists itself with the other article ("de aanrecht"), so
   * it gets no de/het item.
   */
  accept?: Array<string>;
  /** One short usage note shown after answering, e.g. "until about 12 o'clock". */
  note?: string;
  /**
   * Typing it from the English would be unfair (letters, sounds, grammar
   * labels), so it is only practised by recognition and listening.
   */
  recognitionOnly?: boolean;
  /** A noun in the plural ("de servicekosten"): plurals always take de, so it gets no de/het item. The course lists its own in COURSE_PLURALS. */
  plural?: boolean;
  /**
   * A noun whose bare form takes the other article in another sense (het cv,
   * the CV; de cv, central heating): the meaning its de/het drill shows, so
   * the question has one answer.
   */
  articleCue?: string;
  /** A sentence using it word for word, for a gapped drill where no lesson example has it (tier-2 basic words). */
  example?: DutchEnglish;
  /**
   * Words so close in meaning that one would be a second right answer
   * among the other's wrong options (by their Dutch, as written). Unlike
   * `accept`, they do not count as answers.
   */
  near?: Array<string>;
};

/** A learning item placed in the curriculum. */
export type LearningItem = LearningItemDraft & {
  /** Globally unique: `${lessonId}/${key}`. */
  id: string;
  lessonId: string;
  moduleId: string;
  stageId: string;
  /** The lesson's main item (its first). */
  primary: boolean;
};

type ExerciseBase = {
  /** Unique within its lesson, e.g. "rec", "listen", "type", "transfer". */
  id: string;
  stage: ExerciseStage;
  /** Instruction or question shown to the learner, in English (may quote Dutch). */
  prompt: string;
  /** Shown after answering, whether right or wrong. */
  explanation: string;
  /**
   * The learning items this exercise practises: item keys of this lesson, or
   * full item ids ("lesson-id/key") of earlier lessons. Defaults to the
   * lesson's main item.
   */
  items?: Array<string>;
  /** Dutch text played as audio before answering. */
  audioText?: string;
  /** The audio is the only source: the Dutch text stays hidden until after answering. */
  listenOnly?: boolean;
  /** Dutch text the learner reads before answering (a notice, message or timetable). */
  passage?: string;
  /** A conversation shown before the question; the learner supplies or picks the next line. */
  context?: Array<DialogueLine>;
  /** Too long for a browsing break; only offered in focused practice. */
  focusedOnly?: boolean;
  /** Checkpoints only: the earlier lesson this exercise assesses. */
  testsLesson?: string;
  /** Generated recall drills: the scene to answer from, in place of the English meaning. De/het drills: which sense of the noun is meant. */
  situation?: string;
  /** Generated drills: the item whose picture is the cue (the learner's own, else a bundled one). */
  picture?: string;
  /** Generated recall drills: the learner's own line about the item, shown as a cue. */
  note?: string;
};

/** Pick one option. `answer` must be one of `options`. */
export type ChoiceExercise = ExerciseBase & {
  kind: 'choice';
  options: Array<string>;
  answer: string;
  /** Picture options: the item whose picture stands for each option; the text shows after answering. */
  optionPictures?: Record<string, string>;
  /**
   * Article drills: the noun without its article ("mes"), shown as the
   * question with no audio, since hearing it would give the article away.
   * The options keep their order (de, then het).
   */
  noun?: string;
};

/** Match each Dutch phrase with its English meaning. */
export type MatchExercise = ExerciseBase & {
  kind: 'match';
  pairs: Array<DutchEnglish>;
};

/** Fill the gap marked "___" in `sentence`. Any entry of `answers` is accepted. */
export type ClozeExercise = ExerciseBase & {
  kind: 'cloze';
  sentence: string;
  answers: Array<string>;
  /** English meaning of the full sentence. */
  english?: string;
  hint?: string;
  /** Spelling is the point: no typo tolerance. */
  strict?: boolean;
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
  /** Spelling is the point: no typo tolerance. */
  strict?: boolean;
};

/**
 * Short free writing, checked leniently: every group in `mustInclude` needs at
 * least one of its words, and the text needs `minWords` words.
 */
export type WriteExercise = ExerciseBase & {
  kind: 'write';
  mustInclude: Array<Array<string>>;
  minWords: number;
  modelAnswer: string;
};

export type Exercise =
  | ChoiceExercise
  | MatchExercise
  | ClozeExercise
  | OrderExercise
  | TypeExercise
  | WriteExercise;

export type ExerciseKind = Exercise['kind'];

/**
 * core: introduces one new phrase, pattern or concept.
 * practice: recombines earlier lessons in a new situation (planned reinforcement).
 * checkpoint: cumulative, scored assessment at the end of a module or stage.
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
  /**
   * What the learner should remember, main item first. Core lessons teach at
   * least one; practice lessons may add a few; checkpoints add none.
   */
  items: Array<LearningItemDraft>;
  wordBreakdown?: Array<DutchEnglish>;
  /** Short grammar or usage note: only what is needed to reuse this pattern. */
  patternExplanation?: string;
  /** How to say it, in plain English comparisons. */
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
   * checkpoint: 5+ exercises mixing skills, scored together.
   */
  exercises: Array<Exercise>;
};

/** A lesson placed in the curriculum (module and stage filled in on assembly). */
export type Lesson = Omit<LessonDraft, 'items'> & {
  moduleId: string;
  stageId: string;
  level: CurriculumLevel;
  /** Position in teaching order across the whole course; for a pack scene, its place in its pack. */
  order: number;
  items: Array<LearningItem>;
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
