// Lets the dev scripts load the app's modules under Node's type stripping.
// The app imports its own files without the ".ts" extension, and folders by
// name (Vite and TypeScript resolve both, Node does not), so a relative import
// Node cannot resolve is tried again as "<path>.ts", then "<path>/index.ts".
//
//   node --import ./scripts/ts-resolve.mjs --experimental-strip-types scripts/generate-audio.ts
//
// module.registerHooks needs Node 22.15 or later.
import { registerHooks } from 'node:module';

// A missing file and a folder fail differently in Node.
const RETRIED = new Set(['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT']);

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const relative = /^\.{1,2}(\/|$)/.test(specifier) && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier);
      if (!RETRIED.has(error?.code) || !relative) throw error;
      const path = specifier.replace(/\/+$/, '');
      for (const candidate of [`${path}.ts`, `${path}/index.ts`]) {
        try {
          return nextResolve(candidate, context);
        } catch {
          // Try the next candidate.
        }
      }
      // Neither exists: Node's own error names what was imported.
      throw error;
    }
  },
});
