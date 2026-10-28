import { completeLesson, recordReviewResults } from '../../src/engine/progress';
import { MINUTE } from '../../src/engine/schedule';
import { emptyProgress } from '../../src/engine/types';
import { SITE_IDS, siteRecord } from '../../src/sites';
import { createStore, defaultPreferences, parsePreferences, parseProgress, STORAGE_KEYS } from '../../src/storage/store';
import {
  MAX_PROMPTS_PER_SESSION,
  SESSION_GAP_MS,
  claimPrompt,
  decidePrompt,
  newTriggerState,
  parseTriggerState,
  recordActivity,
  releasePrompt,
  rememberFailedItems,
  snoozeEnd,
  type PromptContext,
} from '../../src/trigger/browsing';
import { makeCourse } from '../fixtures/curriculum';
import { createMemoryArea } from '../fixtures/memory-storage';

const T0 = Date.UTC(2026, 9, 27, 9);
const index = makeCourse();

describe('store', () => {
  it('keeps progress across closing and reopening the extension', async () => {
    const area = createMemoryArea();
    await createStore(area).updateProgress((progress) => completeLesson(progress, index, 'x0-a-hello', [], 'focused', T0));
    // A new page (e.g. the side panel reopened after a browser restart) reads the same state.
    const reopened = createStore(area);
    const progress = await reopened.readProgress();
    expect(progress.lessons['x0-a-hello']?.completedAt).toBe(T0);
    expect(progress.items['x0-a-hello/hallo-daar']?.dueAt).toBeGreaterThan(T0);
  });

  it('shares one state between the side panel and an in-page card', async () => {
    const area = createMemoryArea();
    const panel = createStore(area);
    const page = createStore(area);
    await panel.updateProgress((progress) => completeLesson(progress, index, 'x0-a-hello', [], 'focused', T0));
    await page.updateProgress((progress) =>
      recordReviewResults(progress, [{ exerciseId: 'q', stage: 'recognition', itemIds: ['x0-a-hello/hallo-daar'], correct: false }], 'micro', T0 + MINUTE),
    );
    const seenByPanel = await panel.readProgress();
    expect(seenByPanel.lessons['x0-a-hello']).toBeDefined();
    expect(seenByPanel.items['x0-a-hello/hallo-daar']?.relearning).toBe(true);
  });

  it('queues writes from one page so none are lost', async () => {
    const store = createStore(createMemoryArea());
    await Promise.all(
      ['x0-a-hello', 'x0-a-thanks', 'x0-a-bye'].map((id, i) =>
        store.updateProgress((progress) => completeLesson(progress, index, id, [], 'focused', T0 + i)),
      ),
    );
    expect(Object.keys((await store.readProgress()).lessons).sort()).toEqual(['x0-a-bye', 'x0-a-hello', 'x0-a-thanks']);
  });

  it('falls back to defaults for missing or malformed data', async () => {
    expect(parseProgress(undefined)).toEqual(emptyProgress());
    expect(parseProgress({ version: 1, lessons: { a: {} } })).toEqual(emptyProgress());
    const parsed = parseProgress({ version: 2, items: { ok: { stage: 'recognition', dueAt: 5 }, bad: { stage: 'nope', dueAt: 1 } } });
    expect(Object.keys(parsed.items)).toEqual(['ok']);
    expect(parsePreferences({ promptAfterMinutes: 999, speechRate: 'fast' })).toMatchObject({ promptAfterMinutes: 60, speechRate: 1 });
    expect(parsePreferences(null)).toEqual(defaultPreferences());
  });

  it('keeps a switch for every site, off unless stored as on', () => {
    expect(defaultPreferences().sites).toEqual(siteRecord());
    expect(Object.keys(defaultPreferences().sites)).toEqual([...SITE_IDS]);
    // Choices saved before the site list grew (X and LinkedIn only) keep their meaning; new sites start off.
    expect(parsePreferences({ sites: { x: true, linkedin: false, myspace: true } }).sites).toEqual(siteRecord(['x']));
    expect(parsePreferences({ sites: { youtube: true, nos: 'yes' } }).sites).toEqual(siteRecord(['youtube']));
  });

  it('updates preferences and resets progress without touching preferences', async () => {
    const area = createMemoryArea();
    const store = createStore(area);
    await store.updatePreferences({ quietMode: true, sites: siteRecord(['x']) });
    await store.updateProgress((progress) => completeLesson(progress, index, 'x0-a-hello', [], 'focused', T0));
    await store.resetProgress();
    expect(await store.readProgress()).toEqual(emptyProgress());
    expect((area.dump()[STORAGE_KEYS.prefs] as { quietMode: boolean }).quietMode).toBe(true);
  });
});

