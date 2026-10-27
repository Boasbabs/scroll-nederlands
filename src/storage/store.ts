import { createEmptyProgress } from '../engine/progress';
import type { LearnerPreferences, LearnerProgress } from '../engine/types';
import { type BrowsingState, continueOrStartSession, newBrowsingState } from '../trigger/browsing';

/** The subset of chrome.storage.local used here, so tests can pass an in-memory area. */
export type StorageAreaLike = {
  get(keys: Array<string>): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

export const STORAGE_KEYS = {
  progress: 'progress',
  preferences: 'preferences',
  browsing: 'browsing',
} as const;

export const DEFAULT_PREFERENCES: LearnerPreferences = {
  promptAfterMinutes: 8,
  quietMode: false,
  snoozeUntil: null,
  speechRate: 0.9,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseProgress(raw: unknown): LearnerProgress {
  if (!isRecord(raw) || raw.version !== 1) return createEmptyProgress();
  return {
    version: 1,
    items: isRecord(raw.items) ? (raw.items as LearnerProgress['items']) : {},
    completedLessons: isRecord(raw.completedLessons) ? (raw.completedLessons as LearnerProgress['completedLessons']) : {},
    checkpoints: isRecord(raw.checkpoints) ? (raw.checkpoints as LearnerProgress['checkpoints']) : {},
  };
}

export function parsePreferences(raw: unknown): LearnerPreferences {
  const source = isRecord(raw) ? raw : {};
  const minutes = typeof source.promptAfterMinutes === 'number' ? source.promptAfterMinutes : DEFAULT_PREFERENCES.promptAfterMinutes;
  const rate = typeof source.speechRate === 'number' ? source.speechRate : DEFAULT_PREFERENCES.speechRate;
  return {
    promptAfterMinutes: Math.min(60, Math.max(2, Math.round(minutes))),
    quietMode: source.quietMode === true,
    snoozeUntil: typeof source.snoozeUntil === 'number' ? source.snoozeUntil : null,
    speechRate: Math.min(1.2, Math.max(0.6, rate)),
  };
}

export function parseBrowsing(raw: unknown, now: number): BrowsingState {
  if (!isRecord(raw) || typeof raw.lastActiveAt !== 'number') return newBrowsingState(now);
  const state = { ...newBrowsingState(now), ...(raw as Partial<BrowsingState>) };
  return continueOrStartSession(state, now);
}

export type LearningStore = ReturnType<typeof createLearningStore>;

/**
 * Read-modify-write helpers over one storage area. Writes from the same
 * context are queued so two quick answers cannot overwrite each other.
 */
export function createLearningStore(area: StorageAreaLike) {
  let queue: Promise<unknown> = Promise.resolve();

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task);
    queue = run.catch(() => undefined);
    return run;
  }

  async function read<T>(key: string, parse: (raw: unknown) => T): Promise<T> {
    const result = await area.get([key]);
    return parse(result[key]);
  }

  return {
    getProgress: () => read(STORAGE_KEYS.progress, parseProgress),
    getPreferences: () => read(STORAGE_KEYS.preferences, parsePreferences),
    getBrowsing: (now: number) => read(STORAGE_KEYS.browsing, (raw) => parseBrowsing(raw, now)),

    updateProgress(mutate: (progress: LearnerProgress) => LearnerProgress): Promise<LearnerProgress> {
      return enqueue(async () => {
        const next = mutate(await read(STORAGE_KEYS.progress, parseProgress));
        await area.set({ [STORAGE_KEYS.progress]: next });
        return next;
      });
    },

    updatePreferences(patch: Partial<LearnerPreferences>): Promise<LearnerPreferences> {
      return enqueue(async () => {
        const next = parsePreferences({ ...(await read(STORAGE_KEYS.preferences, parsePreferences)), ...patch });
        await area.set({ [STORAGE_KEYS.preferences]: next });
        return next;
      });
    },

    updateBrowsing(now: number, mutate: (state: BrowsingState) => BrowsingState): Promise<BrowsingState> {
      return enqueue(async () => {
        const next = mutate(await read(STORAGE_KEYS.browsing, (raw) => parseBrowsing(raw, now)));
        await area.set({ [STORAGE_KEYS.browsing]: next });
        return next;
      });
    },
  };
}
