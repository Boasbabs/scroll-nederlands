import { createSpeaker } from '../src/audio/speech';
import { createLearningActions } from '../src/learning/actions';
import { createLearningStore, type StorageAreaLike } from '../src/storage/store';
import type { LearningEnv } from '../src/ui/env';
import type { SiteId } from '../src/sites';

const listeners = new Set<() => void>();
const PREFIX = 'taalnudge-preview:';

const area: StorageAreaLike = {
  async get(keys) {
    return Object.fromEntries(
      keys.flatMap((key) => {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? [] : [[key, JSON.parse(raw)]];
      }),
    );
  },
  async set(items) {
    for (const [key, value] of Object.entries(items)) localStorage.setItem(PREFIX + key, JSON.stringify(value));
    listeners.forEach((listener) => listener());
  },
};

window.addEventListener('storage', () => listeners.forEach((listener) => listener()));

const granted: Record<SiteId, boolean> = { x: false, linkedin: false };

export function createPreviewEnv(): LearningEnv {
  const store = createLearningStore(area);
  return {
    store,
    actions: createLearningActions(store),
    speaker: createSpeaker({
      synth: window.speechSynthesis,
      createUtterance: (text) => new SpeechSynthesisUtterance(text),
      playClip: async () => undefined,
      clips: {},
    }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    now: () => Date.now() + Number(localStorage.getItem(`${PREFIX}offsetMs`) ?? 0),
    sites: {
      status: async () => ({ ...granted }),
      request: async (site) => (granted[site] = true),
      revoke: async (site) => !(granted[site] = false),
    },
    openPractice: () => window.open('/index.html', '_blank'),
  };
}
