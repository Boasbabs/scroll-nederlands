// Progress backup: one JSON file on the learner's computer. Chrome deletes an
// extension's storage when the extension is removed, so this file is the only
// way back. A restore adds the file to what is here; it never wipes anything.
import { dayKey, mergeProgress } from '../engine/progress';
import { DAY } from '../engine/schedule';
import type { LearnerProgress } from '../engine/types';
import type { OwnPictureBlobs } from '../images/own';
import { fromDataUrl, toDataUrl } from '../images/pictures';
import { isRecord, parseRecords, storedRecords, type BackupTimes, type LearnerRecords, type NoteIndex, type Store } from './store';

/** Raised only when an older TaalNudge could no longer read the file. */
export const BACKUP_FORMAT = 1;

/** Days of practice before the first reminder to back up, and days between reminders. */
export const BACKUP_REMINDER = { practiceDays: 3, everyDays: 14 } as const;

/** Far more than any backup; a bigger file is not read at all. */
const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

/**
 * The file. `data` holds the stored records under their storage keys; the
 * browsing state (tn.trigger) is left out, as it means nothing later.
 * `pictures` holds the learner's own pictures as data URLs, by item id.
 */
export type BackupFile = {
  app: 'taalnudge';
  format: typeof BACKUP_FORMAT;
  exportedAt: string;
  /** The extension's version, for reference only: `format` decides what can be read. */
  version: string;
  data: Record<string, unknown>;
  pictures: Record<string, string>;
};

/** A file that passed the check, read back into records and pictures. */
export type Backup = {
  exportedAt?: number;
  records: LearnerRecords;
  pictures: Record<string, Blob>;
};

/** not-backup: any other file. newer: a backup made by a later TaalNudge, in a format this one can't read. */
export type BackupCheck = { ok: true; backup: Backup } | { ok: false; problem: 'not-backup' | 'newer' };

export function backupFileName(at: number): string {
  return `taalnudge-backup-${dayKey(at)}.json`;
}

/** Everything stored now, with the learner's own pictures. */
export async function buildBackup(store: Store, blobs: OwnPictureBlobs, version: string, at: number): Promise<BackupFile> {
  const records = await store.readRecords();
  const pictures: Record<string, string> = {};
  for (const itemId of Object.keys(records.pictures)) {
    const image = await blobs.get(itemId).catch(() => undefined);
    // A picture that is listed but no longer stored is left out, entry and all.
    if (image) pictures[itemId] = await toDataUrl(image);
    else delete records.pictures[itemId];
  }
  return { app: 'taalnudge', format: BACKUP_FORMAT, exportedAt: new Date(at).toISOString(), version, data: storedRecords(records), pictures };
}

/** Reads a chosen file's text with the store's parsers, which drop anything malformed, as they do for stored data. */
export function checkBackup(text: string): BackupCheck {
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch {
    return { ok: false, problem: 'not-backup' };
  }
  if (!isRecord(file) || file.app !== 'taalnudge' || typeof file.format !== 'number' || !isRecord(file.data)) return { ok: false, problem: 'not-backup' };
  if (file.format > BACKUP_FORMAT) return { ok: false, problem: 'newer' };
  if (file.format !== BACKUP_FORMAT) return { ok: false, problem: 'not-backup' };

  const records = parseRecords(file.data);
  const stored = isRecord(file.pictures) ? file.pictures : {};
  const pictures: Record<string, Blob> = {};
  for (const itemId of Object.keys(records.pictures)) {
    const url = stored[itemId];
    const image = typeof url === 'string' ? fromDataUrl(url) : undefined;
    if (image) pictures[itemId] = image;
    else delete records.pictures[itemId];
  }
  const exportedAt = typeof file.exportedAt === 'string' ? Date.parse(file.exportedAt) : Number.NaN;
  return { ok: true, backup: { exportedAt: Number.isFinite(exportedAt) ? exportedAt : undefined, records, pictures } };
}

/** Per item, the note written last; a tie keeps the one here. */
function newerNotes(here: NoteIndex, backup: NoteIndex): NoteIndex {
  const notes = { ...backup };
  for (const [itemId, note] of Object.entries(here)) {
    if (note.at >= (notes[itemId]?.at ?? Number.NEGATIVE_INFINITY)) notes[itemId] = note;
  }
  return notes;
}

