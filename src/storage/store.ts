// Local persistence in chrome.storage.local. Every value is parsed with
// defaults, so a missing or older shape never breaks the extension.
import type { Correction, Draft } from '../corrections/types';
import { mergeProgress } from '../engine/progress';
import { emptyProgress, type ItemProgress, type LearnerProgress } from '../engine/types';
import { SITE_IDS, siteRecord, type SiteId } from '../sites';

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
  /** Which items have the learner's own picture (the pictures themselves are in IndexedDB). */
  pictures: 'tn.pictures',
  /** The learner's own lines about items ("Make it yours"). */
  notes: 'tn.notes',
  /** When each slipping item was last offered "Make it yours", so it is offered once. */
  leeches: 'tn.leeches',
  /** Writing sent for correction, waiting for the corrected version. */
  drafts: 'tn.drafts',
  /** Corrections of the learner's writing, practised as items (`c-…`). */
  custom: 'tn.custom',
  /** This browser's backup times (BackupTimes). Not itself in a backup. */
  backup: 'tn.backup',
  /** The packs whose "Do it for real" mission the learner ticked. Not scored. */
  missions: 'tn.missions',
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
  /** New basic words a day (src/words); 0 turns the word track off. */
  newWordsPerDay: number;
  /** Show the English on learn, phrase and word cards straight away; off, it waits behind "Show meaning". */
  showTranslations: boolean;
  /**
   * How the learner pictures every het-word ("made of gold"), finishing
   * "Picture it …". Unset until they pick one, on the first het-noun or in Settings.
   */
  hetImage?: string;
};

export const PROMPT_MINUTES_RANGE = { min: 3, max: 60 } as const;

/** The daily new-word limits offered in Settings. */
export const NEW_WORDS_CHOICES = [0, 3, 5, 10] as const;

/** Ready-made images for het-words; the learner may write their own instead. The first is used until they pick. */
export const HET_IMAGES = ['made of gold', 'frozen in ice', 'glowing hot'] as const;

/** Own words for the het image are kept short: they finish one line. */
export const HET_IMAGE_MAX = 40;

export function defaultPreferences(): LearnerPreferences {
  return {
    onboarded: false,
    promptAfterMinutes: 8,
    quietMode: false,
    sites: siteRecord(),
    autoplayAudio: true,
    speechRate: 1,
    soundEffects: true,
    newWordsPerDay: 5,
    showTranslations: false,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
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
    sites: siteRecord(SITE_IDS.filter((id) => sites[id] === true)),
    autoplayAudio: raw.autoplayAudio !== false,
    speechRate: Math.min(1.2, Math.max(0.6, finite(raw.speechRate, 1))),
    soundEffects: raw.soundEffects !== false,
    newWordsPerDay: Math.min(20, Math.max(0, Math.round(finite(raw.newWordsPerDay, defaults.newWordsPerDay)))),
    showTranslations: raw.showTranslations === true,
    hetImage: typeof raw.hetImage === 'string' && raw.hetImage.trim() ? raw.hetImage.trim().slice(0, HET_IMAGE_MAX) : undefined,
  };
}

/** Item id → when the learner added their own picture. */
export type PictureIndex = Record<string, number>;

export function parsePictures(raw: unknown): PictureIndex {
  if (!isRecord(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])));
}

/** A note is one line: longer text is cut here. */
export const NOTE_MAX = 160;

/** The learner's line about an item, and when they wrote it (the newest copy wins a merge). */
export type Note = { text: string; at: number };

/** Item id → the learner's note. */
export type NoteIndex = Record<string, Note>;

export function parseNotes(raw: unknown): NoteIndex {
  if (!isRecord(raw)) return {};
  const notes: NoteIndex = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value) || typeof value.text !== 'string' || typeof value.at !== 'number' || !Number.isFinite(value.at)) continue;
    const text = value.text.trim().slice(0, NOTE_MAX);
    if (text) notes[id] = { text, at: value.at };
  }
  return notes;
}

/** Item id → when the learner was offered "Make it yours" for it. */
export type LeechIndex = Record<string, number>;

export const parseLeeches: (raw: unknown) => LeechIndex = parsePictures;

/** Pack id → when the learner ticked its mission as done. */
export type MissionIndex = Record<string, number>;

export const parseMissions: (raw: unknown) => MissionIndex = parsePictures;

