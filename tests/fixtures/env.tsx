import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import { createLearningActions } from '../../src/learning/actions';
import { createLearningStore } from '../../src/storage/store';
import { EnvProvider, type LearningEnv } from '../../src/ui/env';
import { createMemoryArea } from './memory-storage';

export function createTestEnv(options: { curriculum?: Curriculum; lessons?: Array<Lesson>; now?: () => number } = {}) {
  const area = createMemoryArea();
  const store = createLearningStore(area);
  const listeners = new Set<() => void>();
  const notifyingStore = {
    ...store,
    updateProgress: async (...args: Parameters<typeof store.updateProgress>) => {
      const result = await store.updateProgress(...args);
      listeners.forEach((l) => l());
      return result;
    },
    updatePreferences: async (...args: Parameters<typeof store.updatePreferences>) => {
      const result = await store.updatePreferences(...args);
      listeners.forEach((l) => l());
      return result;
    },
  };
  const env: LearningEnv = {
    store: notifyingStore,
    actions: createLearningActions(notifyingStore, options.curriculum, options.lessons),
    speaker: {
      speak: vi.fn(async () => ({ ok: true as const, engine: 'synthesis' as const, match: 'nl-NL' as const })),
      describeVoice: vi.fn(async () => ({ match: 'nl-NL' as const, voiceName: 'Test voice', hasClips: false })),
      stop: vi.fn(),
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    now: options.now ?? (() => Date.UTC(2026, 0, 5, 9)),
  };
  return { env, store, area };
}

export function renderWithEnv(ui: ReactNode, env: LearningEnv) {
  return render(<EnvProvider env={env}>{ui}</EnvProvider>);
}