/**
 * Adds a backup's records to the ones here. Progress and notes keep the newer
 * copy of each item (a tie keeps the one here), so anything done since the
 * backup stays. Pictures, drafts, corrections, "Make it yours" offers and
 * ticked missions are added where this browser has none. Settings come from the backup, except the
 * sites: Chrome's site access can't come from a file, so they stay as they are
 * here (all off after a reinstall), and so does a snooze.
 */
export function mergeRecords(here: LearnerRecords, backup: LearnerRecords): LearnerRecords {
  return {
    progress: mergeProgress(backup.progress, here.progress),
    prefs: {
      ...backup.prefs,
      // A learner with restored progress is past the first-run steps.
      onboarded: true,
      sites: here.prefs.sites,
      snoozeUntil: here.prefs.snoozeUntil,
      hetImage: backup.prefs.hetImage ?? here.prefs.hetImage,
    },
    pictures: { ...backup.pictures, ...here.pictures },
    notes: newerNotes(here.notes, backup.notes),
    leeches: { ...backup.leeches, ...here.leeches },
    drafts: { ...backup.drafts, ...here.drafts },
    corrections: { ...backup.corrections, ...here.corrections },
    missions: { ...backup.missions, ...here.missions },
  };
}

/** Adds a checked backup to this browser: pictures first, so no record lists a picture that isn't stored. */
export async function restoreBackup(store: Store, blobs: OwnPictureBlobs, backup: Backup): Promise<void> {
  const here = await store.readPictures();
  for (const [itemId, image] of Object.entries(backup.pictures)) {
    if (!(itemId in here)) await blobs.put(itemId, image);
  }
  await store.updateRecords((records) => mergeRecords(records, backup.records));
  // The learner has this file, so it counts as the newest backup here, unless this browser saved a newer one.
  const { exportedAt } = backup;
  if (exportedAt !== undefined) await store.updateBackupTimes((times) => ({ ...times, savedAt: Math.max(times.savedAt ?? exportedAt, exportedAt) }));
}

/**
 * Whether to remind the learner to back up: they practised on 3 days and
 * have no backup, or practised since a backup 14 days old or more. "Not now"
 * puts the reminder off for 14 days.
 */
export function backupDue(progress: LearnerProgress, times: BackupTimes, now: number): boolean {
  const every = BACKUP_REMINDER.everyDays * DAY;
  if (times.dismissedAt !== undefined && now - times.dismissedAt < every) return false;
  const practised = Object.keys(progress.days).filter((day) => (progress.days[day] ?? 0) > 0);
  if (times.savedAt === undefined) return practised.length >= BACKUP_REMINDER.practiceDays;
  const saved = dayKey(times.savedAt);
  return now - times.savedAt >= every && practised.some((day) => day > saved);
}

export type BackupDeps = {
  store: Store;
  /** The learner's own pictures (IndexedDB in the side panel). */
  blobs: OwnPictureBlobs;
  version: string;
  /** Hands the finished file to the browser (saveFile in the side panel). */
  saveFile: (name: string, file: Blob) => void;
  now?: () => number;
};

/** What Settings and onboarding back up and restore with (UiEnv.backup). */
export function createProgressBackup({ store, blobs, version, saveFile, now = Date.now }: BackupDeps) {
  return {
    /** Saves a backup of everything stored now. Returns when it was made. */
    async save(): Promise<number> {
      const at = now();
      const file = await buildBackup(store, blobs, version, at);
      saveFile(backupFileName(at), new Blob([JSON.stringify(file)], { type: 'application/json' }));
      await store.updateBackupTimes((times) => ({ ...times, savedAt: at }));
      return at;
    },

    /** When the newest backup here was made, if there is one. */
    lastSaved: async (): Promise<number | undefined> => (await store.readBackupTimes()).savedAt,

    /** Whether Today should remind the learner to back up (backupDue), with when they last did. */
    async reminder(progress: LearnerProgress): Promise<{ lastSaved?: number } | undefined> {
      const times = await store.readBackupTimes();
      return backupDue(progress, times, now()) ? { lastSaved: times.savedAt } : undefined;
    },

    /** "Not now" on the reminder. */
    async putOffReminder(): Promise<void> {
      await store.updateBackupTimes((times) => ({ ...times, dismissedAt: now() }));
    },

    /** Reads and checks a file the learner chose. */
    async check(file: Blob): Promise<BackupCheck> {
      if (file.size > MAX_BACKUP_BYTES) return { ok: false, problem: 'not-backup' };
      return checkBackup(await file.text());
    },

    restore: (backup: Backup): Promise<void> => restoreBackup(store, blobs, backup),
  };
}

export type ProgressBackup = ReturnType<typeof createProgressBackup>;
