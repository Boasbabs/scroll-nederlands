// Answer checking. Pure functions: no React, no browser APIs.

/**
 * correct: matches an accepted answer.
 * accent: right apart from accents (één → een); counts as correct.
 * typo: one slip in a longer answer; counts as correct, the spelling is shown.
 *   A different determiner (de for het, een for geen) is never a typo.
 * incorrect: anything else.
 */
export type Verdict = 'correct' | 'accent' | 'typo' | 'incorrect';

export type AnswerCheck = {
  verdict: Verdict;
  /** Whether the answer counts as correct for scheduling. */
  correct: boolean;
  /** The model answer to show (the accepted answer closest to what was given). */
  expected: string;
  /** Extra feedback, e.g. which required word a written message is missing. */
  note?: string;
};

export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.!?¿¡,;:"“”„()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

/** Optimal string alignment distance (Levenshtein plus adjacent swaps). */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: Array<Array<number>> = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, d[i - 2]![j - 2]! + 1);
      }
      d[i]![j] = best;
    }
  }
  return d[a.length]![b.length]!;
}

/** Typos tolerated for an answer of this length: none below 6 letters. */
function typoAllowance(answer: string): number {
  const letters = answer.replace(/\s/g, '').length;
  if (letters >= 14) return 2;
  if (letters >= 6) return 1;
  return 0;
}

/**
 * Swapping one of these for another changes the gender or the meaning
 * (het kopje, die/dat, een/geen), so it is a mistake even when the edit
 * distance is small enough for a typo.
 */
const DETERMINERS: ReadonlySet<string> = new Set(['de', 'het', 'die', 'dat', 'deze', 'dit', 'een', 'geen']);

/** The determiner the learner wrote in place of a different one, if any. */
function swappedDeterminer(expected: string, given: string): string | undefined {
  const want = wordsOf(expected).map(stripAccents);
  const got = wordsOf(given).map(stripAccents);
  if (want.length !== got.length) return undefined;
  return got.find((word, i) => word !== want[i] && DETERMINERS.has(word) && DETERMINERS.has(want[i]!));
}

/**
 * Checks a typed answer against the accepted answers (the first is the model
 * answer). With `strict`, spelling is the point and typos are not tolerated.
 */
export function checkTyped(given: string, accepted: ReadonlyArray<string>, strict = false): AnswerCheck {
  const model = accepted[0] ?? '';
  const answer = normalizeAnswer(given);
  if (!answer) return { verdict: 'incorrect', correct: false, expected: model };

  for (const option of accepted) {
    if (normalizeAnswer(option) === answer) return { verdict: 'correct', correct: true, expected: option };
  }
  for (const option of accepted) {
    if (stripAccents(normalizeAnswer(option)) === stripAccents(answer)) {
      return { verdict: 'accent', correct: true, expected: option, note: `Watch the accents: ${option}` };
    }
  }

  let nearest = model;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const option of accepted) {
    const distance = editDistance(stripAccents(normalizeAnswer(option)), stripAccents(answer));
    if (distance < nearestDistance) {
      nearest = option;
      nearestDistance = distance;
    }
  }
  if (!strict && nearestDistance <= typoAllowance(normalizeAnswer(nearest))) {
    const swapped = swappedDeterminer(nearest, answer);
    if (swapped) return { verdict: 'incorrect', correct: false, expected: nearest, note: `Check the word "${swapped}".` };
    return { verdict: 'typo', correct: true, expected: nearest, note: `Nearly perfect. It is spelled: ${nearest}` };
  }
  return { verdict: 'incorrect', correct: false, expected: closestByWords(answer, accepted) };
}

/** The accepted answer sharing the most words with what was given; the model answer on a tie. */
function closestByWords(answer: string, accepted: ReadonlyArray<string>): string {
  const given = new Set(wordsOf(answer).map(stripAccents));
  let best = accepted[0] ?? '';
  let bestShared = -1;
  for (const option of accepted) {
    const shared = wordsOf(option).filter((word) => given.has(stripAccents(word))).length;
    if (shared > bestShared) {
      best = option;
      bestShared = shared;
    }
  }
  return best;
}

export function checkChoice(given: string, answer: string): AnswerCheck {
  const correct = given === answer;
  return { verdict: correct ? 'correct' : 'incorrect', correct, expected: answer };
}

/** Word tiles: the main order or any listed alternative. */
export function checkOrder(
  given: ReadonlyArray<string>,
  words: ReadonlyArray<string>,
  alternatives: ReadonlyArray<ReadonlyArray<string>> = [],
): AnswerCheck {
  const sentence = normalizeAnswer(given.join(' '));
  const expected = words.join(' ');
  const correct = [words, ...alternatives].some((order) => normalizeAnswer(order.join(' ')) === sentence);
  return { verdict: correct ? 'correct' : 'incorrect', correct, expected };
}

function wordsOf(text: string): Array<string> {
  return normalizeAnswer(text).split(' ').filter(Boolean);
}

/**
 * Short writing, checked leniently: each `mustInclude` group needs one of its
 * words or phrases, and the text needs `minWords` words. It cannot judge
 * whether the message makes sense, so the model answer is always shown.
 */
export function checkWriting(
  given: string,
  mustInclude: ReadonlyArray<ReadonlyArray<string>>,
  minWords: number,
  modelAnswer: string,
): AnswerCheck {
  const used = includedGroups(given, mustInclude);
  const missing = mustInclude.filter((_, i) => !used[i]);
  const count = wordsOf(given).length;
  if (missing.length === 0 && count >= minWords) {
    return { verdict: 'correct', correct: true, expected: modelAnswer };
  }
  const notes: Array<string> = [];
  if (missing.length > 0) notes.push(`Try to use: ${missing.map((group) => group[0]).join(', ')}.`);
  if (count < minWords) notes.push(`Write at least ${minWords} words (you wrote ${count}).`);
  return { verdict: 'incorrect', correct: false, expected: modelAnswer, note: notes.join(' ') };
}

/** For each `mustInclude` group, whether the text uses one of its words or phrases (accents ignored). */
export function includedGroups(given: string, mustInclude: ReadonlyArray<ReadonlyArray<string>>): Array<boolean> {
  const plainText = stripAccents(` ${wordsOf(given).join(' ')} `);
  return mustInclude.map((group) => group.some((option) => plainText.includes(` ${stripAccents(wordsOf(option).join(' '))} `)));
}

/** Word count as the writing check counts it. */
export function countWords(text: string): number {
  return wordsOf(text).length;
}

/**
 * Splits the model answer and the learner's answer into tokens and marks the
 * model-answer tokens the learner missed, so feedback can highlight them.
 */
export function diffTokens(expected: string, given: string): Array<{ text: string; missed: boolean }> {
  const givenWords = new Set(wordsOf(given).map(stripAccents));
  return expected
    .split(/(\s+)/)
    .filter((token) => token.length > 0)
    .map((token) => {
      if (/^\s+$/.test(token)) return { text: token, missed: false };
      const plain = stripAccents(normalizeAnswer(token));
      return { text: token, missed: plain.length > 0 && !givenWords.has(plain) };
    });
}