function strings(raw: unknown): Array<string> | undefined {
  return Array.isArray(raw) && raw.every((value) => typeof value === 'string') ? raw : undefined;
}

/** Draft id → the text waiting for correction. */
export function parseDrafts(raw: unknown): Record<string, Draft> {
  if (!isRecord(raw)) return {};
  const drafts: Record<string, Draft> = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim() || typeof value.at !== 'number') continue;
    drafts[id] = { id, text: value.text, prompt: typeof value.prompt === 'string' ? value.prompt : '', exerciseId: typeof value.exerciseId === 'string' ? value.exerciseId : '', at: value.at };
  }
  return drafts;
}

/** Correction item id → the correction. Entries without a gap or an answer are dropped. */
export function parseCorrections(raw: unknown): Record<string, Correction> {
  if (!isRecord(raw)) return {};
  const corrections: Record<string, Correction> = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value) || !/^c-[a-z0-9]+$/.test(id)) continue;
    const answers = strings(value.answers);
    if (typeof value.sentence !== 'string' || !value.sentence.includes('___') || !answers?.length || typeof value.dutch !== 'string') continue;
    corrections[id] = { id, sentence: value.sentence, answers, wrote: typeof value.wrote === 'string' ? value.wrote : '', dutch: value.dutch, at: finite(value.at, 0) };
  }
  return corrections;
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

/** Everything the learner has built up: what a backup holds. */
export type LearnerRecords = {
  progress: LearnerProgress;
  prefs: LearnerPreferences;
  pictures: PictureIndex;
  notes: NoteIndex;
  leeches: LeechIndex;
  drafts: Record<string, Draft>;
  corrections: Record<string, Correction>;
  missions: MissionIndex;
};

/** Where each record is stored. The browsing state and the backup time are not records. */
export const RECORD_KEYS = {
  progress: STORAGE_KEYS.progress,
  prefs: STORAGE_KEYS.prefs,
  pictures: STORAGE_KEYS.pictures,
  notes: STORAGE_KEYS.notes,
  leeches: STORAGE_KEYS.leeches,
  drafts: STORAGE_KEYS.drafts,
  corrections: STORAGE_KEYS.custom,
  missions: STORAGE_KEYS.missions,
} as const satisfies Record<keyof LearnerRecords, string>;

/** The records from values keyed as stored (chrome.storage.local, or a backup's data). */
export function parseRecords(stored: Record<string, unknown>): LearnerRecords {
  return {
    progress: parseProgress(stored[RECORD_KEYS.progress]),
    prefs: parsePreferences(stored[RECORD_KEYS.prefs]),
    pictures: parsePictures(stored[RECORD_KEYS.pictures]),
    notes: parseNotes(stored[RECORD_KEYS.notes]),
    leeches: parseLeeches(stored[RECORD_KEYS.leeches]),
    drafts: parseDrafts(stored[RECORD_KEYS.drafts]),
    corrections: parseCorrections(stored[RECORD_KEYS.corrections]),
    missions: parseMissions(stored[RECORD_KEYS.missions]),
  };
}

/** The records keyed as stored. */
export function storedRecords(records: LearnerRecords): Record<string, unknown> {
  return Object.fromEntries(Object.entries(RECORD_KEYS).map(([name, key]) => [key, records[name as keyof LearnerRecords]]));
}

/** When this browser's newest backup was saved (or restored from), and when the learner last put off the reminder. */
export type BackupTimes = { savedAt?: number; dismissedAt?: number };

