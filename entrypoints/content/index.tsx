// The in-page prompt on the learner's sites (src/sites.ts). The background worker
// registers this script at runtime, only for the sites the learner granted.
import { createRoot, type Root } from 'react-dom/client';
import type { PublicPath } from 'wxt/browser';
import componentsCss from '../../src/ui/components.css?inline';
import motionCss from '../../src/ui/motion.css?inline';
import nudgeCss from '../../src/ui/nudge/nudge.css?inline';
import playerCss from '../../src/ui/player/player.css?inline';
import themeCss from '../../src/ui/theme.css?inline';
import { createSpeaker } from '../../src/audio/speech';
import { course } from '../../src/curriculum';
import { clipManifest } from '../../src/extension/clips';
import { isClipReply, type ExtensionMessage } from '../../src/extension/messages';
import { CARD_INSET, isChatPage, isWatching, measureHost, placeCard, type Placement } from '../../src/extension/placement';
import { createPromptLoop } from '../../src/extension/prompt-loop';
import { bundledImages } from '../../src/images/manifest';
import { createRemotePictures } from '../../src/images/pictures';
import { createLearning } from '../../src/learning/actions';
import { siteForHost } from '../../src/sites';
import { createStore, STORAGE_KEYS, type LearnerPreferences } from '../../src/storage/store';
import { TICK_MS } from '../../src/trigger/browsing';
import { SpeechProvider } from '../../src/ui/components/AudioButton';
import { EnvProvider } from '../../src/ui/env';
import { NudgeApp, type NudgeController } from '../../src/ui/nudge/NudgeApp';
import { previewFor } from '../../src/ui/nudge/preview';
import { createSfx } from '../../src/ui/sfx';

const INPUT_EVENTS = ['pointerdown', 'pointermove', 'wheel', 'scroll', 'touchstart'] as const;

/** The CSS for the shadow root. Its @font-face rules point at the extension's fonts, and WXT moves them to the page (fonts in a shadow root do not load). */
function cardCss(fontsUrl: string): string {
  return [themeCss, motionCss, componentsCss, playerCss, nudgeCss]
    .join('\n')
    .replace(/url\((['"]?)\/fonts\//g, `url($1${fontsUrl}`);
}

function isEditable(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
}

function send(message: ExtensionMessage): Promise<unknown> {
  return browser.runtime.sendMessage(message);
}

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'manual',
  async main(ctx) {
    const site = siteForHost(location.hostname);
    if (!site) return;

    const area = browser.storage.local;
    const store = createStore(area);
    const learning = createLearning({ store, course, images: bundledImages });
    // Pictures come from the background worker as data URLs: none of the extension's files are exposed to the site.
    const pictures = createRemotePictures(course, bundledImages, send);
    const speaker = createSpeaker({
      synth: typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis,
      createUtterance: (text) => new SpeechSynthesisUtterance(text),
      // Clips play in the offscreen document: host pages can block extension media.
      playClip: async (path, rate) => {
        const reply = await send({ type: 'tn:play-clip', path, rate });
        if (!isClipReply(reply) || !reply.ok) throw new Error(isClipReply(reply) && !reply.ok ? reply.error : 'No clip reply');
      },
      stopClip: () => void send({ type: 'tn:stop-clip' }).catch(() => undefined),
      manifest: clipManifest,
    });
    let prefs: LearnerPreferences = await store.readPreferences();

    const ui = await createShadowRootUi<Root>(ctx, {
      name: 'taalnudge-card',
      position: 'inline',
      anchor: 'body',
      // Keys typed in the card never reach the site's own shortcuts.
      isolateEvents: true,
      css: cardCss(browser.runtime.getURL('/fonts/' as PublicPath)),
      onMount: (container) => createRoot(container),
      onRemove: (root) => root?.unmount(),
    });
    // Pressing, focusing or typing in the card makes it the learner's: it is never moved away or removed for them.
    for (const type of ['pointerdown', 'focusin', 'keydown']) ui.shadowHost.addEventListener(type, () => loop.engage());

    function applyPlacement(placement: Placement) {
      const container = ui.uiContainer;
      container.className = 'tn-root tn-card-host';
      container.dataset.side = placement.side;
      Object.assign(container.style, {
        position: 'fixed',
        zIndex: '2147483000',
        bottom: `${placement.bottom}px`,
        right: placement.side === 'right' ? `${CARD_INSET}px` : '',
        left: placement.side === 'left' ? `${CARD_INSET}px` : '',
      });
      container.style.setProperty('--tn-max-height', `${placement.maxHeight}px`);
    }

    async function show(placement: Placement, controller: NudgeController) {
      const preview = previewFor(course, (await learning.snapshot('micro', controller.excludeItemIds())).next);
      if (!loop.isShown()) return;
      ui.mount();
      applyPlacement(placement);
      const render = () =>
        ui.mounted?.render(
          <EnvProvider
            env={{
              learning,
              course,
              prefs,
              setPrefs: async (patch) => {
                prefs = await learning.updatePreferences(patch);
                render();
              },
              sfx,
              surface: 'card',
              now: Date.now,
              // Sent straight from the click, so Chrome still sees the user gesture.
              openSidePanel: () => void send({ type: 'tn:open-side-panel' }).catch(() => undefined),
              pictures,
            }}
          >
            <SpeechProvider speaker={speaker} rate={prefs.speechRate}>
              <NudgeApp preview={preview} controller={controller} />
            </SpeechProvider>
          </EnvProvider>,
        );
      render();
    }

    const sfx = createSfx(() => prefs.soundEffects);
    const loop = createPromptLoop({
      area,
      site,
      tab: Math.random().toString(36).slice(2),
      now: Date.now,
      isForeground: () => document.visibilityState === 'visible' && document.hasFocus(),
      isEditing: () => document.activeElement !== ui.shadowHost && isEditable(document.activeElement),
      isWatching: () => isWatching(document),
      place: () => (isChatPage(site, location.pathname) ? undefined : placeCard(measureHost(document, site, ui.shadowHost))),
      show: (placement, controller) => void show(placement, controller),
      move: applyPlacement,
      hide: () => {
        speaker.stop();
        ui.remove();
      },
    });

    for (const type of INPUT_EVENTS) ctx.addEventListener(window, type, () => loop.noteInput(), { capture: true, passive: true });
    ctx.addEventListener(
      window,
      'keydown',
      (event) => {
        if (!event.composedPath().includes(ui.shadowHost)) loop.noteKey();
      },
      { capture: true, passive: true },
    );
    ctx.addEventListener(window, 'resize', () => loop.relayout());
    // Most of these sites change pages without reloading.
    ctx.addEventListener(window, 'wxt:locationchange', () => loop.relayout());

    const onChanged = (changes: Record<string, unknown>, areaName: string) => {
      if (areaName !== 'local' || !(STORAGE_KEYS.prefs in changes)) return;
      void store.readPreferences().then((latest) => {
        prefs = latest;
        return loop.recheck();
      });
    };
    browser.storage.onChanged.addListener(onChanged);
    // After an update the old script in an open tab has no browser.storage, and no changes reach it.
    ctx.onInvalidated(() => browser.storage?.onChanged.removeListener(onChanged));

    // The extension may be reloading; the next tick tries again.
    ctx.setInterval(() => void loop.tick().catch(() => undefined), TICK_MS);
  },
});
