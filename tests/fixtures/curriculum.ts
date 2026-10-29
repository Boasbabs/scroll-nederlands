import { assembleCurriculum, indexCurriculum, type CurriculumIndex } from '../../src/curriculum/assemble';
import type { StagePlan } from '../../src/curriculum/structure';
import type { Curriculum, Exercise, LessonDraft } from '../../src/curriculum/types';
import type { Pack } from '../../src/packs/types';
import type { SoundContrast } from '../../src/sounds/types';
import type { WordTheme } from '../../src/words/types';

/** Four exercises, one per stage, all practising the lesson's main item. */
export function stageExercises(dutch: string, english: string): Array<Exercise> {
  return [
    {
      id: 'rec',
      stage: 'recognition',
      kind: 'choice',
      prompt: `What does "${dutch}" mean?`,
      options: [english, 'Something else', 'Another thing'],
      answer: english,
      explanation: `${dutch} means ${english}.`,
    },
    {
      id: 'order',
      stage: 'supportedRecall',
      kind: 'order',
      prompt: 'Put the words in order.',
      words: dutch.split(' '),
      english,
      explanation: `${dutch}.`,
    },
    {
      id: 'type',
      stage: 'independentRecall',
      kind: 'type',
      prompt: `Say: ${english}`,
      answers: [dutch],
      explanation: `${dutch}.`,
    },
    {
      id: 'transfer',
      stage: 'transfer',
      kind: 'type',
      prompt: `A new situation that needs: ${english}`,
      answers: [dutch],
      explanation: `${dutch}.`,
    },
  ];
}

export function coreLesson(id: string, dutch: string, english: string, extra: Partial<LessonDraft> = {}): LessonDraft {
  const key = dutch.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  return {
    id,
    kind: 'core',
    title: english,
    objective: `Say ${english}.`,
    situation: 'Somewhere in the Netherlands.',
    targetPhrase: dutch,
    meaningEn: english,
    items: [{ key, dutch, english, kind: 'phrase' }],
    skills: ['reading'],
    covers: ['greetings'],
    exercises: stageExercises(dutch, english),
    ...extra,
  };
}

export function checkpointLesson(id: string, tests: Array<{ lessonId: string; itemId: string }>): LessonDraft {
  return {
    id,
    kind: 'checkpoint',
    title: 'Checkpoint',
    objective: 'Show what you remember.',
    situation: 'A short quiz.',
    targetPhrase: 'Toets',
    meaningEn: 'Test',
    items: [],
    skills: ['reading'],
    covers: [],
    exercises: Array.from({ length: 5 }, (_, i): Exercise => {
      const target = tests[i % tests.length]!;
      return {
        id: `q${i + 1}`,
        stage: 'independentRecall',
        kind: 'choice',
        prompt: `Question ${i + 1}`,
        options: ['A', 'B'],
        answer: 'A',
        explanation: 'A is right.',
        testsLesson: target.lessonId,
        items: [target.itemId],
      };
    }),
  };
}

/**
 * A small two-stage course: x0 (three core lessons and a checkpoint) then x1
 * (two core lessons and a checkpoint). Stage ids outside s0–s3 have no
 * required objectives, so coverage does not get in the way of unit tests.
 */
export function makeCourse(
  overrides: Record<string, Partial<LessonDraft>> = {},
  wordThemes: Array<WordTheme> = [],
  contrasts: Array<SoundContrast> = [],
  packs: Array<Pack> = [],
): CurriculumIndex {
  const drafts: Record<string, Array<LessonDraft>> = {
    'x0-a': [
      coreLesson('x0-a-hello', 'Hallo daar', 'Hello there'),
      coreLesson('x0-a-thanks', 'Dank je wel', 'Thank you'),
      coreLesson('x0-a-bye', 'Tot ziens', 'Goodbye'),
    ],
    'x0-check': [
      checkpointLesson('x0-check-one', [
        { lessonId: 'x0-a-hello', itemId: 'x0-a-hello/hallo-daar' },
        { lessonId: 'x0-a-thanks', itemId: 'x0-a-thanks/dank-je-wel' },
      ]),
    ],
    'x1-a': [
      coreLesson('x1-a-coffee', 'Ik wil koffie', 'I want coffee'),
      coreLesson('x1-a-pay', 'Ik wil betalen', 'I want to pay'),
    ],
    'x1-check': [
      checkpointLesson('x1-check-one', [{ lessonId: 'x1-a-coffee', itemId: 'x1-a-coffee/ik-wil-koffie' }]),
    ],
  };
  for (const lessons of Object.values(drafts)) {
    for (const [index, lesson] of lessons.entries()) {
      const override = overrides[lesson.id];
      if (override) lessons[index] = { ...lesson, ...override };
    }
  }
  const structure: Array<StagePlan> = [
    {
      id: 'x0',
      level: 'pre-a1',
      title: 'Stage X0',
      objective: 'Basics',
      modules: [
        { id: 'x0-a', title: 'Module A', description: 'First module' },
        { id: 'x0-check', title: 'Check', description: 'Checkpoint' },
      ],
    },
    {
      id: 'x1',
      level: 'a1',
      title: 'Stage X1',
      objective: 'More',
      modules: [
        { id: 'x1-a', title: 'Module B', description: 'Second module' },
        { id: 'x1-check', title: 'Check', description: 'Checkpoint' },
      ],
    },
  ];
  const curriculum: Curriculum = assembleCurriculum(structure, (_stage, moduleId) => drafts[moduleId] ?? []);
  return indexCurriculum(curriculum, wordThemes, contrasts, packs);
}