export function parseBackupTimes(raw: unknown): BackupTimes {
  if (!isRecord(raw)) return {};
  const time = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
  return { savedAt: time(raw.savedAt), dismissedAt: time(raw.dismissedAt) };
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

  async function readPictures(): Promise<PictureIndex> {
    const stored = await area.get([STORAGE_KEYS.pictures]);
    return parsePictures(stored[STORAGE_KEYS.pictures]);
  }

  async function readNotes(): Promise<NoteIndex> {
    const stored = await area.get([STORAGE_KEYS.notes]);
    return parseNotes(stored[STORAGE_KEYS.notes]);
  }

  async function readLeeches(): Promise<LeechIndex> {
    const stored = await area.get([STORAGE_KEYS.leeches]);
    return parseLeeches(stored[STORAGE_KEYS.leeches]);
  }

  async function readDrafts(): Promise<Record<string, Draft>> {
    const stored = await area.get([STORAGE_KEYS.drafts]);
    return parseDrafts(stored[STORAGE_KEYS.drafts]);
  }

  async function readMissions(): Promise<MissionIndex> {
    const stored = await area.get([STORAGE_KEYS.missions]);
    return parseMissions(stored[STORAGE_KEYS.missions]);
  }

  async function readCorrections(): Promise<Record<string, Correction>> {
    const stored = await area.get([STORAGE_KEYS.custom]);
    return parseCorrections(stored[STORAGE_KEYS.custom]);
  }

  async function readRecords(): Promise<LearnerRecords> {
    return parseRecords(await area.get(Object.values(RECORD_KEYS)));
  }

  async function readBackupTimes(): Promise<BackupTimes> {
    const stored = await area.get([STORAGE_KEYS.backup]);
    return parseBackupTimes(stored[STORAGE_KEYS.backup]);
  }

  return {
    readProgress,
    readPreferences,
    readPictures,
    readNotes,
    readLeeches,
    readDrafts,
    readCorrections,
    readMissions,
    readRecords,

    /**
     * Applies `change` to every record and saves them in one write (a restore),
     * so each page refreshes once. Progress another page saved meanwhile is kept.
     */
    updateRecords(change: (records: LearnerRecords) => LearnerRecords): Promise<LearnerRecords> {
      return enqueue(async () => {
        const changed = change(await readRecords());
        const next = { ...changed, progress: mergeProgress(await readProgress(), changed.progress) };
        await area.set(storedRecords(next));
        return next;
      });
    },

    readBackupTimes,

    updateBackupTimes(change: (times: BackupTimes) => BackupTimes): Promise<BackupTimes> {
      return enqueue(async () => {
        const next = change(await readBackupTimes());
        await area.set({ [STORAGE_KEYS.backup]: next });
        return next;
      });
    },

    /** Keeps (or, with undefined, drops) a text waiting for correction. */
    setDraft(id: string, draft: Draft | undefined): Promise<Record<string, Draft>> {
      return enqueue(async () => {
        const next = { ...(await readDrafts()) };
        if (draft) next[id] = draft;
        else delete next[id];
        await area.set({ [STORAGE_KEYS.drafts]: next });
        return next;
      });
    },

    /** Adds corrections as items. Ids are permanent: an existing one is never replaced. */
    addCorrections(added: ReadonlyArray<Correction>): Promise<Record<string, Correction>> {
      return enqueue(async () => {
        const next = { ...(await readCorrections()) };
        for (const correction of added) next[correction.id] ??= correction;
        await area.set({ [STORAGE_KEYS.custom]: next });
        return next;
      });
    },

    /**
     * Writes (or, with empty text, removes) the learner's note on an item. A
     * copy written later elsewhere (the other page) wins over this one.
     */
    setNote(itemId: string, text: string, at: number): Promise<NoteIndex> {
      return enqueue(async () => {
        const current = await readNotes();
        if ((current[itemId]?.at ?? Number.NEGATIVE_INFINITY) > at) return current;
        const next = { ...current };
        const line = text.trim().slice(0, NOTE_MAX);
        if (line) next[itemId] = { text: line, at };
        else delete next[itemId];
        await area.set({ [STORAGE_KEYS.notes]: next });
        return next;
      });
    },

    /** Remembers that an item was offered "Make it yours". */
    markLeech(itemId: string, at: number): Promise<LeechIndex> {
      return enqueue(async () => {
        const next = { ...(await readLeeches()), [itemId]: at };
        await area.set({ [STORAGE_KEYS.leeches]: next });
        return next;
      });
    },

    /** Ticks (a time) or unticks (undefined) a pack's mission. */
    setMission(packId: string, at: number | undefined): Promise<MissionIndex> {
      return enqueue(async () => {
        const next = { ...(await readMissions()) };
        if (at === undefined) delete next[packId];
        else next[packId] = at;
        await area.set({ [STORAGE_KEYS.missions]: next });
        return next;
      });
    },

    /** Records that an item has (a time) or no longer has (undefined) the learner's own picture. */
    setPicture(itemId: string, at: number | undefined): Promise<PictureIndex> {
      return enqueue(async () => {
        const next = { ...(await readPictures()) };
        if (at === undefined) delete next[itemId];
        else next[itemId] = at;
        await area.set({ [STORAGE_KEYS.pictures]: next });
        return next;
      });
    },

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
