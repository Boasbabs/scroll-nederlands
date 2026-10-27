import { curriculumStructure } from './structure';
import type { Curriculum, Lesson, LessonDraft } from './types';

type ContentModule = { lessons: Array<LessonDraft> };

// Each module's lessons live in content/<stage>/<module-id>.ts.
const contentFiles = import.meta.glob<ContentModule>('./content/*/*.ts', { eager: true });

function lessonsForModule(stageId: string, moduleId: string): Array<LessonDraft> {
  return contentFiles[`./content/${stageId}/${moduleId}.ts`]?.lessons ?? [];
}

function buildCurriculum(): Curriculum {
  return {
    stages: curriculumStructure.map((stage) => ({
      id: stage.id,
      level: stage.level,
      title: stage.title,
      objective: stage.objective,
      modules: stage.modules.map((module) => ({
        id: module.id,
        stageId: stage.id,
        title: module.title,
        description: module.description,
        lessons: lessonsForModule(stage.id, module.id).map(
          (draft): Lesson => ({ ...draft, moduleId: module.id, stageId: stage.id, level: stage.level }),
        ),
      })),
    })),
  };
}

export const curriculum: Curriculum = buildCurriculum();

/** Every lesson in teaching order. */
export function flattenLessons(source: Curriculum): Array<Lesson> {
  return source.stages.flatMap((stage) => stage.modules.flatMap((module) => module.lessons));
}

export const allLessons: Array<Lesson> = flattenLessons(curriculum);

const lessonIndex = new Map(allLessons.map((lesson) => [lesson.id, lesson]));

export function getLesson(id: string): Lesson | undefined {
  return lessonIndex.get(id);
}

export type { Curriculum, Lesson } from './types';
