import { ARTICLES_STAGE } from '../../src/articles/assemble';
import { course, curriculum } from '../../src/curriculum';
import { requiredObjectives } from '../../src/curriculum/objectives';
import { EXERCISE_STAGES } from '../../src/curriculum/types';
import { curriculumStats, validateCurriculum } from '../../src/curriculum/validate';
import { generateExercise, seededRandom } from '../../src/engine/exercises';
import { gradeAnswer } from '../../src/ui/player/grade';
import { SOUNDS_STAGE } from '../../src/sounds/assemble';
import { WORDS_STAGE } from '../../src/words/assemble';
import { makeCourse } from '../fixtures/curriculum';

describe('the bundled curriculum', () => {
  it('passes validation', () => {
    expect(validateCurriculum(curriculum)).toEqual([]);
  });

  it('runs from pre-A1 through A1 to A2 in order', () => {
    expect(curriculum.stages.map((stage) => stage.level)).toEqual(['pre-a1', 'a1', 'a1-a2', 'a2']);
    const first = course.lessons[0]!;
    expect(first.stageId).toBe('s0');
    expect(first.kind).toBe('core');
    expect(first.prerequisites ?? []).toEqual([]);
  });

  it('has real lessons with exercises in every module, not just titles', () => {
    for (const stage of curriculum.stages) {
      for (const module of stage.modules) {
        expect(module.lessons.length, module.id).toBeGreaterThan(0);
        for (const lesson of module.lessons) {
          expect(lesson.exercises.length, lesson.id).toBeGreaterThan(0);
          expect(lesson.objective.length, lesson.id).toBeGreaterThan(10);
        }
      }
    }
  });

  it('covers every required objective of every stage with a lesson in that stage', () => {
    for (const stage of curriculum.stages) {
      const covered = new Set(stage.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.covers)));
      for (const tag of Object.keys(requiredObjectives[stage.id] ?? {})) {
        expect(covered.has(tag), `${stage.id}: ${tag}`).toBe(true);
      }
    }
  });

  it('teaches every core lesson from recognition to transfer', () => {
    for (const lesson of course.lessons.filter((entry) => entry.kind === 'core')) {
      const stages = new Set(lesson.exercises.map((exercise) => exercise.stage));
      expect([...EXERCISE_STAGES].every((stage) => stages.has(stage)), lesson.id).toBe(true);
    }
  });

  it('reinforces earlier material with practice lessons and checkpoints in every stage', () => {
    for (const stage of curriculum.stages) {
      const lessons = stage.modules.flatMap((module) => module.lessons);
      expect(lessons.some((lesson) => lesson.kind === 'practice'), stage.id).toBe(true);
      expect(lessons.some((lesson) => lesson.kind === 'checkpoint'), stage.id).toBe(true);
    }
  });

  it('practises listening, reading and writing, and prompts speaking', () => {
    const stats = curriculumStats(curriculum);
    expect(stats.listening).toBeGreaterThan(150);
    expect(stats.reading).toBeGreaterThan(50);
    expect(stats.exercisesByKind.write ?? 0).toBeGreaterThan(40);
    expect(course.lessons.filter((lesson) => lesson.speakingPrompt).length).toBeGreaterThan(150);
  });

  it('gives every learning item a globally unique id, and every course item an owning lesson', () => {
    const ids = course.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of course.items) {
      // Basic words the course does not teach, sound contrasts and article items live beside the course.
      if ([WORDS_STAGE, SOUNDS_STAGE, ARTICLES_STAGE].includes(item.stageId)) expect(course.lesson(item.lessonId)).toBeUndefined();
      else expect(course.lesson(item.lessonId)?.items).toContain(item);
    }
  });
});

describe('typed answers in the bundled course', () => {
  it('find the word a text spells, a noun with or without its article', () => {
    expect(course.taught('De boot!')).toEqual({ dutch: 'de boot', english: 'the boat' });
    expect(course.taught('tekening')).toMatchObject({ dutch: 'tekening' });
    expect(course.taught('de booom')).toBeUndefined();
    // A form of the item being practised is not another word.
    expect(course.taught('de boot', ['w-transport/boot'])).toBeUndefined();
  });

  it('take a slip that spells another taught word as that word, not as a typo', () => {
    // Dictation: "de boom" heard, "de boot" typed.
    const boom = generateExercise(course, course.item('w-nature/boom')!, 'transfer', 0, seededRandom('boom'));
    const taught = (text: string) => course.taught(text, ['w-nature/boom']);
    expect(gradeAnswer(boom, { kind: 'text', text: 'de boot' }, taught)).toMatchObject({ verdict: 'incorrect', note: '"de boot" means "the boat".' });
    expect(gradeAnswer(boom, { kind: 'text', text: 'de booom' }, taught)).toMatchObject({ verdict: 'typo', correct: true });
  });
});

