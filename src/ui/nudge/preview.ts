// The one-line preview on the prompt card: what "Learn now" would start with.
import type { CurriculumIndex } from '../../curriculum/assemble';
import type { NextActivity } from '../../engine/selection';
import type { NudgePreview } from './NudgeCard';

export function previewFor(course: CurriculumIndex, next: NextActivity): NudgePreview | undefined {
  if (next.type === 'lesson') {
    const lesson = course.lesson(next.lessonId);
    return lesson && { dutch: lesson.targetPhrase, english: lesson.meaningEn };
  }
  if (next.type === 'review') {
    const item = course.item(next.itemIds[0] ?? '');
    return item && { dutch: item.dutch, english: item.english };
  }
  return undefined;
}
