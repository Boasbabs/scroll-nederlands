// Places the learner's corrections beside the course at runtime: each one is a
// learning item (createLearning merges them into the index on every call).
import type { CurriculumIndex } from '../curriculum/assemble';
import type { LearningItem } from '../curriculum/types';
import type { Correction } from './types';

/** The stage id (and lesson and module id) of every correction item; course lessons never use it. */
export const CORRECTIONS_STAGE = 'corrections';

export function placeCorrections(corrections: ReadonlyArray<Correction>): Array<LearningItem> {
  return corrections.map(
    (correction): LearningItem => ({
      key: correction.id,
      dutch: correction.dutch,
      english: correction.wrote ? `Your correction (you wrote "${correction.wrote}")` : 'Your correction',
      kind: 'phrase',
      id: correction.id,
      lessonId: CORRECTIONS_STAGE,
      moduleId: CORRECTIONS_STAGE,
      stageId: CORRECTIONS_STAGE,
      primary: false,
    }),
  );
}

/** The course index with the learner's corrections added as items. */
export function withCorrections(index: CurriculumIndex, corrections: ReadonlyArray<Correction>): CurriculumIndex {
  if (corrections.length === 0) return index;
  const items = placeCorrections(corrections);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const byId = new Map(corrections.map((correction) => [correction.id, correction]));
  return {
    ...index,
    items: [...index.items, ...items],
    item: (id) => itemById.get(id) ?? index.item(id),
    correction: (id) => byId.get(id) ?? index.correction(id),
  };
}
