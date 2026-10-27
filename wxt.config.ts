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
    permissions: ['storage', 'sidePanel', 'scripting'],
    optional_host_permissions: ALL_SITE_ORIGINS,
    // Pre-generated audio clips (if any) must be playable from the in-page card.
    web_accessible_resources: [{ resources: ['audio/*'], matches: ALL_SITE_ORIGINS }],
    action: { default_title: 'Open TaalNudge' },
  },
});
