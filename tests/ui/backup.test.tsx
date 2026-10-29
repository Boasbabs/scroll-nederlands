// Backing up progress to a file and restoring it: in Settings, and on the first onboarding screen after a reinstall.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { exerciseSteps } from '../../src/engine/plan';
import { DAY } from '../../src/engine/schedule';
import { createMemoryPictures } from '../../src/images/own';
import { siteRecord } from '../../src/sites';
import { createProgressBackup } from '../../src/storage/backup';
import { PanelApp } from '../../src/ui/panel/PanelApp';
import { setupLearning, silentSpeaker, T0 } from './harness';

/** A learner in a browser of their own; the backup files they save land in `saved`. */
function learner() {
  const setup = setupLearning();
  const saved: Array<{ name: string; file: Blob }> = [];
  const backup = createProgressBackup({
    store: setup.store,
    blobs: createMemoryPictures(),
    version: '0.1.0',
    saveFile: (name, file) => void saved.push({ name, file }),
    now: setup.now,
  });
  return { ...setup, backup, saved };
}

type Learner = ReturnType<typeof learner>;

function renderPanel(person: Learner) {
  return render(<PanelApp deps={{ learning: person.learning, course: person.course, speaker: silentSpeaker(), now: person.now, backup: person.backup }} />);
}

/** Completes a lesson the way the player would, every answer right. */
async function finishLesson(person: Learner, lessonId: string) {
  const plan = await person.learning.startLesson(lessonId, 'focused');
  await person.learning.finish(
    plan,
    exerciseSteps(plan).map((planned) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct: true })),
  );
}

/** The file saved by a learner who did lesson 1 yesterday, in quiet mode, with X and YouTube on. */
async function yesterdaysBackup(): Promise<File> {
  const before = learner();
  before.advance(-DAY);
  await before.store.updatePreferences({ onboarded: true, quietMode: true, sites: siteRecord(['x', 'youtube']) });
  await finishLesson(before, 'x0-a-hello');
  await before.backup.save();
  const { name, file } = before.saved[0]!;
  return new File([file], name, { type: 'application/json' });
}

const notBackup = () => new File(['{"app":"anki","cards":[]}'], 'deck.json', { type: 'application/json' });
const SAID = 'Saved 26 Oct 2026, with 1 lesson done. It’s added to your progress here, and your settings come back as they were.';

