// When to offer an in-page prompt. Pure rules over a small shared state; the
// content script supplies the clock and the activity signals. No page content
// is read: only that the learner is active on a visible, focused tab.
import { HOUR, MINUTE } from '../engine/schedule';
import type { LearnerPreferences } from '../storage/store';

/** How often a visible tab reports activity. */
export const TICK_MS = 15_000;
/** Input within this window counts as active browsing. */
export const ACTIVE_WINDOW_MS = 60_000;
/** One tick never adds more than this, so sleep or a frozen tab is not browsing. */
export const MAX_TICK_MS = 30_000;
/** A gap this long starts a new browsing session. */
export const SESSION_GAP_MS = 30 * MINUTE;
/** At most this many prompts per browsing session. */
export const MAX_PROMPTS_PER_SESSION = 3;
/** A prompt's claim on the screen lapses if its tab disappears without releasing it. */
export const LEASE_MS = 10 * MINUTE;

export type TriggerState = {
  sessionId: string;
  sessionStartedAt: number;
  lastActiveAt: number;
  /** Active browsing time since the last prompt was resolved. */
  activeMs: number;
  promptsShown: number;
  lastPromptAt?: number;
  /** The tab currently showing the prompt, so only one prompt exists across tabs. */
  lease?: { tab: string; until: number };
  /** Items failed in micro-lessons this session; not offered again until the next session. */
  failedItemIds: Array<string>;
};

export function newTriggerState(now: number): TriggerState {
  return { sessionId: `s${now.toString(36)}`, sessionStartedAt: now, lastActiveAt: now, activeMs: 0, promptsShown: 0, failedItemIds: [] };
}

export function parseTriggerState(raw: unknown, now: number): TriggerState {
  if (typeof raw !== 'object' || raw === null) return newTriggerState(now);
  const value = raw as Partial<TriggerState>;
  if (typeof value.sessionId !== 'string' || typeof value.lastActiveAt !== 'number') return newTriggerState(now);
  return {
    sessionId: value.sessionId,
    sessionStartedAt: typeof value.sessionStartedAt === 'number' ? value.sessionStartedAt : value.lastActiveAt,
    lastActiveAt: value.lastActiveAt,
    activeMs: typeof value.activeMs === 'number' ? Math.max(0, value.activeMs) : 0,
    promptsShown: typeof value.promptsShown === 'number' ? value.promptsShown : 0,
    lastPromptAt: typeof value.lastPromptAt === 'number' ? value.lastPromptAt : undefined,
    lease:
      value.lease && typeof value.lease.tab === 'string' && typeof value.lease.until === 'number' ? value.lease : undefined,
    failedItemIds: Array.isArray(value.failedItemIds) ? value.failedItemIds.filter((id) => typeof id === 'string') : [],
  };
}

/** Adds one tick of active browsing, starting a new session after a long gap. */
export function recordActivity(state: TriggerState, now: number, elapsedMs: number): TriggerState {
  const current = now - state.lastActiveAt > SESSION_GAP_MS ? { ...newTriggerState(now), lease: state.lease } : state;
  return {
    ...current,
    lastActiveAt: now,
    activeMs: current.activeMs + Math.max(0, Math.min(elapsedMs, MAX_TICK_MS)),
  };
}

export type PromptContext = {
  /** This tab's id for the lease. */
  tab: string;
  /** The learner switched prompts on for this site. */
  siteEnabled: boolean;
  /** Focus is in a text field, or a key was pressed moments ago. */
  typing: boolean;
};

export type PromptDecision =
  | { show: true }
  | { show: false; reason: 'site-off' | 'quiet' | 'snoozed' | 'shown-elsewhere' | 'session-cap' | 'too-soon' | 'typing' };

export function decidePrompt(state: TriggerState, prefs: LearnerPreferences, now: number, context: PromptContext): PromptDecision {
  if (!context.siteEnabled) return { show: false, reason: 'site-off' };
  if (prefs.quietMode) return { show: false, reason: 'quiet' };
  if (prefs.snoozeUntil && prefs.snoozeUntil > now) return { show: false, reason: 'snoozed' };
  if (state.lease && state.lease.until > now && state.lease.tab !== context.tab) return { show: false, reason: 'shown-elsewhere' };
  if (state.lease?.tab === context.tab && state.lease.until > now) return { show: true };
  if (state.promptsShown >= MAX_PROMPTS_PER_SESSION) return { show: false, reason: 'session-cap' };
  if (state.activeMs < prefs.promptAfterMinutes * MINUTE) return { show: false, reason: 'too-soon' };
  if (context.typing) return { show: false, reason: 'typing' };
  return { show: true };
}

/** This tab shows the prompt: it takes the lease and the session count goes up. */
export function claimPrompt(state: TriggerState, tab: string, now: number): TriggerState {
  if (state.lease?.tab === tab && state.lease.until > now) return { ...state, lease: { tab, until: now + LEASE_MS } };
  return { ...state, lease: { tab, until: now + LEASE_MS }, promptsShown: state.promptsShown + 1, lastPromptAt: now };
}

/** The card is still on screen in this tab: hold the lease without counting another prompt. */
export function keepPrompt(state: TriggerState, tab: string, now: number): TriggerState {
  return { ...state, lease: { tab, until: now + LEASE_MS } };
}

/** The prompt was answered or dismissed: browsing time starts again from zero. */
export function releasePrompt(state: TriggerState, tab: string): TriggerState {
  if (state.lease && state.lease.tab !== tab) return state;
  return { ...state, lease: undefined, activeMs: 0 };
}

export function rememberFailedItems(state: TriggerState, itemIds: ReadonlyArray<string>): TriggerState {
  if (itemIds.length === 0) return state;
  return { ...state, failedItemIds: [...new Set([...state.failedItemIds, ...itemIds])] };
}

export type SnoozeChoice = '30m' | '1h' | 'tomorrow';

/** Snooze end times: 30 minutes, 1 hour, or 8:00 tomorrow (local time). */
export function snoozeEnd(choice: SnoozeChoice, now: number): number {
  if (choice === '30m') return now + 30 * MINUTE;
  if (choice === '1h') return now + HOUR;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return tomorrow.getTime();
}
