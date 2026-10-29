import { findCorrections } from '../../src/corrections/diff';
import { completeLesson, dayKey } from '../../src/engine/progress';
import { DAY, HOUR } from '../../src/engine/schedule';
import { emptyProgress } from '../../src/engine/types';
import { createMemoryPictures } from '../../src/images/own';
import { siteRecord } from '../../src/sites';
import { BACKUP_FORMAT, backupDue, createProgressBackup, type BackupFile } from '../../src/storage/backup';
import { createStore, STORAGE_KEYS } from '../../src/storage/store';
import { newTriggerState } from '../../src/trigger/browsing';
import { makeCourse } from '../fixtures/curriculum';
import { createMemoryArea } from '../fixtures/memory-storage';

const T0 = new Date(2026, 9, 27, 9).getTime();
const index = makeCourse();
const HELLO = 'x0-a-hello/hallo-daar';
const THANKS = 'x0-a-thanks/dank-je-wel';

/** One browser's storage and pictures, with its own clock. Saved backup files land in `saved`. */
function browserAt(start: number) {
  let clock = start;
  const area = createMemoryArea();
  const store = createStore(area);
  const blobs = createMemoryPictures();
  const saved: Array<{ name: string; file: Blob }> = [];
  const backup = createProgressBackup({ store, blobs, version: '0.1.0', saveFile: (name, file) => void saved.push({ name, file }), now: () => clock });
  return { area, store, blobs, backup, saved, advance: (ms: number) => (clock += ms) };
}

type Browser = ReturnType<typeof browserAt>;

async function savedText(browser: Browser): Promise<string> {
  await browser.backup.save();
  return browser.saved.at(-1)!.file.text();
}

async function restore(browser: Browser, text: string) {
  const check = await browser.backup.check(new File([text], 'taalnudge-backup.json', { type: 'application/json' }));
  if (!check.ok) throw new Error(`Not restorable: ${check.problem}`);
  await browser.backup.restore(check.backup);
  return check.backup;
}

async function addPicture(browser: Browser, itemId: string, bytes: Array<number>, at: number) {
  await browser.blobs.put(itemId, new Blob([new Uint8Array(bytes)], { type: 'image/webp' }));
  await browser.store.setPicture(itemId, at);
}

async function pictureBytes(browser: Browser, itemId: string): Promise<Array<number> | undefined> {
  const picture = await browser.blobs.get(itemId);
  return picture && [...new Uint8Array(await picture.arrayBuffer())];
}

