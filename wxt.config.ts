import { defineConfig } from 'wxt';
import { ALL_SITE_ORIGINS } from './src/sites';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // A visible folder, so Chrome's "Load unpacked" dialog can find it.
  outDir: 'dist',
  manifest: {
    name: 'TaalNudge — Dutch A0 to A2',
    short_name: 'TaalNudge',
    description: 'Short Dutch lessons and spaced reviews while you browse X and LinkedIn.',
    // sidePanel.open() and runtime.getContexts() need Chrome 116.
    minimum_chrome_version: '116',
    permissions: ['storage', 'sidePanel', 'scripting', 'offscreen'],
    // Requested per site from the side panel; the in-page script is registered only for granted sites.
    optional_host_permissions: ALL_SITE_ORIGINS,
    // The in-page card's fonts load into the host page. Its clips play in the offscreen
    // document, an extension page, so audio does not need to be exposed to the sites.
    web_accessible_resources: [{ resources: ['fonts/*'], matches: ALL_SITE_ORIGINS }],
    action: { default_title: 'Open TaalNudge' },
  },
});
