// Dev-only harness: runs the side panel and the in-page card in a normal tab,
// with localStorage standing in for chrome.storage. Not part of the extension build.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: { port: 5199, strictPort: true, hmr: false, watch: { ignored: ['**/src/curriculum/content/**'] } },
});
