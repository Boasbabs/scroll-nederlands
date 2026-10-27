// Local persistence in chrome.storage.local. Every value is parsed with
// defaults, so a missing or older shape never breaks the extension.
import { mergeProgress } from '../engine/progress';
import { emptyProgress, type ItemProgress, type LearnerProgress } from '../engine/types';
import type { SiteId } from '../sites';

/** The subset of chrome.storage.StorageArea the store needs. */
export type StorageAreaLike = {
  get(keys: Array<string>): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove?(keys: Array<string>): Promise<void>;
};

export const STORAGE_KEYS = {
  progress: 'tn.progress',
  prefs: 'tn.prefs',
  trigger: 'tn.trigger',
} as const;

export type LearnerPreferences = {
  /** First-run steps are done. */
  onboarded: boolean;
  /** Minutes of active browsing before a prompt. An initial heuristic, not an optimum. */
  promptAfterMinutes: number;
  /** No in-page prompts at all until switched off. */
  quietMode: boolean;
  /** No in-page prompts before this time. */
  snoozeUntil?: number;
  /** Sites the learner chose for prompts (the host permission is requested separately). */
  sites: Record<SiteId, boolean>;
  /** Play the Dutch automatically when a phrase appears. */
  autoplayAudio: boolean;
  /** Playback speed for normal audio; slow replay is always available. */
  speechRate: number;
  soundEffects: boolean;
};

export const PROMPT_MINUTES_RANGE = { min: 3, max: 60 } as const;

export function defaultPreferences(): LearnerPreferences {
  return {
    onboarded: false,
    promptAfterMinutes: 8,
    quietMode: false,
    sites: { x: false, linkedin: false },
    autoplayAudio: true,
    speechRate: 1,
    soundEffects: true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function parsePreferences(raw: unknown): LearnerPreferences {
  const defaults = defaultPreferences();
  if (!isRecord(raw)) return defaults;
  const sites = isRecord(raw.sites) ? raw.sites : {};
  const minutes = finite(raw.promptAfterMinutes, defaults.promptAfterMinutes);
  return {
    onboarded: raw.onboarded === true,
    promptAfterMinutes: Math.min(PROMPT_MINUTES_RANGE.max, Math.max(PROMPT_MINUTES_RANGE.min, Math.round(minutes))),
    quietMode: raw.quietMode === true,
    snoozeUntil: typeof raw.snoozeUntil === 'number' ? raw.snoozeUntil : undefined,
    sites: { x: sites.x === true, linkedin: sites.linkedin === true },
    autoplayAudio: raw.autoplayAudio !== false,
    speechRate: Math.min(1.2, Math.max(0.6, finite(raw.speechRate, 1))),
    soundEffects: raw.soundEffects !== false,
  };
}

const ITEM_STAGE_NAMES = new Set(['introduced', 'recognition', 'supportedRecall', 'independentRecall', 'transfer']);

function parseItem(raw: unknown): ItemProgress | undefined {
  if (!isRecord(raw) || typeof raw.stage !== 'string' || !ITEM_STAGE_NAMES.has(raw.stage)) return undefined;
  if (typeof raw.dueAt !== 'number') return undefined;
  return {
    stage: raw.stage as ItemProgress['stage'],
    step: finite(raw.step, 0),
    relearning: raw.relearning === true,
    dueAt: raw.dueAt,
    introducedAt: finite(raw.introducedAt, raw.dueAt),
    lastPracticedAt: finite(raw.lastPracticedAt, finite(raw.introducedAt, raw.dueAt)),
    correct: finite(raw.correct, 0),
    incorrect: finite(raw.incorrect, 0),
    lapses: finite(raw.lapses, 0),
    history: Array.isArray(raw.history) ? (raw.history.filter(isRecord) as ItemProgress['history']) : [],
  };
}

export function parseProgress(raw: unknown): LearnerProgress {
  const progress = emptyProgress();
  if (!isRecord(raw) || raw.version !== 2) return progress;
  if (isRecord(raw.items)) {
    for (const [id, value] of Object.entries(raw.items)) {
      const item = parseItem(value);
      if (item) progress.items[id] = item;
    }
  }
  if (isRecord(raw.lessons)) {
    for (const [id, value] of Object.entries(raw.lessons)) {
      if (!isRecord(value)) continue;
      progress.lessons[id] = {
        startedAt: typeof value.startedAt === 'number' ? value.startedAt : undefined,
        completedAt: typeof value.completedAt === 'number' ? value.completedAt : undefined,
        timesCompleted: finite(value.timesCompleted, 0),
        lastScore: typeof value.lastScore === 'number' ? value.lastScore : undefined,
        bestScore: typeof value.bestScore === 'number' ? value.bestScore : undefined,
      };
    }
  }
  if (isRecord(raw.days)) {
    for (const [day, count] of Object.entries(raw.days)) progress.days[day] = finite(count, 0);
  }
  return progress;
}

/**
 * Reads and writes learner state. Writes within one page are queued; each
 * write re-reads the stored value first and merges per item, so the side
 * panel and an in-page card do not erase each other's answers.
 */
export function createStore(area: StorageAreaLike) {
  let queue: Promise<unknown> = Promise.resolve();
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  async function readProgress(): Promise<LearnerProgress> {
    const stored = await area.get([STORAGE_KEYS.progress]);
    return parseProgress(stored[STORAGE_KEYS.progress]);
  }

  async function readPreferences(): Promise<LearnerPreferences> {
    const stored = await area.get([STORAGE_KEYS.prefs]);
    return parsePreferences(stored[STORAGE_KEYS.prefs]);
  }

  return {
    readProgress,
    readPreferences,

    /** Applies `change` to the latest stored progress and saves the result. */
    updateProgress(change: (progress: LearnerProgress) => LearnerProgress): Promise<LearnerProgress> {
      return enqueue(async () => {
        const changed = change(await readProgress());
        // Anything another page saved meanwhile is kept (newest copy of each item wins).
        const next = mergeProgress(await readProgress(), changed);
        await area.set({ [STORAGE_KEYS.progress]: next });
        return next;
      });
    },

    updatePreferences(patch: Partial<LearnerPreferences>): Promise<LearnerPreferences> {
      return enqueue(async () => {
        const next = parsePreferences({ ...(await readPreferences()), ...patch });
        await area.set({ [STORAGE_KEYS.prefs]: next });
        return next;
      });
    },

    /** Removes all learning progress (preferences stay). */
    resetProgress(): Promise<void> {
      return enqueue(() => area.set({ [STORAGE_KEYS.progress]: emptyProgress() }));
    },
  };
}

export type Store = ReturnType<typeof createStore>;
