// Finding what a corrector changed: a longest-common-subsequence diff over
// words, ignoring case and punctuation. Each run of changed words that the
// correction adds or replaces becomes one Correction.
import { normalizeAnswer } from '../engine/answers';
import type { Correction } from './types';

type Op = { type: 'same' | 'wrote' | 'fixed'; index: number };

function words(text: string): Array<string> {
  return text.split(/\s+/).filter(Boolean);
}

/** The edit script turning `a` into `b`: kept words, words dropped from `a`, words added from `b`. */
function diffWords(a: ReadonlyArray<string>, b: ReadonlyArray<string>): Array<Op> {
  const plainA = a.map((word) => normalizeAnswer(word));
  const plainB = b.map((word) => normalizeAnswer(word));
  // lcs[i][j]: the longest common run of a[i..] and b[j..].
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i]![j] = plainA[i] === plainB[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }
  const ops: Array<Op> = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && plainA[i] === plainB[j]) {
      ops.push({ type: 'same', index: j });
      i++;
      j++;
    } else if (j < b.length && (i >= a.length || lcs[i]![j + 1]! >= lcs[i + 1]![j]!)) {
      ops.push({ type: 'fixed', index: j++ });
    } else {
      ops.push({ type: 'wrote', index: i++ });
    }
  }
  return ops;
}

const LEAD = /^[^\p{L}\p{N}]*/u;
const TRAIL = /[^\p{L}\p{N}]*$/u;

function bare(text: string): string {
  return text.replace(LEAD, '').replace(TRAIL, '');
}

/** Ends a sentence: "Utrecht." "toch?" "zo!" (a closing quote or bracket may follow). */
function endsSentence(word: string): boolean {
  return /[.!?]["'”’)]*$/.test(word);
}

/**
 * The changes from what the learner wrote to the corrected text. Words the
 * corrector only removed leave nothing to fill in, so they are skipped;
 * changes of case or punctuation alone do not count.
 */
export function findCorrections(written: string, corrected: string, at: number): Array<Correction> {
  const mine = words(written);
  const fixed = words(corrected);
  const runs: Array<{ wrote: Array<string>; from: number; to: number }> = [];
  let run: (typeof runs)[number] | undefined;
  for (const op of diffWords(mine, fixed)) {
    if (op.type === 'same') {
      run = undefined;
      continue;
    }
    if (!run) {
      run = { wrote: [], from: -1, to: -1 };
      runs.push(run);
    }
    if (op.type === 'wrote') run.wrote.push(mine[op.index]!);
    else {
      if (run.from < 0) run.from = op.index;
      run.to = op.index + 1;
    }
  }
  return runs
    .filter((change) => change.from >= 0 && fixed.slice(change.from, change.to).some((word) => bare(word)))
    .map((change, n): Correction => {
      let start = change.from;
      while (start > 0 && !endsSentence(fixed[start - 1]!)) start--;
      let end = change.to;
      while (end < fixed.length && !endsSentence(fixed[end - 1]!)) end++;
      const span = fixed.slice(change.from, change.to).join(' ');
      const gap = `${LEAD.exec(span)![0]}___${TRAIL.exec(span)![0]}`;
      return {
        id: `c-${(at + n).toString(36)}`,
        sentence: [...fixed.slice(start, change.from), gap, ...fixed.slice(change.to, end)].join(' '),
        answers: [bare(span)],
        wrote: bare(change.wrote.join(' ')),
        dutch: fixed.slice(start, end).join(' '),
        at,
      };
    });
}
