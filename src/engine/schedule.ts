export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * MINUTE_MS;

/** After a failed recall the item comes back this soon (in focused practice). */
export const RELEARN_DELAY_MS = 10 * MINUTE_MS;

/**
 * Days until the next review, indexed by step. Step 0 is the immediate
 * practice inside the lesson. These are starting heuristics, not optimal values.
 */
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60];

export function calculateNextReviewDate(step: number, now: number): number {
  if (step <= 0) return now + RELEARN_DELAY_MS;
  const index = Math.min(step, REVIEW_INTERVAL_DAYS.length - 1);
  return now + REVIEW_INTERVAL_DAYS[index]! * DAY_MS;
}

/** Step after a correct answer. Practising before the item is due earns no extra spacing. */
export function stepAfterSuccess(step: number, isDue: boolean): number {
  return isDue || step === 0 ? step + 1 : step;
}

/** Step after a failed answer: fall back two intervals so the next review comes sooner. */
export function stepAfterFailure(step: number): number {
  return Math.max(0, step - 2);
}
