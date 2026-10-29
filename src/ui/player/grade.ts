// Turning what the learner entered into a verdict, using the engine's checks.
import type { Exercise } from '../../curriculum/types';
import { checkChoice, checkOrder, checkTyped, checkWriting, type AnswerCheck, type TaughtWord } from '../../engine/answers';

export type Answer =
  | { kind: 'choice'; option: string }
  | { kind: 'text'; text: string }
  | { kind: 'tiles'; words: Array<string> }
  /** Self-rated: the recall card, short writing. */
  | { kind: 'self'; yes: boolean }
  /** Match pairs report which items were mismatched along the way. */
  | { kind: 'match'; missedItemIds: Array<string> };

/** Kinds that get "Try again" after a first miss (typed answers and tiles). */
export function allowsRetry(exercise: Exercise): boolean {
  return exercise.kind === 'type' || exercise.kind === 'cloze' || exercise.kind === 'order';
}

/** An answer worth checking: something chosen, typed or placed. */
export function isAnswered(answer: Answer | undefined): answer is Answer {
  if (!answer) return false;
  if (answer.kind === 'text') return answer.text.trim().length > 0;
  if (answer.kind === 'tiles') return answer.words.length > 0;
  return true;
}

/** `taught` finds the word the app teaches that a typed answer spells (the course index's), so a slip into it is a mistake. */
export function gradeAnswer(exercise: Exercise, answer: Answer, taught?: (text: string) => TaughtWord | undefined): AnswerCheck {
  if (answer.kind === 'self') return { verdict: answer.yes ? 'correct' : 'incorrect', correct: answer.yes, expected: '' };
  if (answer.kind === 'match') {
    const correct = answer.missedItemIds.length === 0;
    return { verdict: correct ? 'correct' : 'incorrect', correct, expected: '' };
  }
  switch (exercise.kind) {
    case 'choice':
      return checkChoice(answer.kind === 'choice' ? answer.option : '', exercise.answer);
    case 'cloze':
    case 'type':
      return checkTyped(answer.kind === 'text' ? answer.text : '', exercise.answers, exercise.strict, taught);
    case 'order':
      return checkOrder(answer.kind === 'tiles' ? answer.words : [], exercise.words, exercise.alternatives);
    case 'write':
      return checkWriting(answer.kind === 'text' ? answer.text : '', exercise.mustInclude, exercise.minWords, exercise.modelAnswer);
    case 'match':
      return { verdict: 'correct', correct: true, expected: '' };
  }
}

/** The text the learner gave, for the "Your answer:" line. */
export function givenText(answer: Answer | undefined): string | undefined {
  if (answer?.kind === 'text') return answer.text.trim();
  if (answer?.kind === 'tiles') return answer.words.join(' ');
  return undefined;
}

/** The sentence a cloze answer completes ("Ik ___ koffie." → "Ik drink koffie."). */
export function fillGap(sentence: string, answer: string): string {
  return sentence.replace(/_{2,}/, answer);
}
