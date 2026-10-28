// Side panel in a normal tab. ?state=fresh|today|caughtup|path picks a seeded learner;
// &lesson=<id> puts that lesson next on the path.
import { createRoot } from 'react-dom/client';
import '../src/ui/theme.css';
import '../src/ui/motion.css';
import '../src/ui/components.css';
import '../src/ui/player/player.css';
import '../src/ui/panel/panel.css';
import '../src/ui/nudge/nudge.css'; // the onboarding shows the real prompt card
import { course } from '../src/curriculum';
import { downscaleToWebp } from '../src/images/downscale';
import { bundledImages } from '../src/images/manifest';
import { createIndexedDbPictures } from '../src/images/own';
import { createPictureSource } from '../src/images/pictures';
import { createLearning } from '../src/learning/actions';
import { PanelApp } from '../src/ui/panel/PanelApp';
import { createPreviewArea, createStore, fakePermissions, seed } from './fake-chrome';
import { previewSpeaker } from './preview-speaker';

const { area, subscribe } = createPreviewArea();
const state = new URLSearchParams(location.search).get('state') ?? 'today';
await seed(area, state, Date.now(), new URLSearchParams(location.search).get('lesson'));
const store = createStore(area);
const learning = createLearning({ store, course, images: bundledImages });
// The preview tab's own IndexedDB stands in for the extension's.
const pictures = createPictureSource({ course, images: bundledImages, blobs: createIndexedDbPictures(indexedDB), record: store.setPicture, downscale: downscaleToWebp });

createRoot(document.getElementById('root')!).render(
  // The transform makes this frame the containing block for fixed dialogs, as the real panel's viewport is.
  <div style={{ width: Number(new URLSearchParams(location.search).get('w') ?? 380), height: '100vh', margin: '0 auto', boxShadow: '0 0 0 1px #e2e4ea', transform: 'translateZ(0)' }}>
    <PanelApp deps={{ learning, course, speaker: previewSpeaker, permissions: fakePermissions(), subscribe, canRecord: true, pictures }} />
  </div>,
);
