import { isLessonNoun, placeArticles } from '../articles/assemble';
import type { Correction } from '../corrections/types';
import { placePacks, type PlacedPack } from '../packs/assemble';
import type { Pack } from '../packs/types';
import { contrastItemId, placeContrasts } from '../sounds/assemble';
import type { SoundContrast } from '../sounds/types';
import { placeWords, type PlacedTheme } from '../words/assemble';
import type { WordTheme } from '../words/types';
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
  /** The course path. Basic words are not lessons, and pack scenes are not on the path. */
  lessons: Array<Lesson>;
  /** Every schedulable item: the course's, the basic words the course does not teach, the packs', the sound contrasts, the articles. */
  items: Array<LearningItem>;
  /** The basic-word list in introduction order, course items included (see src/words). */
  words: Array<LearningItem>;
  /** The same list theme by theme, each in its own order (the Topics tab). */
  themes: Array<PlacedTheme>;
  /** The sound contrasts for ear training, in introduction order (see src/sounds). */
  sounds: Array<LearningItem>;
  /** One de/het item per singular noun, course nouns first (see src/articles). */
  articles: Array<LearningItem>;
  /** The scenario packs beside the path, each with its scene lessons (see src/packs). */
  packs: Array<PlacedPack>;
  /** A course lesson or a pack scene. */
  lesson: (id: string) => Lesson | undefined;
  item: (id: string) => LearningItem | undefined;
  /** The minimal pairs behind a contrast item. */
  contrast: (itemId: string) => SoundContrast | undefined;
  /** The learner's correction behind a correction item (added at runtime, see withCorrections). */
  correction: (itemId: string) => Correction | undefined;
};

export function indexCurriculum(
  source: Curriculum,
  wordThemes: ReadonlyArray<WordTheme> = [],
  contrasts: ReadonlyArray<SoundContrast> = [],
  packList: ReadonlyArray<Pack> = [],
): CurriculumIndex {
  const lessons = flattenLessons(source);
  const courseItems = lessons.flatMap((lesson) => lesson.items);
  const placed = placeWords(wordThemes, courseItems);
  const sounds = placeContrasts(contrasts);
  const packs = placePacks(packList);
  const packItems = packs.flatMap((pack) => pack.items);
  const articles = placeArticles([...courseItems.filter(isLessonNoun), ...placed.nouns, ...packItems.filter(isLessonNoun)]);
  const items = [...courseItems, ...placed.items, ...packItems, ...sounds, ...articles];
  const lessonById = new Map([...lessons, ...packs.flatMap((pack) => pack.scenes)].map((lesson) => [lesson.id, lesson]));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const contrastById = new Map(contrasts.map((contrast) => [contrastItemId(contrast), contrast]));
  return {
    curriculum: source,
    lessons,
    items,
    words: placed.words,
    themes: placed.themes,
    sounds,
    articles,
    packs,
    lesson: (id) => lessonById.get(id),
    item: (id) => itemById.get(id),
    contrast: (itemId) => contrastById.get(itemId),
    correction: () => undefined,
  };
}
