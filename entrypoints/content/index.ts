import { startNudgeController } from './controller';

// Registered at runtime by the background script, only for sites the learner granted.
export default defineContentScript({
  registration: 'runtime',
  main(ctx) {
    const flag = '__taalnudgeLoaded';
    const scope = window as unknown as Record<string, boolean>;
    if (scope[flag]) return;
    scope[flag] = true;
    startNudgeController(ctx);
  },
});
