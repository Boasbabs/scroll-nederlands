import { describe, expect, it } from 'vitest';
import { MINUTE_MS } from '../../src/engine/schedule';
import { createLearningStore, DEFAULT_PREFERENCES, parsePreferences, parseProgress } from '../../src/storage/store';
import {
  accrueActiveTime,
  MAX_PROMPTS_PER_SESSION,
  markPromptOffered,
  newBrowsingState,
  resolvePrompt,
  SESSION_GAP_MS,
  shouldOfferPrompt,
} from '../../src/trigger/browsing';
import { createMemoryArea } from '../fixtures/memory-storage';

const T0 = Date.UTC(2026, 0, 5, 9, 0, 0);

describe('persistence', () => {
  it('serialises quick successive writes from one context', async () => {
    const store = createLearningStore(createMemoryArea());
    await Promise.all(
      ['a1', 'a2', 'a3'].map((id, i) => store.updateProgress((p) => ({ ...p, completedLessons: { ...p.completedLessons, [id]: i } }))),
    );
    expect(Object.keys((await store.getProgress()).completedLessons)).toEqual(['a1', 'a2', 'a3']);
  });

  it('falls back to safe defaults for missing or corrupt data', () => {
    expect(parseProgress(undefined).items).toEqual({});
    expect(parseProgress({ version: 99 }).completedLessons).toEqual({});
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ promptAfterMinutes: 0.2, speechRate: 9 })).toMatchObject({ promptAfterMinutes: 2, speechRate: 1.2 });
  });
});

describe('browsing prompt rules', () => {
  const prefs = { ...DEFAULT_PREFERENCES };

  function browseFor(minutes: number, start = T0) {
    let state = newBrowsingState(start);
    for (let t = 1; t <= minutes * 4; t++) state = accrueActiveTime(state, start + t * 15_000, 15_000);
    return state;
  }

  it('offers a prompt after the configured minutes of active browsing', () => {
    expect(shouldOfferPrompt(browseFor(7), prefs, T0 + 7 * MINUTE_MS)).toBe(false);
    expect(shouldOfferPrompt(browseFor(8), prefs, T0 + 8 * MINUTE_MS)).toBe(true);
    expect(shouldOfferPrompt(browseFor(3), { ...prefs, promptAfterMinutes: 3 }, T0 + 3 * MINUTE_MS)).toBe(true);
  });

  it('caps a single tick so sleep or long idle gaps do not count as browsing', () => {
    const state = accrueActiveTime(newBrowsingState(T0), T0 + 10 * MINUTE_MS, 10 * MINUTE_MS);
    expect(state.activeMs).toBe(15_000);
  });

  it('"Not now" resets the timer and the prompt waits for another full interval', () => {
    const now = T0 + 8 * MINUTE_MS;
    const offered = markPromptOffered(browseFor(8));
    const { state, preferencesPatch } = resolvePrompt(offered, 'not-now', now);
    expect(preferencesPatch).toEqual({});
    expect(state.promptPending).toBe(false);
    expect(shouldOfferPrompt(state, prefs, now + 1)).toBe(false);
  });

  it('snooze blocks prompts for an hour', () => {
    const now = T0 + 8 * MINUTE_MS;
    const { preferencesPatch } = resolvePrompt(markPromptOffered(browseFor(8)), 'snooze', now);
    const snoozed = { ...prefs, ...preferencesPatch };
    const busy = browseFor(20, now);
    expect(shouldOfferPrompt(busy, snoozed, now + 30 * MINUTE_MS)).toBe(false);
    expect(shouldOfferPrompt(busy, snoozed, now + 61 * MINUTE_MS)).toBe(true);
  });

  it('quiet mode blocks prompts until it is turned off', () => {
    const { preferencesPatch } = resolvePrompt(markPromptOffered(browseFor(8)), 'quiet', T0);
    expect(preferencesPatch).toEqual({ quietMode: true });
    expect(shouldOfferPrompt(browseFor(30), { ...prefs, quietMode: true }, T0 + 30 * MINUTE_MS)).toBe(false);
  });

  it('never stacks prompts and stops after a few per session', () => {
    let state = browseFor(8);
    state = markPromptOffered(markPromptOffered(state)); // two tabs trying at once
    expect(state.promptsThisSession).toBe(1);
    for (let i = 1; i < MAX_PROMPTS_PER_SESSION; i++) {
      state = resolvePrompt(state, 'not-now', T0).state;
      state = markPromptOffered({ ...state, activeMs: 8 * MINUTE_MS });
    }
    state = resolvePrompt(state, 'learn', T0).state;
    expect(shouldOfferPrompt({ ...state, activeMs: 60 * MINUTE_MS }, prefs, T0)).toBe(false);
  });

  it('starts a new session after a long break', () => {
    const state = { ...browseFor(8), promptsThisSession: MAX_PROMPTS_PER_SESSION, failedLessonIds: ['a1'] };
    const later = accrueActiveTime(state, T0 + 8 * MINUTE_MS + SESSION_GAP_MS + 1, 15_000);
    expect(later.promptsThisSession).toBe(0);
    expect(later.failedLessonIds).toEqual([]);
    expect(later.activeMs).toBe(15_000);
  });
});

describe('snooze options', () => {
  it('offers 30 minutes, an hour and tomorrow morning', async () => {
    const { snoozeOptions } = await import('../../src/trigger/browsing');
    const now = new Date(2026, 0, 5, 21, 0).getTime();
    const [half, hour, tomorrow] = snoozeOptions(now);
    expect(half!.until - now).toBe(30 * MINUTE_MS);
    expect(hour!.until - now).toBe(60 * MINUTE_MS);
    expect(new Date(tomorrow!.until)).toEqual(new Date(2026, 0, 6, 8, 0));
  });
});
