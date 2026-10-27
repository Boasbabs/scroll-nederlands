import { createRoot } from 'react-dom/client';
import { App } from '../../src/ui/panel/App';
import { createBrowserEnv } from '../../src/ui/browser-env';
import { EnvProvider } from '../../src/ui/env';
import '../../src/ui/styles.css';
import './panel.css';

createRoot(document.getElementById('root')!).render(
  <EnvProvider env={createBrowserEnv()}>
    <App />
  </EnvProvider>,
);