/**
 * A three-scene pack at the market, built on module x1-a. The first scene
 * teaches a noun and a plural; its recall exercise also practises a course
 * item by reference ("Ik wil betalen"), as pack scenes refer to what the course teaches.
 */
export const testPacks: Array<Pack> = [
  {
    id: 'markt',
    title: 'At the market',
    situation: 'Buying fruit at the Saturday market.',
    buildsOn: ['x1-a'],
    scenes: [
      coreLesson('sc-markt-kraam', 'Twee kilo appels', 'Two kilos of apples', {
        title: 'At the stall',
        items: [
          { key: 'twee-kilo-appels', dutch: 'Twee kilo appels', english: 'Two kilos of apples', kind: 'phrase' },
          { key: 'de-kraam', dutch: 'de kraam', english: 'the stall', kind: 'word' },
          { key: 'de-appels', dutch: 'de appels', english: 'the apples', kind: 'word', plural: true },
        ],
        exercises: stageExercises('Twee kilo appels', 'Two kilos of apples').map((exercise) =>
          exercise.id === 'type' ? { ...exercise, items: ['twee-kilo-appels', 'x1-a-pay/ik-wil-betalen'] } : exercise,
        ),
      }),
      coreLesson('sc-markt-prijs', 'Wat kost dat', 'What does that cost', { title: 'The price' }),
      coreLesson('sc-markt-tas', 'Heeft u een tas', 'Do you have a bag', { title: 'A bag' }),
    ],
    mission: 'Buy something at a market in Dutch.',
    cultureNote: 'Markets often take cards now.',
  },
];

/**
 * A set beside the pack: three short parts with no text, listening, writing or
 * mission, sharing the basic word "de vork" (w-kitchen/vork, in testWordThemes)
 * in its second part.
 */
export const testSet: Pack = {
  id: 'lijkt',
  kind: 'set',
  title: 'Look-alikes',
  situation: 'Dutch words that look English.',
  buildsOn: [],
  shared: ['w-kitchen/vork'],
  scenes: [
    coreLesson('sc-lijkt-raar', 'Wat raar', 'How strange', {
      title: 'Odd ones',
      items: [
        { key: 'wat-raar', dutch: 'Wat raar', english: 'How strange', kind: 'phrase' },
        { key: 'raar', dutch: 'raar', english: 'strange', kind: 'word', note: 'not "rare": that is zeldzaam' },
      ],
    }),
    coreLesson('sc-lijkt-vork', 'Een vork graag', 'A fork please', {
      title: 'At the table',
      exercises: stageExercises('Een vork graag', 'A fork please').map((exercise) => (exercise.id === 'rec' ? { ...exercise, items: ['een-vork-graag', 'w-kitchen/vork'] } : exercise)),
    }),
    coreLesson('sc-lijkt-eng', 'Wat eng', 'How scary', { title: 'Scary ones' }),
  ],
};

/**
 * Two small basic-word themes. "Dank je wel" refers to a course item, so it
 * counts as a basic word without becoming a second item.
 */
export const testWordThemes: Array<WordTheme> = [
  {
    id: 'kitchen',
    title: 'Kitchen',
    words: [
      { key: 'vork', dutch: 'de vork', english: 'the fork', pos: 'noun' },
      { key: 'mes', dutch: 'het mes', english: 'the knife', pos: 'noun' },
      { key: 'lepel', dutch: 'de lepel', english: 'the spoon', pos: 'noun' },
      { key: 'glas', dutch: 'het glas', english: 'the glass', pos: 'noun' },
    ],
  },
  {
    id: 'animals',
    title: 'Animals',
    words: [
      { key: 'hond', dutch: 'de hond', english: 'the dog', pos: 'noun' },
      { ref: 'Dank je wel' },
      { key: 'kat', dutch: 'de kat', english: 'the cat', pos: 'noun' },
    ],
  },
];

/** Two sound contrasts for ear training, three pairs each. */
export const testContrasts: Array<SoundContrast> = [
  {
    id: 'a-aa',
    sounds: ['a', 'aa'],
    tip: 'Short a is clipped; long aa is held.',
    pairs: [
      [{ dutch: 'man', english: 'man' }, { dutch: 'maan', english: 'moon' }],
      [{ dutch: 'zak', english: 'bag' }, { dutch: 'zaak', english: 'shop' }],
      [{ dutch: 'tak', english: 'branch' }, { dutch: 'taak', english: 'task' }],
    ],
  },
  {
    id: 'g-h',
    sounds: ['g', 'h'],
    tip: 'G is rough; h is breath.',
    pairs: [
      [{ dutch: 'goed', english: 'good' }, { dutch: 'hoed', english: 'hat' }],
      [{ dutch: 'geel', english: 'yellow' }, { dutch: 'heel', english: 'whole' }],
      [{ dutch: 'gaan', english: 'to go' }, { dutch: 'haan', english: 'rooster' }],
    ],
  },
];
