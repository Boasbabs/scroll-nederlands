// Places the sound contrasts beside the course: one learning item per
// contrast, practised only by ear (pairDrill in src/engine/exercises.ts).
import type { LearningItem } from '../curriculum/types';
import type { SoundContrast } from './types';

/** The stage id (and lesson and module id) of every contrast item; course lessons never use it. */
export const SOUNDS_STAGE = 'sounds';

/** The permanent item id of a contrast. */
export function contrastItemId(contrast: SoundContrast): string {
  return `p-${contrast.id}`;
}

/** "a or aa". */
export function contrastLabel(contrast: SoundContrast): string {
  return `${contrast.sounds[0]} or ${contrast.sounds[1]}`;
}

export function placeContrasts(contrasts: ReadonlyArray<SoundContrast>): Array<LearningItem> {
  return contrasts.map((contrast): LearningItem => {
    const first = contrast.pairs[0];
    return {
      key: contrast.id,
      // Read aloud in "Review these" lists, so real words rather than letters.
      dutch: first ? `${first[0].dutch} · ${first[1].dutch}` : contrastLabel(contrast),
      english: `Ear training: ${contrastLabel(contrast)}`,
      kind: 'sound',
      recognitionOnly: true,
      id: contrastItemId(contrast),
      lessonId: SOUNDS_STAGE,
      moduleId: SOUNDS_STAGE,
      stageId: SOUNDS_STAGE,
      primary: false,
    };
  });
}
