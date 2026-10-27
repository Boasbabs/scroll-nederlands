import type { Exercise } from '../curriculum/types';

export type ExerciseResponse = string | Array<string>;

export type AnswerCheck = {
  correct: boolean;
  /** The model answer to show in feedback. */
  expected: string;
  /** Wrong, but only one or two characters off. */
  nearMiss: boolean;
  /** Write exercises: required word groups the text did not include. */
  missing?: Array<string>;
};

/**
 * Lenient comparison form: case, accents, punctuation and spacing are ignored.
 * Apostrophes are kept because they matter in Dutch ('s ochtends, auto's).
 */
export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,!?;:"“”„()¿¡…]/g, ' ')
    .replace(/€/g, ' € ') // "€90" and "€ 90" compare equal
    .replace(/\s+/g, ' ')
    .trim();
}

export function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0]!;
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j]!;
      previous[j] = Math.min(
        above + 1,
        previous[j - 1]! + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length]!;
}

function matchesAny(response: string, accepted: Array<string>): { correct: boolean; nearMiss: boolean } {
  const given = normalizeAnswer(response);
  if (given === '') return { correct: false, nearMiss: false };
  let nearMiss = false;
  for (const option of accepted) {
    const target = normalizeAnswer(option);
    if (given === target) return { correct: true, nearMiss: false };
    if (target.length >= 4 && editDistance(given, target) <= (target.length >= 12 ? 2 : 1)) nearMiss = true;
  }
  return { correct: false, nearMiss };
}

function containsWord(normalizedText: string, word: string): boolean {
  return ` ${normalizedText} `.includes(` ${normalizeAnswer(word)} `);
}

export function countWords(text: string): number {
  const normalized = normalizeAnswer(text);
  return normalized === '' ? 0 : normalized.split(' ').length;
}

/** Required word groups (shown as "a / b") that the text does not contain. */
export function missingWriteGroups(text: string, mustInclude: Array<Array<string>>): Array<string> {
  const normalized = normalizeAnswer(text);
  return mustInclude
    .filter((group) => !group.some((word) => containsWord(normalized, word)))
    .map((group) => group.join(' / '));
}

export function expectedAnswer(exercise: Exercise): string {
  switch (exercise.kind) {
    case 'choice':
      return exercise.answer;
    case 'cloze':
      return exercise.sentence.replace('___', exercise.answers[0] ?? '');
    case 'order':
      return exercise.words.join(' ');
    case 'type':
      return exercise.answers[0] ?? '';
    case 'write':
      return exercise.modelAnswer;
  }
}

export function checkAnswer(exercise: Exercise, response: ExerciseResponse): AnswerCheck {
  const expected = expectedAnswer(exercise);
  const text = Array.isArray(response) ? response.join(' ') : response;

  switch (exercise.kind) {
    case 'choice':
      return { correct: text === exercise.answer, expected, nearMiss: false };
    case 'cloze':
      return { ...matchesAny(text, exercise.answers), expected };
    case 'type':
      return { ...matchesAny(text, exercise.answers), expected };
    case 'order': {
      const orders = [exercise.words, ...(exercise.alternatives ?? [])].map((words) => words.join(' '));
      return { correct: matchesAny(text, orders).correct, expected, nearMiss: false };
    }
    case 'write': {
      const missing = missingWriteGroups(text, exercise.mustInclude);
      const longEnough = countWords(text) >= exercise.minWords;
      return { correct: missing.length === 0 && longEnough, expected, nearMiss: false, missing };
    }
  }
}
