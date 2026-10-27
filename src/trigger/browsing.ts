// Pure prompt-timing rules for micro-learning. No DOM, no page content:
// the content script only reports that the learner was active, never what they saw.
import { MINUTE_MS } from '../engine/schedule';
import type { LearnerPreferences } from '../engine/types';

/** A gap longer than this starts a new browsing session. */
export const SESSION_GAP_MS = 30 * MINUTE_MS;
/** Input within this window counts as active browsing. */
export const ACTIVITY_WINDOW_MS = 45_000;
/** Upper bound for one accrual tick, so a sleeping laptop does not count as browsing. */
export const MAX_TICK_MS = 15_000;
export const MAX_PROMPTS_PER_SESSION = 3;
export const SNOOZE_MS = 60 * MINUTE_MS;

export type BrowsingState = {
  sessionStartedAt: number;
  lastActiveAt: number;
  /** Active time since the last prompt was answered (or the session began). */
  activeMs: number;
  promptsThisSession: number;
  /** A prompt is waiting for an answer. Only one exists across all tabs. */
  promptPending: boolean;
  /** Lessons answered wrongly in micro mode this session; not offered again until the next session. */
  failedLessonIds: Array<string>;
};

export type PromptResponse = 'learn' | 'not-now' | 'snooze' | 'quiet';

export function newBrowsingState(now: number): BrowsingState {
  return {
    sessionStartedAt: now,
    lastActiveAt: now,
    activeMs: 0,
    promptsThisSession: 0,
    promptPending: false,
    failedLessonIds: [],
  };
}

/** Start a fresh session if the learner has been away long enough. */
export function continueOrStartSession(state: BrowsingState, now: number): BrowsingState {
  return now - state.lastActiveAt > SESSION_GAP_MS ? newBrowsingState(now) : state;
}

/** Add active browsing time. Called by the visible, focused tab while the learner is interacting. */
export function accrueActiveTime(state: BrowsingState, now: number, elapsedMs: number): BrowsingState {
  const current = continueOrStartSession(state, now);
  return {
    ...current,
    activeMs: current.activeMs + Math.max(0, Math.min(elapsedMs, MAX_TICK_MS)),
    lastActiveAt: now,
  };
}

export function isPromptBlocked(preferences: LearnerPreferences, now: number): boolean {
  return preferences.quietMode || (preferences.snoozeUntil !== null && preferences.snoozeUntil > now);
}

export function shouldOfferPrompt(state: BrowsingState, preferences: LearnerPreferences, now: number): boolean {
  if (isPromptBlocked(preferences, now)) return false;
  if (state.promptPending) return true;
  if (state.promptsThisSession >= MAX_PROMPTS_PER_SESSION) return false;
  return state.activeMs >= preferences.promptAfterMinutes * MINUTE_MS;
}

/** Mark a prompt as offered. Idempotent while it is pending, so tabs cannot stack prompts. */
export function markPromptOffered(state: BrowsingState): BrowsingState {
  if (state.promptPending) return state;
  return { ...state, promptPending: true, promptsThisSession: state.promptsThisSession + 1 };
}

/** Snooze end times offered in the prompt menu: 30 minutes, 1 hour, or 08:00 tomorrow (local time). */
export function snoozeOptions(now: number): Array<{ label: string; until: number }> {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return [
    { label: 'Snooze 30 min', until: now + 30 * MINUTE_MS },
    { label: 'Snooze 1 hour', until: now + SNOOZE_MS },
    { label: 'Snooze until tomorrow', until: tomorrow.getTime() },
  ];
}

export function resolvePrompt(
  state: BrowsingState,
  response: PromptResponse,
  now: number,
  snoozeUntil: number = now + SNOOZE_MS,
): { state: BrowsingState; preferencesPatch: Partial<LearnerPreferences> } {
  const next = { ...state, promptPending: false, activeMs: 0 };
  switch (response) {
    case 'snooze':
      return { state: next, preferencesPatch: { snoozeUntil } };
    case 'quiet':
      return { state: next, preferencesPatch: { quietMode: true } };
    default:
      return { state: next, preferencesPatch: {} };
  }
}

export function recordSessionFailure(state: BrowsingState, lessonId: string): BrowsingState {
  if (state.failedLessonIds.includes(lessonId)) return state;
  return { ...state, failedLessonIds: [...state.failedLessonIds, lessonId] };
}