describe('progress backup', () => {
  it('saves everything in one file and brings it all back after a reinstall, own pictures included', async () => {
    const before = browserAt(T0);
    await before.store.updateProgress((progress) => completeLesson(progress, index, 'x0-a-hello', [], 'focused', T0 - DAY));
    await before.store.updatePreferences({ onboarded: true, quietMode: true, newWordsPerDay: 10, hetImage: 'frozen in ice', sites: siteRecord(['x', 'youtube']) });
    await before.store.setNote(HELLO, 'Ik zeg het tegen mijn buurvrouw.', T0 - DAY);
    await before.store.markLeech(THANKS, T0 - DAY);
    await before.store.setDraft('d-1', { id: 'd-1', text: 'Ik ben gisteren gewerkt.', prompt: 'Say what you did.', exerciseId: 'x0-a-hello/type', at: T0 - DAY });
    await before.store.addCorrections(findCorrections('Ik ben gisteren gewerkt.', 'Ik heb gisteren gewerkt.', T0 - DAY));
    await before.store.setMission('gemeente', T0 - DAY);
    await addPicture(before, HELLO, [1, 2, 3, 250], T0 - DAY);

    expect(await before.backup.lastSaved()).toBeUndefined();
    expect(await before.backup.save()).toBe(T0);
    expect(await before.backup.lastSaved()).toBe(T0);
    const { name, file } = before.saved[0]!;
    expect(name).toBe('taalnudge-backup-2026-10-27.json');
    expect(file.type).toBe('application/json');
    const saved = JSON.parse(await file.text()) as BackupFile;
    expect(saved).toMatchObject({ app: 'taalnudge', format: BACKUP_FORMAT, exportedAt: new Date(T0).toISOString(), version: '0.1.0' });
    expect(Object.keys(saved.pictures)).toEqual([HELLO]);
    expect(saved.pictures[HELLO]).toMatch(/^data:image\/webp;base64,/);

    // Removing the extension deleted its storage: the reinstalled one starts empty.
    const after = browserAt(T0 + DAY);
    const backup = await restore(after, await file.text());
    expect(backup.exportedAt).toBe(T0);
    expect(await after.store.readRecords()).toEqual({
      ...(await before.store.readRecords()),
      // Site access can't come from a file, so the sites wait for the learner.
      prefs: { ...(await before.store.readPreferences()), sites: siteRecord() },
    });
    expect(await pictureBytes(after, HELLO)).toEqual([1, 2, 3, 250]);
    expect((await after.blobs.get(HELLO))?.type).toBe('image/webp');
    // The learner has this file, so it counts as the newest backup here.
    expect(await after.backup.lastSaved()).toBe(T0);
  });

  it('leaves the browsing state out of the file, and alone on a restore', async () => {
    const before = browserAt(T0);
    await before.area.set({ [STORAGE_KEYS.trigger]: newTriggerState(T0 - HOUR) });
    const saved = JSON.parse(await savedText(before)) as BackupFile;
    expect(Object.keys(saved.data).sort()).toEqual(
      Object.values(STORAGE_KEYS)
        .filter((key) => key !== STORAGE_KEYS.trigger && key !== STORAGE_KEYS.backup)
        .sort(),
    );

    const after = browserAt(T0 + DAY);
    const mine = newTriggerState(T0 + DAY);
    await after.area.set({ [STORAGE_KEYS.trigger]: mine });
    // Even a file that carries one does not bring it back.
    await restore(after, JSON.stringify({ ...saved, data: { ...saved.data, [STORAGE_KEYS.trigger]: newTriggerState(T0) } }));
    expect(after.area.dump()[STORAGE_KEYS.trigger]).toEqual(mine);
  });

  it('turns away files that are not TaalNudge backups', async () => {
    const { backup } = browserAt(T0);
    const check = (text: string) => backup.check(new File([text], 'chosen.json'));
    const others = [
      '',
      'Hallo',
      '[]',
      '{}',
      JSON.stringify({ app: 'anki', format: 1, data: {} }),
      JSON.stringify({ app: 'taalnudge', format: 1 }),
      JSON.stringify({ app: 'taalnudge', format: '1', data: {} }),
      JSON.stringify({ app: 'taalnudge', format: 0, data: {} }),
    ];
    for (const text of others) expect(await check(text)).toEqual({ ok: false, problem: 'not-backup' });
    expect(await check(JSON.stringify({ app: 'taalnudge', format: BACKUP_FORMAT + 1, data: {} }))).toEqual({ ok: false, problem: 'newer' });

    // Within a backup, anything malformed is dropped, as it is when read from storage: here a picture that is not an image.
    const result = await check(
      JSON.stringify({
        app: 'taalnudge',
        format: BACKUP_FORMAT,
        exportedAt: 'whenever',
        data: { [STORAGE_KEYS.pictures]: { [HELLO]: T0, [THANKS]: T0 } },
        pictures: { [HELLO]: 'data:image/webp;base64,AQID', [THANKS]: 'data:text/html;base64,PHNjcmlwdD4=' },
      }),
    );
    if (!result.ok) throw new Error(result.problem);
    expect(result.backup.exportedAt).toBeUndefined();
    expect(result.backup.records.pictures).toEqual({ [HELLO]: T0 });
    expect(Object.keys(result.backup.pictures)).toEqual([HELLO]);
  });

  it('adds the backup to newer progress: whatever was done since stays', async () => {
    const before = browserAt(T0);
    await before.store.updateProgress((progress) => completeLesson(progress, index, 'x0-a-hello', [], 'focused', T0 - 2 * DAY));
    await before.store.updateProgress((progress) => completeLesson(progress, index, 'x0-a-thanks', [], 'focused', T0 - DAY));
    await before.store.setNote(HELLO, 'Written before the backup', T0 - DAY);
    await before.store.setNote(THANKS, 'Na het eten.', T0 - DAY);
    await addPicture(before, HELLO, [1], T0 - DAY);
    await addPicture(before, THANKS, [2], T0 - DAY);
    await before.store.setDraft('d-1', { id: 'd-1', text: 'Ik ben gewerkt.', prompt: '', exerciseId: '', at: T0 - DAY });
    await before.store.setMission('gemeente', T0 - DAY);
    await before.store.setMission('huren', T0 - DAY);
    const text = await savedText(before);

    // Since the backup, a fresh start: lesson 1 again, a newer note and another picture for it, a new draft.
    const after = browserAt(T0 + DAY);
    await after.store.updateProgress((progress) => completeLesson(progress, index, 'x0-a-hello', [], 'focused', T0 + DAY));
    await after.store.setNote(HELLO, 'Written since', T0 + DAY);
    await after.store.setNote(THANKS, 'Older than the backup’s', T0 - 2 * DAY);
    await addPicture(after, HELLO, [3], T0 + DAY);
    await after.store.setDraft('d-2', { id: 'd-2', text: 'Ik heb gewerkt.', prompt: '', exerciseId: '', at: T0 + DAY });
    await after.store.setMission('huren', T0 + DAY);
    await after.backup.save();
    await restore(after, text);
    // The backup saved here since is newer than the restored file.
    expect(await after.backup.lastSaved()).toBe(T0 + DAY);

    const progress = await after.store.readProgress();
    expect(progress.items[HELLO]?.lastPracticedAt).toBe(T0 + DAY);
    expect(progress.lessons['x0-a-hello']?.completedAt).toBe(T0 + DAY);
    expect(progress.items[THANKS]?.lastPracticedAt).toBe(T0 - DAY);
    expect(progress.lessons['x0-a-thanks']?.completedAt).toBe(T0 - DAY);
    expect(await after.store.readNotes()).toEqual({
      [HELLO]: { text: 'Written since', at: T0 + DAY },
      [THANKS]: { text: 'Na het eten.', at: T0 - DAY },
    });
    expect(await after.store.readPictures()).toEqual({ [HELLO]: T0 + DAY, [THANKS]: T0 - DAY });
    expect(await pictureBytes(after, HELLO)).toEqual([3]);
    expect(await pictureBytes(after, THANKS)).toEqual([2]);
    expect(Object.keys(await after.store.readDrafts()).sort()).toEqual(['d-1', 'd-2']);
    // A mission ticked since keeps its time here; one ticked only before the backup comes back.
    expect(await after.store.readMissions()).toEqual({ gemeente: T0 - DAY, huren: T0 + DAY });
  });

  it('takes the settings from the backup but keeps the sites as they are here', async () => {
    const before = browserAt(T0);
    await before.store.updatePreferences({ onboarded: true, sites: siteRecord(['x', 'youtube']), promptAfterMinutes: 15, snoozeUntil: T0 + HOUR });
    const text = await savedText(before);

    // After a reinstall no site has access, so none is on, and prompts stay off until the learner turns sites on.
    const fresh = browserAt(T0 + DAY);
    await restore(fresh, text);
    expect(await fresh.store.readPreferences()).toMatchObject({ onboarded: true, sites: siteRecord(), promptAfterMinutes: 15, snoozeUntil: undefined });

    // A browser where the learner already turned NOS on keeps exactly that.
    const other = browserAt(T0 + DAY);
    await other.store.updatePreferences({ onboarded: true, sites: siteRecord(['nos']), hetImage: 'glowing hot' });
    await restore(other, text);
    expect(await other.store.readPreferences()).toMatchObject({ sites: siteRecord(['nos']), promptAfterMinutes: 15, hetImage: 'glowing hot' });
  });
});