describe('Back up progress', () => {
  it('saves a backup file from Settings and shows when it was made', async () => {
    const user = userEvent.setup();
    const me = learner();
    await me.store.updatePreferences({ onboarded: true });
    const { unmount } = renderPanel(me);
    await user.click(await screen.findByRole('button', { name: 'Settings' }));

    const save = screen.getByRole('button', { name: 'Back up progress' });
    expect(save).toHaveAccessibleDescription('Saves a file you can restore from if TaalNudge is removed.');
    await user.click(save);
    await waitFor(() => expect(save).toHaveAccessibleDescription('Last backup: today, 09:00'));
    expect(me.saved.map(({ name }) => name)).toEqual(['taalnudge-backup-2026-10-27.json']);
    unmount();

    // Settings shows it again the next time it opens.
    renderPanel(me);
    await user.click(await screen.findByRole('button', { name: 'Settings' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Back up progress' })).toHaveAccessibleDescription('Last backup: today, 09:00'));
  });
});

describe('Restore from file', () => {
  it('restores in Settings once confirmed, and turns away other files', async () => {
    const user = userEvent.setup();
    const file = await yesterdaysBackup();
    const me = learner();
    await me.store.updatePreferences({ onboarded: true });
    renderPanel(me);
    await user.click(await screen.findByRole('button', { name: 'Settings' }));
    const input = screen.getByLabelText('Backup file');

    await user.click(screen.getByRole('button', { name: 'Restore from file' }));
    await user.upload(input, notBackup());
    expect(await screen.findByText('That file isn’t a TaalNudge backup. Backup files start with “taalnudge-backup”.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.upload(input, file);
    const dialog = await screen.findByRole('dialog', { name: 'Restore this backup?' });
    expect(within(dialog).getByText(`${SAID} Prompts stay off until you turn your sites on again.`)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(screen.queryByText(/isn’t a TaalNudge backup/)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect((await me.store.readProgress()).lessons).toEqual({});

    await user.upload(input, file);
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Restore' }));
    expect(await screen.findByText('Progress restored.')).toBeInTheDocument();
    expect((await me.store.readProgress()).lessons['x0-a-hello']?.completedAt).toBe(T0 - DAY);
    // Yesterday's lesson keeps the streak going, and the settings came back, but no site access did.
    expect(await screen.findByLabelText('1-day streak')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Quiet mode' })).toHaveAttribute('aria-checked', 'true');
    expect((await me.store.readPreferences()).sites).toEqual(siteRecord());
    expect(screen.getByText('Prompts are off')).toBeInTheDocument();
  });

  it('restores from the first onboarding screen after a reinstall and lands on Today', async () => {
    const user = userEvent.setup();
    const file = await yesterdaysBackup();
    const reinstalled = learner();
    renderPanel(reinstalled);

    expect(await screen.findByRole('heading', { name: 'Hallo · Hoi · Dag' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore from a backup' }));
    const input = screen.getByLabelText('Backup file');
    await user.upload(input, notBackup());
    expect(await screen.findByText(/That file isn’t a TaalNudge backup/)).toBeInTheDocument();

    await user.upload(input, file);
    const dialog = await screen.findByRole('dialog', { name: 'Restore this backup?' });
    expect(within(dialog).getByText(`${SAID} Prompts stay off until you turn your sites on again.`)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Restore' }));

    // Today, carrying on after yesterday's lesson, with the streak back.
    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(screen.getByLabelText('1-day streak')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(await reinstalled.store.readPreferences()).toMatchObject({ onboarded: true, quietMode: true, sites: siteRecord() });
  });
});

describe('the reminder to back up', () => {
  /** A learner who did a lesson on each of the last three days, today included. */
  async function threeDaysIn() {
    const me = learner();
    await me.store.updatePreferences({ onboarded: true });
    me.advance(-2 * DAY);
    await finishLesson(me, 'x0-a-hello');
    me.advance(DAY);
    await finishLesson(me, 'x0-a-thanks');
    me.advance(DAY);
    await finishLesson(me, 'x0-a-bye');
    return me;
  }

  /** Renders the panel and waits for Today's check, so a reminder that is not there is really not coming. */
  async function openToday(person: Learner) {
    const check = vi.spyOn(person.backup, 'reminder');
    const view = renderPanel(person);
    await waitFor(() => expect(check).toHaveBeenCalled());
    const due = await check.mock.results.at(-1)!.value;
    check.mockRestore();
    return { view, due };
  }

  it('waits for three days of practice, then saves from Today and names the file', async () => {
    const user = userEvent.setup();
    const newcomer = learner();
    await newcomer.store.updatePreferences({ onboarded: true });
    await finishLesson(newcomer, 'x0-a-hello');
    const first = await openToday(newcomer);
    expect(first.due).toBeUndefined();
    expect(screen.queryByText('Back up your progress')).not.toBeInTheDocument();
    first.view.unmount();

    const me = await threeDaysIn();
    await openToday(me);
    const card = (await screen.findByRole('heading', { name: 'Back up your progress' })).closest('section')!;
    expect(within(card).getByText('Removing TaalNudge deletes your progress. A backup file brings it back.')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Back up' }));
    expect(await within(card).findByRole('heading', { name: 'Backup saved' })).toBeInTheDocument();
    expect(card).toHaveTextContent('Saved as taalnudge-backup-2026-10-27.json.');
    expect(me.saved.map(({ name }) => name)).toEqual(['taalnudge-backup-2026-10-27.json']);

    // Settings knows about it too.
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Back up progress' })).toHaveAccessibleDescription('Last backup: today, 09:00'));
  });

  it('keeps away for two weeks after Not now, and later says when the last backup was', async () => {
    const user = userEvent.setup();
    const me = await threeDaysIn();
    const first = await openToday(me);
    await user.click(within((await screen.findByRole('heading', { name: 'Back up your progress' })).closest('section')!).getByRole('button', { name: 'Not now' }));
    expect(screen.queryByText('Back up your progress')).not.toBeInTheDocument();
    first.view.unmount();

    me.advance(13 * DAY);
    const putOff = await openToday(me);
    expect(putOff.due).toBeUndefined();
    expect(screen.queryByText('Back up your progress')).not.toBeInTheDocument();
    putOff.view.unmount();

    // Two weeks on it is back. A backup then, and more practice two weeks after that, bring it back with the date.
    me.advance(DAY);
    const back = await openToday(me);
    await user.click(within((await screen.findByRole('heading', { name: 'Back up your progress' })).closest('section')!).getByRole('button', { name: 'Back up' }));
    expect((await screen.findByRole('heading', { name: 'Backup saved' })).closest('section')).toHaveTextContent('Saved as taalnudge-backup-2026-11-10.json.');
    back.view.unmount();

    me.advance(15 * DAY);
    await finishLesson(me, 'x0-a-hello');
    await openToday(me);
    expect(await screen.findByText('Your last backup is from 10 Nov 2026.')).toBeInTheDocument();
  });
});
