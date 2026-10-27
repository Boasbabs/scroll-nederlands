import { describe, expect, it } from 'vitest';
import { curriculum } from '../../src/curriculum';
import { validateCurriculum } from '../../src/curriculum/validate';

// While authoring, check a subset: CURRICULUM_MODULES=s0-greet,s0-intro pnpm validate:curriculum
const onlyModules = process.env.CURRICULUM_MODULES?.split(',').filter(Boolean);

describe('curriculum content', () => {
  it('has no structural or content errors', () => {
    const errors = validateCurriculum(curriculum, { modules: onlyModules });
    expect(errors).toEqual([]);
  });
});
