// "Make it yours" for items that keep slipping (docs/fluent-forever-plan.md,
// Phase 4). The notes' fill-the-gap is personalGap in exercises.ts.
import { ARTICLES_STAGE } from '../articles/assemble';
import type { CurriculumIndex } from '../curriculum/assemble';
import { SOUNDS_STAGE } from '../sounds/assemble';
import type { LeechIndex, NoteIndex, PictureIndex } from '../storage/store';
import type { LearnerProgress } from './types';

/** A review miss that makes this many lapses offers "Make it yours". */
export const LEECH_LAPSES = 4;

/**
 * Items to offer "Make it yours" if missed again in a review: missing it now
 * would be lapse number LEECH_LAPSES or more, the learner has no note or own
 * picture for it, and it was not offered before. Ear-training and article
 * items are left out: a note belongs on the word itself.
 */
export function leechCheck(
  index: CurriculumIndex,
  progress: LearnerProgress,
  notes: NoteIndex,
  ownPictures: PictureIndex,
  offered: LeechIndex,
): (itemId: string) => boolean {
  return (itemId) => {
    const item = index.item(itemId);
    if (!item || item.stageId === SOUNDS_STAGE || item.stageId === ARTICLES_STAGE) return false;
    if (itemId in notes || itemId in ownPictures || itemId in offered) return false;
    return (progress.items[itemId]?.lapses ?? 0) + 1 >= LEECH_LAPSES;
  };
}
