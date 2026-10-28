// The side panel: focused practice, the course, progress and settings.
import { createRoot } from 'react-dom/client';
import type { PublicPath } from 'wxt/browser';
import '../../src/ui/theme.css';
import '../../src/ui/motion.css';
import '../../src/ui/components.css';
import '../../src/ui/player/player.css';
import '../../src/ui/panel/panel.css';
import '../../src/ui/nudge/nudge.css'; // the onboarding shows the real prompt card
import { createSpeaker } from '../../src/audio/speech';
import { course } from '../../src/curriculum';
import { createClipPlayer } from '../../src/extension/clip-player';
import { clipManifest } from '../../src/extension/clips';
import { downscaleToWebp } from '../../src/images/downscale';
import { bundledImages } from '../../src/images/manifest';
import { createIndexedDbPictures } from '../../src/images/own';
import { createPictureSource } from '../../src/images/pictures';
import { createLearning } from '../../src/learning/actions';
import { originsFor, SITES } from '../../src/sites';
import { createStore, STORAGE_KEYS } from '../../src/storage/store';
import type { SitePermissions } from '../../src/ui/env';
import { PanelApp } from '../../src/ui/panel/PanelApp';

const store = createStore(browser.storage.local);
const learning = createLearning({ store, course, images: bundledImages });
const pictures = createPictureSource({
  course,
  images: bundledImages,
  blobs: createIndexedDbPictures(indexedDB),
  record: store.setPicture,
  downscale: downscaleToWebp,
});

const clips = createClipPlayer((path) => browser.runtime.getURL(`/${path}` as PublicPath));
const speaker = createSpeaker({
  synth: typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis,
  createUtterance: (text) => new SpeechSynthesisUtterance(text),
  playClip: clips.play,
  stopClip: clips.stop,
  manifest: clipManifest,
});

const permissions: SitePermissions = {
  // Called straight from the click handler, so Chrome shows its dialog.
  request: (sites) => browser.permissions.request({ origins: originsFor(sites) }),
  async granted() {
    const origins = (await browser.permissions.getAll()).origins ?? [];
    return Object.fromEntries(SITES.map((site) => [site.id, site.origins.every((origin) => origins.includes(origin))])) as Awaited<
      ReturnType<SitePermissions['granted']>
    >;
  },
  async revoke(sites) {
    await browser.permissions.remove({ origins: originsFor(sites) });
  },
};

/** The in-page card saves answers and settings too; the panel refreshes when they change. */
function subscribe(onChange: () => void): () => void {
  const listener = (changes: Record<string, unknown>, areaName: string) => {
    if (areaName === 'local' && (STORAGE_KEYS.progress in changes || STORAGE_KEYS.prefs in changes)) onChange();
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

createRoot(document.getElementById('root')!).render(
  <PanelApp deps={{ learning, course, speaker, permissions, subscribe, canRecord: true, pictures }} />,
);
