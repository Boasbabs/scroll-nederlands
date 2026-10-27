import type { Placement } from '../../src/extension/placement';
import { createPromptLoop, type PromptLoopDeps } from '../../src/extension/prompt-loop';
import { defaultPreferences, STORAGE_KEYS, type LearnerPreferences } from '../../src/storage/store';
import { LEASE_MS, TICK_MS, type TriggerState } from '../../src/trigger/browsing';
import type { NudgeController } from '../../src/ui/nudge/NudgeApp';
import { createMemoryArea } from '../fixtures/memory-storage';

const RIGHT: Placement = { side: 'right', bottom: 20, maxHeight: 520 };
const T0 = new Date(2026, 9, 27, 9).getTime();

/** One page with the prompt script: a controllable clock, focus, typing and placement. */
function setup(prefs: Partial<LearnerPreferences> = {}, area = createMemoryArea(), clock = { now: T0 }) {
  void area.set({ [STORAGE_KEYS.prefs]: { ...defaultPreferences(), onboarded: true, sites: { x: true, linkedin: false }, ...prefs } });
  const page = {
    foreground: true,
    editing: false,
    placement: RIGHT as Placement | undefined,
    shown: [] as Array<Placement>,
    moved: [] as Array<Placement>,
    hidden: 0,
    controller: undefined as NudgeController | undefined,
  };
  const deps: PromptLoopDeps = {
    area,
    site: 'x',
    tab: `tab-${Math.random()}`,
    now: () => clock.now,
    isForeground: () => page.foreground,
    isEditing: () => page.editing,
    place: () => page.placement,
    show: (placement, controller) => {
      page.shown.push(placement);
      page.controller = controller;
    },
    move: (placement) => page.moved.push(placement),
    hide: () => page.hidden++,
  };
  const loop = createPromptLoop(deps);
  /** Browses actively for `minutes`: input before every tick. */
  async function browse(minutes: number) {
    for (let elapsed = 0; elapsed < minutes * 60_000; elapsed += TICK_MS) {
      clock.now += TICK_MS;
      loop.noteInput();
      await loop.tick();
    }
  }
  const trigger = async () => (await area.get([STORAGE_KEYS.trigger]))[STORAGE_KEYS.trigger] as TriggerState;
  return { loop, page, area, clock, browse, trigger, deps };
}

