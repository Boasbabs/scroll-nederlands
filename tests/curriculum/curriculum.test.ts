import { describe, expect, it } from 'vitest';
import { allLessons, curriculum } from '../../src/curriculum';
import { curriculumStructure } from '../../src/curriculum/structure';
import { validateCurriculum } from '../../src/curriculum/validate';

// While authoring, check a subset: CURRICULUM_MODULES=s0-greet,s0-intro pnpm validate:curriculum
const onlyModules = process.env.CURRICULUM_MODULES?.split(',').filter(Boolean);

describe('curriculum content', () => {
  it('has no structural or content errors', () => {
    const errors = validateCurriculum(curriculum, { modules: onlyModules });
    expect(errors).toEqual([]);
  });

  it.skipIf(onlyModules)('is complete: every planned module has lessons and every objective is covered', () => {
    const errors = validateCurriculum(curriculum, { requireComplete: true });
    expect(errors).toEqual([]);
  });

  it.skipIf(onlyModules)('starts a new learner at a pre-A1 sounds lesson', () => {
    expect(allLessons[0]?.level).toBe('pre-a1');
    expect(allLessons[0]?.moduleId).toBe('s0-sounds');
  });

  it.skipIf(onlyModules)('follows stage order through to A2', () => {
    const levels = curriculum.stages.map((stage) => stage.level);
    expect(levels).toEqual(['pre-a1', 'a1', 'a1-a2', 'a2']);
    expect(curriculum.stages.map((stage) => stage.id)).toEqual(curriculumStructure.map((stage) => stage.id));
    for (const stage of curriculum.stages) {
      expect(stage.modules.every((module) => module.lessons.length >= 2)).toBe(true);
    }
  });
});