describe('browsing prompt rules', () => {
  const prefs = { ...defaultPreferences(), sites: siteRecord(['x', 'linkedin']) };
  const context: PromptContext = { tab: 'tab-1', siteEnabled: true, typing: false, watching: false };

  function browse(minutes: number, start = newTriggerState(T0)) {
    let state = start;
    for (let i = 1; i <= minutes * 4; i++) state = recordActivity(state, state.lastActiveAt + 15_000, 15_000);
    return state;
  }

  it('offers a prompt after about eight minutes of active browsing, not before', () => {
    expect(decidePrompt(browse(7), prefs, T0, context)).toEqual({ show: false, reason: 'too-soon' });
    const state = browse(8);
    expect(decidePrompt(state, prefs, state.lastActiveAt, context)).toEqual({ show: true });
  });

  it('follows a custom threshold', () => {
    const state = browse(8);
    expect(decidePrompt(state, { ...prefs, promptAfterMinutes: 10 }, state.lastActiveAt, context)).toMatchObject({ show: false });
  });

  it('does not count sleep or a frozen tab as browsing', () => {
    const state = recordActivity(newTriggerState(T0), T0 + 20 * MINUTE, 20 * MINUTE);
    expect(state.activeMs).toBe(30_000);
  });

  it('waits while the learner is typing', () => {
    const state = browse(9);
    expect(decidePrompt(state, prefs, state.lastActiveAt, { ...context, typing: true })).toEqual({ show: false, reason: 'typing' });
  });

  it('waits while the learner watches a video or the page is in full screen', () => {
    const state = browse(9);
    expect(decidePrompt(state, prefs, state.lastActiveAt, { ...context, watching: true })).toEqual({ show: false, reason: 'watching' });
  });

  it('respects quiet mode, snooze and sites that are switched off', () => {
    const state = browse(9);
    const now = state.lastActiveAt;
    expect(decidePrompt(state, { ...prefs, quietMode: true }, now, context)).toMatchObject({ reason: 'quiet' });
    expect(decidePrompt(state, { ...prefs, snoozeUntil: now + MINUTE }, now, context)).toMatchObject({ reason: 'snoozed' });
    expect(decidePrompt(state, { ...prefs, snoozeUntil: now - 1 }, now, context)).toEqual({ show: true });
    expect(decidePrompt(state, prefs, now, { ...context, siteEnabled: false })).toMatchObject({ reason: 'site-off' });
  });

  it('shows only one prompt across tabs, and starts counting again after it is dismissed', () => {
    let state = browse(9);
    const now = state.lastActiveAt;
    state = claimPrompt(state, 'tab-1', now);
    expect(decidePrompt(state, prefs, now, { ...context, tab: 'tab-2' })).toMatchObject({ reason: 'shown-elsewhere' });
    expect(decidePrompt(state, prefs, now, context)).toEqual({ show: true });
    state = releasePrompt(state, 'tab-1');
    expect(state.activeMs).toBe(0);
    expect(decidePrompt(state, prefs, now, { ...context, tab: 'tab-2' })).toMatchObject({ reason: 'too-soon' });
  });

  it('caps prompts per browsing session and resets after a long break', () => {
    let state = newTriggerState(T0);
    for (let i = 0; i < MAX_PROMPTS_PER_SESSION; i++) {
      state = browse(9, state);
      state = releasePrompt(claimPrompt(state, 'tab-1', state.lastActiveAt), 'tab-1');
    }
    state = browse(9, state);
    expect(decidePrompt(state, prefs, state.lastActiveAt, context)).toMatchObject({ reason: 'session-cap' });
    state = rememberFailedItems(state, ['a/b']);
    const later = recordActivity(state, state.lastActiveAt + SESSION_GAP_MS + 1, 15_000);
    expect(later.promptsShown).toBe(0);
    expect(later.failedItemIds).toEqual([]);
    expect(later.sessionId).not.toBe(state.sessionId);
  });

  it('computes snooze end times', () => {
    expect(snoozeEnd('30m', T0)).toBe(T0 + 30 * MINUTE);
    expect(snoozeEnd('1h', T0)).toBe(T0 + 60 * MINUTE);
    const tomorrow = new Date(snoozeEnd('tomorrow', T0));
    expect(tomorrow.getHours()).toBe(8);
    expect(tomorrow.getTime()).toBeGreaterThan(T0);
  });

  it('parses stored trigger state defensively', () => {
    expect(parseTriggerState('junk', T0)).toEqual(newTriggerState(T0));
    const state = parseTriggerState({ ...newTriggerState(T0), failedItemIds: ['a', 3] }, T0);
    expect(state.failedItemIds).toEqual(['a']);
  });
});
