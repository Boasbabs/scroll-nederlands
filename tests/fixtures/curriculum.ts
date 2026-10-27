import type { Curriculum, Exercise, Lesson, LessonKind } from '../../src/curriculum/types';

function exercises(id: string): Array<Exercise> {
  return [
    { id: 'rec', stage: 'recognition', kind: 'choice', prompt: `Meaning of ${id}?`, options: ['a', 'b'], answer: 'a', explanation: 'a' },
    { id: 'cloze', stage: 'supportedRecall', kind: 'cloze', prompt: 'Fill', sentence: 'Ik ___ koffie.', answers: ['wil'], explanation: 'wil' },
    { id: 'type', stage: 'independentRecall', kind: 'type', prompt: 'Say it', answers: ['Ik wil koffie.'], explanation: 'x' },
    { id: 'write', stage: 'transfer', kind: 'write', prompt: 'Write', mustInclude: [['thee']], minWords: 2, modelAnswer: 'Ik wil thee.', explanation: 'x', focusedOnly: true },
    { id: 'transfer', stage: 'transfer', kind: 'type', prompt: 'New situation', answers: ['Ik wil thee.'], explanation: 'x' },
  ];
}

export function lesson(id: string, stageId: string, moduleId: string, kind: LessonKind = 'core', extra: Partial<Lesson> = {}): Lesson {
  return {
    id,
    kind,
    title: id,
    objective: 'o',
    situation: 's',
    targetPhrase: `phrase ${id}`,
    meaningEn: 'm',
    skills: ['reading', 'listening'],
    covers: [],
    exercises: exercises(id),
    moduleId,
    stageId,
    level: stageId === 's0' ? 'pre-a1' : 'a1',
    ...extra,
  };
}

const checkpointExercises: Array<Exercise> = [
  { id: 'c1', stage: 'transfer', kind: 'choice', prompt: 'q', options: ['a', 'b'], answer: 'a', explanation: 'x', testsLesson: 'a1' },
  { id: 'c2', stage: 'transfer', kind: 'choice', prompt: 'q', options: ['a', 'b'], answer: 'a', explanation: 'x', testsLesson: 'a2' },
  { id: 'c3', stage: 'transfer', kind: 'choice', prompt: 'q', options: ['a', 'b'], answer: 'a', explanation: 'x', testsLesson: 'a3' },
  { id: 'c4', stage: 'transfer', kind: 'choice', prompt: 'q', options: ['a', 'b'], answer: 'a', explanation: 'x', testsLesson: 'a1' },
  { id: 'c5', stage: 'transfer', kind: 'choice', prompt: 'q', options: ['a', 'b'], answer: 'a', explanation: 'x', testsLesson: 'a2' },
];

export const fixtureCurriculum: Curriculum = {
  stages: [
    {
      id: 's0',
      level: 'pre-a1',
      title: 'Stage 0',
      objective: 'o',
      modules: [
        { id: 'm1', stageId: 's0', title: 'M1', description: 'd', lessons: [lesson('a1', 's0', 'm1'), lesson('a2', 's0', 'm1'), lesson('a3', 's0', 'm1')] },
        {
          id: 'm2',
          stageId: 's0',
          title: 'M2',
          description: 'd',
          lessons: [lesson('check0', 's0', 'm2', 'checkpoint', { revisits: ['a1', 'a2', 'a3'], exercises: checkpointExercises })],
        },
      ],
    },
    {
      id: 's1',
      level: 'a1',
      title: 'Stage 1',
      objective: 'o',
      modules: [{ id: 'm3', stageId: 's1', title: 'M3', description: 'd', lessons: [lesson('b1', 's1', 'm3'), lesson('b2', 's1', 'm3')] }],
    },
  ],
};

export const fixtureLessons: Array<Lesson> = fixtureCurriculum.stages.flatMap((s) => s.modules.flatMap((m) => m.lessons));

export function fixtureLesson(id: string): Lesson {
  return fixtureLessons.find((l) => l.id === id)!;
}