describe('in-page prompt loop', () => {
  it('shows the card after the chosen minutes of active browsing, and holds the lease', async () => {
    const { page, browse, trigger, deps } = setup({ promptAfterMinutes: 8 });
    await browse(7.5);
    expect(page.shown).toEqual([]);
    await browse(0.75);
    expect(page.shown).toEqual([RIGHT]);
    const state = await trigger();
    expect(state.promptsShown).toBe(1);
    expect(state.lease?.tab).toBe(deps.tab);
  });

  it('does not count idle minutes, or minutes in a hidden or unfocused tab', async () => {
    const { loop, page, clock, browse, trigger } = setup({ promptAfterMinutes: 5 });
    await browse(2);
    // No input for 20 minutes: ticks keep coming but count nothing.
    for (let i = 0; i < 80; i++) {
      clock.now += TICK_MS;
      await loop.tick();
    }
    page.foreground = false;
    await browse(10);
    expect(page.shown).toEqual([]);
    // Reading without input still counts for the first minute (ACTIVE_WINDOW_MS): three ticks.
    expect((await trigger()).activeMs).toBe(2 * 60_000 + 3 * TICK_MS);
  });

  it('waits while the learner is typing in the page', async () => {
    const { loop, page, clock, browse } = setup({ promptAfterMinutes: 5 });
    page.editing = true;
    await browse(6);
    expect(page.shown).toEqual([]);
    page.editing = false;
    clock.now += TICK_MS;
    loop.noteKey();
    await loop.tick();
    expect(page.shown).toEqual([]);
    await browse(0.25);
    expect(page.shown).toHaveLength(1);
  });

  it('never prompts on a site that is switched off, in quiet mode or while snoozed', async () => {
    for (const prefs of [{ sites: { x: false, linkedin: true } }, { quietMode: true }, { snoozeUntil: T0 + 60 * 60_000 }]) {
      const { page, browse } = setup({ promptAfterMinutes: 5, ...prefs });
      await browse(20);
      expect(page.shown).toEqual([]);
    }
  });

  it('skips the interval when the card would cover the page', async () => {
    const { page, browse, trigger } = setup({ promptAfterMinutes: 5 });
    page.placement = undefined;
    await browse(5);
    expect(page.shown).toEqual([]);
    const state = await trigger();
    expect(state.activeMs).toBe(0);
    expect(state.promptsShown).toBe(0);
    expect(state.lease).toBeUndefined();
    page.placement = RIGHT;
    await browse(5.25);
    expect(page.shown).toEqual([RIGHT]);
  });

  it('shows one prompt across tabs: the other tab waits until the card is answered', async () => {
    const area = createMemoryArea();
    const clock = { now: T0 };
    const first = setup({ promptAfterMinutes: 5 }, area, clock);
    const second = setup({ promptAfterMinutes: 5 }, area, clock);
    await first.browse(5.25);
    expect(first.page.shown).toHaveLength(1);
    first.page.foreground = false;
    await second.browse(3);
    expect(second.page.shown).toEqual([]);

    // Not now: the lease is released and browsing time starts again from zero.
    first.page.controller!.release();
    first.page.controller!.close();
    expect(first.page.hidden).toBe(1);
    await second.browse(4.75);
    expect(second.page.shown).toEqual([]);
    await second.browse(0.5);
    expect(second.page.shown).toHaveLength(1);
    expect((await second.trigger()).promptsShown).toBe(2);
  });

  it('gives the screen back when another tab took the prompt, unless the learner is using the card', async () => {
    const area = createMemoryArea();
    const clock = { now: T0 };
    const first = setup({ promptAfterMinutes: 5 }, area, clock);
    const second = setup({ promptAfterMinutes: 5 }, area, clock);
    await first.browse(5.25);
    first.page.foreground = false;
    // The first tab stays in the background past its lease; the second prompts.
    clock.now += LEASE_MS;
    await second.browse(5.25);
    expect(second.page.shown).toHaveLength(1);

    second.page.foreground = false;
    first.page.foreground = true;
    await first.browse(0.25);
    expect(first.page.hidden).toBe(1);

    // A card the learner has touched stays where it is.
    second.page.foreground = true;
    second.loop.engage();
    clock.now += LEASE_MS;
    first.page.foreground = false;
    await second.browse(0.25);
    expect(second.page.hidden).toBe(0);
  });

  it('takes an untouched card away when quiet mode is switched on elsewhere', async () => {
    const { loop, page, area, browse, trigger } = setup({ promptAfterMinutes: 5 });
    await browse(5.25);
    await area.set({ [STORAGE_KEYS.prefs]: { ...defaultPreferences(), onboarded: true, sites: { x: true, linkedin: false }, quietMode: true } });
    await loop.recheck();
    expect(page.hidden).toBe(1);
    expect((await trigger()).lease).toBeUndefined();
  });

  it('keeps a card in use when settings change, so its own snooze toast can show', async () => {
    const { loop, page, area, browse } = setup({ promptAfterMinutes: 5 });
    await browse(5.25);
    loop.engage();
    await area.set({ [STORAGE_KEYS.prefs]: { ...defaultPreferences(), sites: { x: true, linkedin: false }, snoozeUntil: T0 + 99 * 60_000 } });
    await loop.recheck();
    expect(page.hidden).toBe(0);
  });

  it('remembers items failed in the card for this browsing session', async () => {
    const { page, browse, trigger } = setup({ promptAfterMinutes: 5 });
    await browse(5.25);
    page.controller!.rememberFailed(['s0-greet/hallo']);
    await browse(0.25);
    expect([...page.controller!.excludeItemIds()]).toEqual(['s0-greet/hallo']);
    expect((await trigger()).failedItemIds).toEqual(['s0-greet/hallo']);
  });

  it('moves an untouched card on resize, removes it when nothing fits, and keeps a card in use in its corner', async () => {
    const { loop, page, browse, trigger } = setup({ promptAfterMinutes: 5 });
    await browse(5.25);
    const left: Placement = { side: 'left', bottom: 20, maxHeight: 400 };
    page.placement = left;
    loop.relayout();
    expect(page.moved).toEqual([left]);

    page.placement = undefined;
    loop.relayout();
    expect(page.hidden).toBe(1);
    await browse(0.25);
    expect((await trigger()).lease).toBeUndefined();

    page.placement = RIGHT;
    await browse(5.25);
    loop.engage();
    page.placement = left;
    loop.relayout();
    page.placement = undefined;
    loop.relayout();
    expect(page.moved).toEqual([left]);
    expect(page.hidden).toBe(1);
  });

  it('stops at three prompts in a browsing session', async () => {
    const { page, browse } = setup({ promptAfterMinutes: 3 });
    for (let i = 0; i < 4; i++) {
      await browse(3.25);
      page.controller?.release();
      page.controller?.close();
    }
    expect(page.shown).toHaveLength(3);
  });
});