describe('the reminder to back up', () => {
  /** Progress with answers on each of the given days. */
  const practised = (...times: Array<number>) => ({ ...emptyProgress(), days: Object.fromEntries(times.map((at) => [dayKey(at), 5])) });

  it('waits for three days of practice before the first reminder', () => {
    expect(backupDue(emptyProgress(), {}, T0)).toBe(false);
    expect(backupDue(practised(T0 - DAY, T0), {}, T0)).toBe(false);
    expect(backupDue(practised(T0 - 2 * DAY, T0 - DAY, T0), {}, T0)).toBe(true);
  });

  it('comes back two weeks after a backup, if there was practice since', () => {
    const before = [T0 - 20 * DAY, T0 - 19 * DAY, T0 - 18 * DAY];
    expect(backupDue(practised(...before, T0 - DAY), { savedAt: T0 - 13 * DAY }, T0)).toBe(false);
    expect(backupDue(practised(...before, T0 - DAY), { savedAt: T0 - 14 * DAY }, T0)).toBe(true);
    // Nothing practised since the backup: there is nothing new to lose.
    expect(backupDue(practised(...before), { savedAt: T0 - 14 * DAY }, T0)).toBe(false);
  });

  it('stays away for two weeks after Not now, and until the next interval after a backup', async () => {
    const browser = browserAt(T0);
    const progress = practised(T0 - 2 * DAY, T0 - DAY, T0);
    expect(await browser.backup.reminder(progress)).toEqual({ lastSaved: undefined });
    await browser.backup.putOffReminder();
    expect(await browser.backup.reminder(progress)).toBeUndefined();
    browser.advance(13 * DAY);
    expect(await browser.backup.reminder(progress)).toBeUndefined();
    browser.advance(DAY);
    expect(await browser.backup.reminder(progress)).toEqual({ lastSaved: undefined });

    const savedAt = await browser.backup.save();
    expect(await browser.backup.reminder(progress)).toBeUndefined();
    const later = browser.advance(14 * DAY);
    expect(await browser.backup.reminder(practised(T0, later))).toEqual({ lastSaved: savedAt });
  });
});
