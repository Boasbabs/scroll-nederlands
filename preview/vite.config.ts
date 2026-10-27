// Dev-only harness: renders the extension UI in a normal tab with in-memory
// storage and the browser's own speech, for visual checks without Chrome APIs.
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  plugins: [react()],
  server: { port: 5199, strictPort: true },
});