describe('validateCurriculum', () => {
  it('accepts a well-formed course', () => {
    expect(validateCurriculum(makeCourse().curriculum)).toEqual([]);
  });

  it('reports an answer that is not among the options', () => {
    const broken = makeCourse({
      'x0-a-hello': {
        exercises: makeCourse().lesson('x0-a-hello')!.exercises.map((exercise) =>
          exercise.kind === 'choice' ? { ...exercise, answer: 'Missing' } : exercise,
        ),
      },
    });
    expect(validateCurriculum(broken.curriculum)).toContain('x0-a-hello/rec: answer is not one of the options');
  });

  it('reports exercises that practise items no earlier lesson teaches', () => {
    const broken = makeCourse({
      'x0-a-thanks': {
        exercises: makeCourse().lesson('x0-a-thanks')!.exercises.map((exercise) => ({
          ...exercise,
          items: ['x1-a-pay/ik-wil-betalen'],
        })),
      },
    });
    expect(validateCurriculum(broken.curriculum)).toContain(
      'x0-a-thanks/rec: item x1-a-pay/ik-wil-betalen is not taught by this or an earlier lesson',
    );
  });

  it('reports a recall prompt that gives the answer away', () => {
    const broken = makeCourse({
      'x0-a-bye': {
        exercises: makeCourse().lesson('x0-a-bye')!.exercises.map((exercise) =>
          exercise.id === 'type' ? { ...exercise, prompt: 'Type "Tot ziens"' } : exercise,
        ),
      },
    });
    expect(validateCurriculum(broken.curriculum)).toContain('x0-a-bye/type: prompt reveals the answer');
  });

  it('reports a core lesson that skips a stage', () => {
    const broken = makeCourse({
      'x1-a-pay': {
        exercises: makeCourse().lesson('x1-a-pay')!.exercises.filter((exercise) => exercise.stage !== 'transfer'),
      },
    });
    expect(validateCurriculum(broken.curriculum)).toContain('x1-a-pay: no transfer exercise');
  });

  it('reports a checkpoint question that tests a later lesson', () => {
    const later = makeCourse().lesson('x0-check-one')!.exercises.map((exercise) => ({
      ...exercise,
      testsLesson: 'x1-a-coffee',
      items: ['x1-a-coffee/ik-wil-koffie'],
    }));
    const issues = validateCurriculum(makeCourse({ 'x0-check-one': { exercises: later } }).curriculum);
    expect(issues).toContain('x0-check-one/q1: checkpoint exercise must test an earlier lesson');
  });

  it('reports the same Dutch taught twice', () => {
    const lesson = makeCourse().lesson('x0-a-hello')!;
    const duplicate = makeCourse({
      'x0-a-bye': { items: [{ key: 'hallo-daar', dutch: 'Hallo daar', english: 'Hello there', kind: 'phrase' }] },
    });
    expect(lesson.items[0]!.dutch).toBe('Hallo daar');
    expect(validateCurriculum(duplicate.curriculum)).toContain(
      'x0-a-bye/hallo-daar: "Hallo daar" is already taught by x0-a-hello/hallo-daar',
    );
  });

  it('reports a writing task whose model answer fails its own check', () => {
    const broken = makeCourse({
      'x1-a-coffee': {
        exercises: [
          ...makeCourse().lesson('x1-a-coffee')!.exercises,
          {
            id: 'write',
            stage: 'transfer',
            kind: 'write',
            prompt: 'Write a short order.',
            mustInclude: [['thee']],
            minWords: 3,
            modelAnswer: 'Ik wil koffie.',
            explanation: 'Use ik wil.',
          },
        ],
      },
    });
    expect(validateCurriculum(broken.curriculum).some((issue) => issue.startsWith('x1-a-coffee/write: model answer fails'))).toBe(true);
  });
});
