// Places the scenario packs beside the course. Each scene is a lesson the
// lesson player runs as it is; scenes are found by id but stay off the course
// path, as the basic words do.
import type { LearningItem, Lesson } from '../curriculum/types';
import type { Pack } from './types';

/** The stage id of every scene lesson and pack item; course lessons never use it. */
export const PACKS_STAGE = 'packs';

/** A pack's module id. Its scenes and items share it, so generated drills draw wrong options from the same pack. */
export function packModuleId(packId: string): string {
  return `sc-${packId}`;
}

/** True for a set (false friends), false for a situation. */
export function isSet(pack: Pick<Pack, 'kind'>): boolean {
  return pack.kind === 'set';
}

/** A pack placed beside the course. */
export type PlacedPack = Omit<Pack, 'scenes'> & {
  /** The scene lessons in order; `order` is the scene's place in its pack. */
  scenes: Array<Lesson>;
  /** The pack's own items, scene by scene. Course and word-track items its exercises refer to are not among them. */
  items: Array<LearningItem>;
  /**
   * What its page lists and practises: its own items and, for a set, its
   * shared words, each after the items of the scene that practises it first.
   * A situation's members are its own items.
   */
  members: Array<LearningItem>;
};

/** The packs with their scenes and own items; `members` waits for the shared words (withMembers). */
export function placePacks(packs: ReadonlyArray<Pack>): Array<PlacedPack> {
  return packs.map((pack) => {
    const moduleId = packModuleId(pack.id);
    const scenes = pack.scenes.map(
      (draft, order): Lesson => ({
        ...draft,
        moduleId,
        stageId: PACKS_STAGE,
        // Packs are A1–A2 material, best after the course modules they build on.
        level: 'a1-a2',
        order,
        items: draft.items.map(
          (item, index): LearningItem => ({
            ...item,
            id: `${draft.id}/${item.key}`,
            lessonId: draft.id,
            moduleId,
            stageId: PACKS_STAGE,
            primary: index === 0,
          }),
        ),
      }),
    );
    const items = scenes.flatMap((scene) => scene.items);
    return { ...pack, scenes, items, members: items };
  });
}

/** Resolves each set's shared words once every item is known; one no scene practises, or unknown, is left out (validatePacks reports it). */
export function withMembers(packs: ReadonlyArray<PlacedPack>, item: (id: string) => LearningItem | undefined): Array<PlacedPack> {
  return packs.map((pack) => {
    if (!pack.shared?.length) return pack;
    const waiting = new Set(pack.shared);
    const members = pack.scenes.flatMap((scene) => {
      // Shared words are always named by full id, so the exercises' own lists say which ones a scene practises.
      const first = [...new Set(scene.exercises.flatMap((exercise) => exercise.items ?? []))].filter((id) => waiting.delete(id));
      return [...scene.items, ...first.flatMap((id) => item(id) ?? [])];
    });
    return { ...pack, members };
  });
}
