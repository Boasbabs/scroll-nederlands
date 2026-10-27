import { createRoot, type Root } from 'react-dom/client';
import { browser } from 'wxt/browser';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import type { Activity, LearnerPreferences } from '../../src/engine/types';
import { STORAGE_KEYS } from '../../src/storage/store';
import {
  ACTIVITY_WINDOW_MS,
  accrueActiveTime,
  markPromptOffered,
  type PromptResponse,
  resolvePrompt,
  shouldOfferPrompt,
} from '../../src/trigger/browsing';
import { createBrowserEnv } from '../../src/ui/browser-env';
import { EnvProvider } from '../../src/ui/env';
import { Nudge } from '../../src/ui/nudge/Nudge';
import styles from '../../src/ui/styles.css?inline';
import { computePlacement } from './placement';

const TICK_MS = 15_000;
const TYPING_GRACE_MS = 5_000;
const ACTIVITY_EVENTS = ['scroll', 'wheel', 'pointerdown', 'mousemove', 'touchstart'] as const;

function isEditable(element: Element | null): boolean {
  if (!element) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (element as HTMLElement).isContentEditable;
}

export function startNudgeController(ctx: ContentScriptContext) {
  const env = createBrowserEnv({
    sites: undefined,
    openPractice: () => void browser.runtime.sendMessage({ type: 'open-practice' }).catch(() => undefined),
  });
  const { store, actions } = env;

  let lastInputAt = 0;
  let lastKeyAt = 0;
  let lastTickAt = Date.now();
  let host: HTMLElement | null = null;
  let root: Root | null = null;
  let mode: 'none' | 'prompt' | 'open' = 'none';
  let undoPreferences: Partial<LearnerPreferences> | null = null;

  const markActive = () => {
    lastInputAt = Date.now();
  };
  for (const type of ACTIVITY_EVENTS) ctx.addEventListener(window, type, markActive, { passive: true, capture: true });
  ctx.addEventListener(
    window,
    'keydown',
    (event) => {
      if (host && event.composedPath().includes(host)) return; // typing in our own card
      lastInputAt = lastKeyAt = Date.now();
    },
    { passive: true, capture: true },
  );

  function unmount() {
    root?.unmount();
    host?.remove();
    root = null;
    host = null;
    mode = 'none';
  }

  function mount(activity: Activity) {
    unmount();
    host = document.createElement('taalnudge-root');
    const placement = computePlacement();
    host.style.cssText = `all: initial; position: fixed; z-index: 2147483000; bottom: ${placement.bottom}px; ${placement.side}: 24px;`;
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;
    const container = document.createElement('div');
    container.className = `tn-root${placement.side === 'left' ? ' tn-left' : ''}`;
    shadow.append(style, container);
    // Keep keystrokes inside the card from reaching the site's keyboard shortcuts.
    for (const type of ['keydown', 'keyup', 'keypress'] as const) {
      container.addEventListener(type, (event) => event.stopPropagation());
    }
    document.documentElement.append(host);
    mode = 'prompt';

    async function respond(response: PromptResponse, snoozeUntil?: number) {
      const now = Date.now();
      const before = await store.getPreferences();
      let patch: Partial<LearnerPreferences> = {};
      await store.updateBrowsing(now, (state) => {
        const result = resolvePrompt(state, response, now, snoozeUntil);
        patch = result.preferencesPatch;
        return result.state;
      });
      if (Object.keys(patch).length > 0) {
        undoPreferences = { snoozeUntil: before.snoozeUntil, quietMode: before.quietMode };
        await store.updatePreferences(patch);
      }
      if (response === 'learn') mode = 'open';
    }

    root = createRoot(container);
    root.render(
      <EnvProvider env={env}>
        <Nudge
          activity={activity}
          onRespond={respond}
          onUndo={async () => {
            if (undoPreferences) await store.updatePreferences(undoPreferences);
          }}
          onClose={unmount}
        />
      </EnvProvider>,
    );
  }

  async function tick() {
    const now = Date.now();
    const elapsed = now - lastTickAt;
    lastTickAt = now;
    if (document.visibilityState !== 'visible' || !document.hasFocus()) {
      if (mode === 'prompt') unmount(); // stays pending; the next visible tab shows it
      return;
    }
    const active = now - lastInputAt < ACTIVITY_WINDOW_MS;
    const browsing = active
      ? await store.updateBrowsing(now, (state) => accrueActiveTime(state, now, elapsed))
      : await store.getBrowsing(now);
    if (mode !== 'none') return;

    const preferences = await store.getPreferences();
    if (!shouldOfferPrompt(browsing, preferences, now)) return;
    const typing = now - lastKeyAt < TYPING_GRACE_MS || isEditable(document.activeElement);
    if (typing) return; // never interrupt typing; try again next tick

    const activity = await actions.nextActivity('micro', now);
    if (activity.kind === 'done') return;
    await store.updateBrowsing(now, markPromptOffered);
    mount(activity);
  }

  const safeTick = () => void tick().catch(() => undefined); // the extension may be reloading
  ctx.setInterval(safeTick, TICK_MS);
  ctx.addEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') ctx.setTimeout(safeTick, 1500);
  });

  // Another tab answered the prompt, or quiet mode/snooze was switched on elsewhere.
  const onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area !== 'local' || mode !== 'prompt') return;
    const browsing = changes[STORAGE_KEYS.browsing]?.newValue as { promptPending?: boolean } | undefined;
    const preferences = changes[STORAGE_KEYS.preferences]?.newValue as LearnerPreferences | undefined;
    const blocked = preferences && (preferences.quietMode || (preferences.snoozeUntil ?? 0) > Date.now());
    if ((browsing && browsing.promptPending === false) || blocked) unmount();
  };
  browser.storage.onChanged.addListener(onChanged);
  ctx.onInvalidated(() => {
    browser.storage.onChanged.removeListener(onChanged);
    unmount();
  });
}
