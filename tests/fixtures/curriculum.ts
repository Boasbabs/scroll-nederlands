import { assembleCurriculum, indexCurriculum, type CurriculumIndex } from '../../src/curriculum/assemble';
import type { StagePlan } from '../../src/curriculum/structure';
import type { Curriculum, Exercise, LessonDraft } from '../../src/curriculum/types';

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
export function makeCourse(overrides: Record<string, Partial<LessonDraft>> = {}): CurriculumIndex {
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
  return indexCurriculum(curriculum);
}
