import type { StagePlan } from './structure';
import type { Curriculum, Exercise, LearningItem, Lesson, LessonDraft } from './types';

/** Places authored lessons in stage and module order and gives every item its global id. */
export function assembleCurriculum(
  structure: Array<StagePlan>,
  draftsFor: (stageId: string, moduleId: string) => Array<LessonDraft>,
): Curriculum {
  let order = 0;
  return {
    stages: structure.map((stage) => ({
      id: stage.id,
      level: stage.level,
      title: stage.title,
      objective: stage.objective,
      modules: stage.modules.map((module) => ({
        id: module.id,
        stageId: stage.id,
        title: module.title,
        description: module.description,
        lessons: draftsFor(stage.id, module.id).map(
          (draft): Lesson => ({
            ...draft,
            moduleId: module.id,
            stageId: stage.id,
            level: stage.level,
            order: order++,
            items: draft.items.map(
              (item, index): LearningItem => ({
                ...item,
                id: `${draft.id}/${item.key}`,
                lessonId: draft.id,
                moduleId: module.id,
                stageId: stage.id,
                primary: index === 0,
              }),
            ),
          }),
        ),
      })),
    })),
  };
}

/** Every lesson in teaching order. */
export function flattenLessons(source: Curriculum): Array<Lesson> {
  return source.stages.flatMap((stage) => stage.modules.flatMap((module) => module.lessons));
}

/**
 * The global ids of the items an exercise practises. Local keys resolve
 * against the lesson; full ids ("lesson-id/key") pass through; no list means
 * the lesson's main item.
 */
export function exerciseItemIds(lesson: Lesson, exercise: Exercise): Array<string> {
  if (exercise.items?.length) {
    return exercise.items.map((ref) => (ref.includes('/') ? ref : `${lesson.id}/${ref}`));
  }
  const primary = lesson.items[0];
  return primary ? [primary.id] : [];
}

export type CurriculumIndex = {
  curriculum: Curriculum;
  lessons: Array<Lesson>;
  items: Array<LearningItem>;
  lesson: (id: string) => Lesson | undefined;
  item: (id: string) => LearningItem | undefined;
};

export function indexCurriculum(source: Curriculum): CurriculumIndex {
  const lessons = flattenLessons(source);
  const items = lessons.flatMap((lesson) => lesson.items);
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const itemById = new Map(items.map((item) => [item.id, item]));
  return {
    curriculum: source,
    lessons,
    items,
    lesson: (id) => lessonById.get(id),
    item: (id) => itemById.get(id),
  };
}
