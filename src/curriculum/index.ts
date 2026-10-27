import { assembleCurriculum, indexCurriculum, type CurriculumIndex } from './assemble';
import { curriculumStructure } from './structure';
import type { Curriculum, LessonDraft } from './types';

type ContentModule = { lessons: Array<LessonDraft> };

// Each module's lessons live in content/<stage>/<module-id>.ts.
const contentFiles = import.meta.glob<ContentModule>('./content/*/*.ts', { eager: true });

function lessonsForModule(stageId: string, moduleId: string): Array<LessonDraft> {
  return contentFiles[`./content/${stageId}/${moduleId}.ts`]?.lessons ?? [];
}

export const curriculum: Curriculum = assembleCurriculum(curriculumStructure, lessonsForModule);
export const course: CurriculumIndex = indexCurriculum(curriculum);

export { exerciseItemIds, flattenLessons, indexCurriculum, type CurriculumIndex } from './assemble';
export type { Curriculum, Exercise, LearningItem, Lesson } from './types';
