// Mounts the real Nudge in a shadow root on a fake feed page, like the content script does.
import { createRoot } from 'react-dom/client';
import { computePlacement } from '../entrypoints/content/placement';
import { resolvePrompt } from '../src/trigger/browsing';
import { EnvProvider } from '../src/ui/env';
import { Nudge } from '../src/ui/nudge/Nudge';
import styles from '../src/ui/styles.css?inline';
import { createPreviewEnv } from './preview-env';

const feed = document.getElementById('feed')!;
for (let i = 0; i < 12; i++) feed.insertAdjacentHTML('beforeend', '<article class="post"><div style="width:40%"></div><div></div><div style="width:80%"></div></article>');

const env = createPreviewEnv();

async function show() {
  const activity = await env.actions.nextActivity('micro', env.now());
  if (activity.kind === 'done') return;
  const host = document.createElement('taalnudge-root');
  const placement = computePlacement();
  host.style.cssText = `all: initial; position: fixed; z-index: 2147483000; bottom: ${placement.bottom}px; ${placement.side}: 24px;`;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = styles;
  const container = document.createElement('div');
  container.className = 'tn-root';
  shadow.append(style, container);
  document.documentElement.append(host);
  const root = createRoot(container);
  const close = () => {
    root.unmount();
    host.remove();
  };
  root.render(
    <EnvProvider env={env}>
      <Nudge
        activity={activity}
        onRespond={async (response, until) => {
          const now = env.now();
          await env.store.updateBrowsing(now, (s) => resolvePrompt(s, response, now, until).state);
        }}
        onUndo={async () => undefined}
        onClose={close}
      />
    </EnvProvider>,
  );
}

void show();
