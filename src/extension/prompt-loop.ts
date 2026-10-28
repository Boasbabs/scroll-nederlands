// The in-page prompt's clock. Every tick on a visible, focused tab it counts active
// browsing, asks the rules in src/trigger/browsing.ts whether to prompt, and holds the
// cross-tab lease while the card is up. The content script supplies the page parts.
import type { SiteId } from '../sites';
import { parsePreferences, STORAGE_KEYS, type LearnerPreferences, type StorageAreaLike } from '../storage/store';
import {
  ACTIVE_WINDOW_MS,
  claimPrompt,
  decidePrompt,
  keepPrompt,
  parseTriggerState,
  recordActivity,
  releasePrompt,
  rememberFailedItems,
  type TriggerState,
} from '../trigger/browsing';
import type { NudgeController } from '../ui/nudge/NudgeApp';
import type { Placement } from './placement';

/** A key pressed this recently still counts as typing. */
export const TYPING_GRACE_MS = 5_000;

export type PromptLoopDeps = {
  area: StorageAreaLike;
  site: SiteId;
  /** This page's id for the cross-tab lease. */
  tab: string;
  now: () => number;
  /** The tab is visible and has focus. */
  isForeground: () => boolean;
  /** Focus is in one of the page's text fields or editors. */
  isEditing: () => boolean;
  /** The page is in full screen, or a long video plays with sound. */
  isWatching: () => boolean;
  /** Where the card fits now, or undefined when it would cover something. */
  place: () => Placement | undefined;
  show: (placement: Placement, controller: NudgeController) => void;
  move: (placement: Placement) => void;
  hide: () => void;
};

export function createPromptLoop(deps: PromptLoopDeps) {
  let lastInputAt = Number.NEGATIVE_INFINITY;
  let lastKeyAt = Number.NEGATIVE_INFINITY;
  let lastTickAt = deps.now();
  let shown = false;
  let side: Placement['side'] | undefined;
  /** The learner has touched the card, so it is theirs now: it is never taken away. */
  let engaged = false;
  let failed: ReadonlySet<string> = new Set();
  let queue: Promise<unknown> = Promise.resolve();

  /** Read-modify-write of the shared trigger state, one at a time within this page. */
  function updateTrigger(change: (state: TriggerState, now: number) => TriggerState): Promise<TriggerState> {
    const task = async () => {
      const now = deps.now();
      const stored = await deps.area.get([STORAGE_KEYS.trigger]);
      const next = change(parseTriggerState(stored[STORAGE_KEYS.trigger], now), now);
      await deps.area.set({ [STORAGE_KEYS.trigger]: next });
      failed = new Set(next.failedItemIds);
      return next;
    };
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  async function readPreferences(): Promise<LearnerPreferences> {
    const stored = await deps.area.get([STORAGE_KEYS.prefs]);
    return parsePreferences(stored[STORAGE_KEYS.prefs]);
  }

  function close() {
    if (!shown) return;
    shown = false;
    engaged = false;
    deps.hide();
  }

  const controller: NudgeController = {
    release: () => void updateTrigger((state) => releasePrompt(state, deps.tab)),
    rememberFailed: (itemIds) => void updateTrigger((state) => rememberFailedItems(state, itemIds)),
    excludeItemIds: () => failed,
    close,
  };

  function blocked(prefs: LearnerPreferences, now: number): boolean {
    return !prefs.sites[deps.site] || prefs.quietMode || (prefs.snoozeUntil ?? 0) > now;
  }

  /** One step of the clock; `count` is false when only re-checking after a settings change. */
  async function step(count: boolean) {
    const now = deps.now();
    const elapsed = now - lastTickAt;
    if (count) lastTickAt = now;
    // Hidden or unfocused tabs neither count nor prompt.
    if (!deps.isForeground()) return;
    const prefs = await readPreferences();
    const siteEnabled = prefs.sites[deps.site];
    const active = count && siteEnabled && now - lastInputAt < ACTIVE_WINDOW_MS;
    const typing = deps.isEditing() || now - lastKeyAt < TYPING_GRACE_MS;
    const watching = deps.isWatching();
    let action: { show: Placement } | 'hide' | undefined;

    await updateTrigger((stored, at) => {
      const state = active ? recordActivity(stored, at, elapsed) : stored;
      if (shown) {
        if (engaged) return keepPrompt(state, deps.tab, at);
        // Quiet mode, a snooze or the site switched off elsewhere: the untouched card goes.
        if (blocked(prefs, at)) {
          action = 'hide';
          return releasePrompt(state, deps.tab);
        }
        const lease = state.lease;
        if (!lease || lease.until <= at || lease.tab === deps.tab) return keepPrompt(state, deps.tab, at);
        // Another tab took the prompt while this one was away.
        action = 'hide';
        return state;
      }
      if (!decidePrompt(state, prefs, at, { tab: deps.tab, siteEnabled, typing, watching }).show) return state;
      const placement = deps.place();
      // Every corner would cover the feed or the host's own UI: skip this interval.
      if (!placement) return releasePrompt(state, deps.tab);
      action = { show: placement };
      return claimPrompt(state, deps.tab, at);
    });

    if (action === 'hide') close();
    else if (action) {
      shown = true;
      engaged = false;
      side = action.show.side;
      deps.show(action.show, controller);
    }
  }

  return {
    /** Every TICK_MS. */
    tick: () => step(true),
    /** Settings changed elsewhere (quiet mode, snooze, sites). */
    recheck: () => step(false),
    /** Pointer, wheel or scroll input on the page. */
    noteInput() {
      lastInputAt = deps.now();
    },
    /** A key pressed in the page (not in the card). */
    noteKey() {
      lastInputAt = lastKeyAt = deps.now();
    },
    /** The learner pressed, focused or typed in the card. */
    engage() {
      if (shown) engaged = true;
    },
    /**
     * The window was resized or the page changed: move an untouched card or take it
     * away if it no longer fits. A card in use only adjusts its height in its corner.
     */
    relayout() {
      if (!shown) return;
      const placement = deps.place();
      if (placement && (!engaged || placement.side === side)) {
        side = placement.side;
        deps.move(placement);
      } else if (!placement && !engaged) {
        controller.release();
        close();
      }
    },
    isShown: () => shown,
  };
}

export type PromptLoop = ReturnType<typeof createPromptLoop>;
