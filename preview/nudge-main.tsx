// The in-page card on a fake X-like feed, mounted in a shadow root like the content script.
import { createRoot } from 'react-dom/client';
import themeCss from '../src/ui/theme.css?inline';
import motionCss from '../src/ui/motion.css?inline';
import componentsCss from '../src/ui/components.css?inline';
import playerCss from '../src/ui/player/player.css?inline';
import nudgeCss from '../src/ui/nudge/nudge.css?inline';
import '../src/ui/theme.css'; // @font-face must live in the host document
import { course } from '../src/curriculum';
import { createLearning } from '../src/learning/actions';
import { SpeechProvider } from '../src/ui/components/AudioButton';
import { EnvProvider } from '../src/ui/env';
import { NudgeApp } from '../src/ui/nudge/NudgeApp';
import { previewFor } from '../src/ui/nudge/preview';
import { createSfx } from '../src/ui/sfx';
import { createPreviewArea, createStore, seed } from './fake-chrome';
import { previewSpeaker } from './preview-speaker';

const { area } = createPreviewArea();
const params = new URLSearchParams(location.search);
await seed(area, params.get('state') ?? 'today', Date.now());
const store = createStore(area);
const learning = createLearning({ store, course });
let prefs = await store.readPreferences();
const preview = previewFor(course, (await learning.snapshot('micro')).next);

const host = document.getElementById('card-host')!;
const shadow = host.attachShadow({ mode: 'open' });
const style = document.createElement('style');
style.textContent = [themeCss, motionCss, componentsCss, playerCss, nudgeCss].join('\n');
const container = document.createElement('div');
container.className = 'tn-root';
Object.assign(container.style, { position: 'fixed', right: '24px', bottom: '160px', zIndex: '2147483000' });
container.style.setProperty('--tn-max-height', `${innerHeight - 160 - 24}px`);
// Keys typed inside the card never reach the page's own shortcuts.
for (const type of ['keydown', 'keyup', 'keypress']) container.addEventListener(type, (event) => event.stopPropagation());
shadow.append(style, container);

const failed = new Set<string>();
const root = createRoot(container);
function render() {
  root.render(
    <EnvProvider
      env={{
        learning,
        course,
        prefs,
        setPrefs: async (patch) => {
          prefs = await learning.updatePreferences(patch);
          render();
        },
        sfx: createSfx(() => prefs.soundEffects),
        surface: 'card',
        now: Date.now,
        openSidePanel: () => console.info('[preview] open side panel'),
      }}
    >
      <SpeechProvider speaker={previewSpeaker} rate={prefs.speechRate}>
        <NudgeApp
          preview={preview}
          controller={{
            release: () => console.info('[preview] prompt released'),
            rememberFailed: (ids) => ids.forEach((id) => failed.add(id)),
            excludeItemIds: () => failed,
            close: () => root.render(<button type="button" className="tn-btn tn-btn--secondary" onClick={render}>Show the card again</button>),
          }}
        />
      </SpeechProvider>
    </EnvProvider>,
  );
}
render();
