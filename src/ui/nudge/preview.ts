// The one-line preview on the prompt card: what "Learn now" would start with.
// A new lesson shows its phrase. Reviews and new words show only how many, and
// which kind for the tile: the item, or its meaning, would give away the drill that follows.
import type { CurriculumIndex } from '../../curriculum/assemble';
import type { NextActivity } from '../../engine/selection';
import { plural } from '../format';
import type { NudgePreview } from './NudgeCard';

export function previewFor(course: CurriculumIndex, next: NextActivity): NudgePreview | undefined {
  if (next.type === 'lesson') {
    const lesson = course.lesson(next.lessonId);
    return lesson && { dutch: lesson.targetPhrase, english: lesson.meaningEn };
  }
  if (next.type === 'review') return { text: plural(next.itemIds.length, 'quick review'), kind: 'reviews' };
  if (next.type === 'words') return { text: plural(next.itemIds.length, 'new word'), kind: 'words' };
  return undefined;
}
