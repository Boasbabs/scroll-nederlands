import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { course as realCourse } from '../../src/curriculum';
import { exerciseSteps } from '../../src/engine/plan';
import { DAY, HOUR } from '../../src/engine/schedule';
import type { SiteId } from '../../src/sites';
import type { SitePermissions } from '../../src/ui/env';
import { PanelApp } from '../../src/ui/panel/PanelApp';
import { setupLearning, silentSpeaker, T0 } from './harness';

type Setup = ReturnType<typeof setupLearning>;

function fakePermissions(answer = true) {
  const granted: Record<SiteId, boolean> = { x: false, linkedin: false };
  const permissions = {
    request: vi.fn(async (sites: ReadonlyArray<SiteId>) => {
      if (answer) for (const site of sites) granted[site] = true;
      return answer;
    }),
    granted: vi.fn(async () => ({ ...granted })),
    revoke: vi.fn(async (sites: ReadonlyArray<SiteId>) => {
      for (const site of sites) granted[site] = false;
    }),
  } satisfies SitePermissions;
  return permissions;
}

function renderPanel(setup: Setup, permissions: SitePermissions = fakePermissions()) {
  return render(<PanelApp deps={{ learning: setup.learning, course: setup.course, speaker: silentSpeaker(), permissions, now: setup.now }} />);
}

/** Completes a lesson the way the player would, every answer right. */
async function completeLesson(setup: Setup, lessonId: string) {
  const plan = await setup.learning.startLesson(lessonId, 'focused');
  const results = exerciseSteps(plan).map((planned) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct: true }));
  await setup.learning.finish(plan, results);
}

async function onboardedLearner(lessons: Array<string> = []) {
  const setup = setupLearning();
  await setup.store.updatePreferences({ onboarded: true });
  for (const lessonId of lessons) await completeLesson(setup, lessonId);
  return setup;
}

describe('side panel onboarding', () => {
  it('asks for site access from the click, saves the choices and starts lesson 1', async () => {
    const user = userEvent.setup();
    const setup = setupLearning();
    const permissions = fakePermissions();
    renderPanel(setup, permissions);

    expect(await screen.findByRole('heading', { name: 'Hallo · Hoi · Dag' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Get started' }));

    const next = screen.getByRole('button', { name: 'Continue' });
    expect(next).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /I’m new to Dutch/ }));
    expect(screen.getByRole('radio', { name: /Start from scratch/ })).toHaveAttribute('aria-checked', 'true');
    await user.click(next);

    await user.click(within(screen.getByRole('group', { name: 'Prompt after' })).getByRole('button', { name: '15 min' }));
    // Chrome only shows its dialog for a user gesture, so the request must happen inside the click.
    fireEvent.click(screen.getByRole('button', { name: 'Turn on prompts' }));
    expect(permissions.request).toHaveBeenCalledWith(['x', 'linkedin']);

    expect(await screen.findByText('Prompts are on. See you on your next scroll.')).toBeInTheDocument();
    await waitFor(async () => expect((await setup.store.readPreferences()).sites).toEqual({ x: true, linkedin: true }));
    expect((await setup.store.readPreferences()).promptAfterMinutes).toBe(15);

    await user.click(screen.getByRole('button', { name: 'Start lesson 1' }));
    expect(await screen.findByRole('heading', { name: /Hallo daar/ })).toBeInTheDocument();
    expect((await setup.store.readPreferences()).onboarded).toBe(true);
    expect((await setup.store.readProgress()).lessons['x0-a-hello']?.startedAt).toBe(T0);
  });

  it('keeps going with prompts off when access is denied or skipped', async () => {
    const user = userEvent.setup();
    const denied = setupLearning();
    const permissions = fakePermissions(false);
    const { unmount } = renderPanel(denied, permissions);
    await user.click(await screen.findByRole('button', { name: 'Get started' }));
    await user.click(screen.getByRole('radio', { name: /I’m new to Dutch/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('checkbox', { name: 'LinkedIn' }));
    await user.click(screen.getByRole('button', { name: 'Turn on prompts' }));
    expect(permissions.request).toHaveBeenCalledWith(['x']);
    expect(await screen.findByText('Prompts are off. You can turn them on in Settings.')).toBeInTheDocument();
    await waitFor(async () => expect((await denied.store.readPreferences()).sites).toEqual({ x: false, linkedin: false }));
    unmount();

    const skipped = setupLearning();
    const unused = fakePermissions();
    renderPanel(skipped, unused);
    await user.click(await screen.findByRole('button', { name: 'Get started' }));
    await user.click(screen.getByRole('radio', { name: /I’m new to Dutch/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(unused.request).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Start lesson 1' }));
    expect(await screen.findByRole('heading', { name: /Hallo daar/ })).toBeInTheDocument();
  });

  it('starts the stage checkpoint for a learner who knows some Dutch', async () => {
    const user = userEvent.setup();
    const setup = setupLearning(realCourse);
    const placement = vi.spyOn(setup.learning, 'startPlacement');
    renderPanel(setup);

    await user.click(await screen.findByRole('button', { name: 'Get started' }));
    await user.click(screen.getByRole('radio', { name: /I know some words/ }));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /Take the Stage 0 checkpoint/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Not now' }));
    await user.click(screen.getByRole('button', { name: 'Start the Stage 0 checkpoint' }));

    expect(placement).toHaveBeenCalledWith('s0');
    expect(await screen.findByRole('button', { name: 'Check' })).toBeDisabled();
  });
});

describe('Today', () => {
  it('shows the caught-up block until reviews are due, then the review card', async () => {
    const user = userEvent.setup();
    const setup = await onboardedLearner(['x0-a-hello']);
    const { unmount } = renderPanel(setup);

    expect(await screen.findByRole('heading', { name: 'All caught up' })).toBeInTheDocument();
    expect(screen.getByText('Next review tomorrow · 1 item')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review now' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(screen.getByText('1/7')).toBeInTheDocument();
    unmount();

    setup.advance(2 * DAY);
    renderPanel(setup);
    expect(await screen.findByText('1 review due')).toBeInTheDocument();
    expect(screen.getByLabelText('1 due')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Review now' }));
    expect(await screen.findByText('Review · 1 left')).toBeInTheDocument();
  });

  it('continues the course from the Continue card', async () => {
    const user = userEvent.setup();
    const setup = await onboardedLearner(['x0-a-hello']);
    renderPanel(setup);
    const card = (await screen.findByRole('heading', { name: 'Thank you' })).closest('section')!;
    await user.click(within(card).getByRole('button', { name: 'Start' }));
    expect(await screen.findByRole('heading', { name: /Dank je wel/ })).toBeInTheDocument();
  });
});

describe('Settings', () => {
  async function openSettings(setup: Setup, permissions = fakePermissions()) {
    const user = userEvent.setup();
    renderPanel(setup, permissions);
    await user.click(await screen.findByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    return { user, permissions };
  }

  it('applies toggles and chips at once', async () => {
    const setup = await onboardedLearner();
    const { user, permissions } = await openSettings(setup);
    const prefs = () => setup.store.readPreferences();

    expect(screen.getByText('Prompts are off')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Prompts on X' }));
    expect(permissions.request).toHaveBeenCalledWith(['x']);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Prompts on X' })).toHaveAttribute('aria-checked', 'true'));
    expect((await prefs()).sites).toEqual({ x: true, linkedin: false });
    expect(screen.queryByText('Prompts are off')).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Prompts on X' }));
    expect(permissions.revoke).toHaveBeenCalledWith(['x']);
    await waitFor(async () => expect((await prefs()).sites.x).toBe(false));

    await user.click(within(screen.getByRole('group', { name: 'Prompt after' })).getByRole('button', { name: '30 min' }));
    await waitFor(async () => expect((await prefs()).promptAfterMinutes).toBe(30));
    expect(within(screen.getByRole('group', { name: 'Prompt after' })).getByRole('button', { name: '30 min' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('switch', { name: 'Quiet mode' }));
    await waitFor(async () => expect((await prefs()).quietMode).toBe(true));

    await user.click(screen.getByRole('button', { name: 'Snooze' }));
    await user.click(within(screen.getByRole('group', { name: 'Snooze for' })).getByRole('button', { name: '1 hour' }));
    expect(await screen.findByText('Snoozed until 10:00')).toBeInTheDocument();
    expect((await prefs()).snoozeUntil).toBe(T0 + HOUR);
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    await waitFor(async () => expect((await prefs()).snoozeUntil).toBeUndefined());
    expect(screen.getByRole('button', { name: 'Snooze' })).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Autoplay audio' }));
    await user.click(within(screen.getByRole('group', { name: 'Audio speed' })).getByRole('button', { name: 'Slow' }));
    await user.click(screen.getByRole('switch', { name: 'Sound effects' }));
    await waitFor(async () => expect(await prefs()).toMatchObject({ autoplayAudio: false, speechRate: 0.85, soundEffects: false }));
  });

  it('keeps prompts off when Chrome refuses access', async () => {
    const setup = await onboardedLearner();
    const { user } = await openSettings(setup, fakePermissions(false));
    await user.click(screen.getByRole('button', { name: 'Turn on' }));
    expect(await screen.findByText('Chrome did not allow access, so prompts stay off.')).toBeInTheDocument();
    expect((await setup.store.readPreferences()).sites).toEqual({ x: false, linkedin: false });
  });

  it('asks before resetting, and only Reset everything clears progress', async () => {
    const setup = await onboardedLearner(['x0-a-hello']);
    const { user } = await openSettings(setup);

    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset all progress?' });
    expect(within(dialog).getByText('Lessons and reviews go back to the start. This can’t be undone.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Keep my progress' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Keep my progress' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect((await setup.store.readProgress()).lessons['x0-a-hello']?.completedAt).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    await user.click(screen.getByRole('button', { name: 'Reset everything' }));
    await waitFor(async () => expect(Object.keys((await setup.store.readProgress()).lessons)).toEqual([]));
    expect((await setup.store.readPreferences()).onboarded).toBe(true);
  });
});

describe('Course', () => {
  it('marks done, current and locked lessons, and replays a done one', async () => {
    const user = userEvent.setup();
    const setup = await onboardedLearner(['x0-a-hello']);
    renderPanel(setup);
    await user.click(await screen.findByRole('button', { name: 'Course' }));

    const stage = screen.getByRole('button', { name: /Stage X0/ });
    expect(stage).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Module A/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Hello there: done, play again' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Goodbye: locked' })).toBeDisabled();
    const current = screen.getByRole('button', { name: 'Thank you: start' }).closest('li')!;
    expect(current).toHaveAttribute('data-current');
    expect(within(current).getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stage X1/ })).toHaveAttribute('aria-expanded', 'false');

    // The checkpoint module shows its node with the checkpoint label.
    await user.click(screen.getByRole('button', { name: /Module 2: Check/ }));
    expect(screen.getByRole('button', { name: 'Checkpoint (checkpoint): locked' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Hello there: done, play again' }));
    expect(await screen.findByRole('heading', { name: /Hallo daar/ })).toBeInTheDocument();
  });

  it('starts a placement checkpoint from Jump here', async () => {
    const user = userEvent.setup();
    const setup = await onboardedLearner(['x0-a-hello']);
    const placement = vi.spyOn(setup.learning, 'startPlacement');
    renderPanel(setup);
    await user.click(await screen.findByRole('button', { name: 'Course' }));

    const jumps = screen.getAllByRole('button', { name: 'Jump here' });
    expect(jumps).toHaveLength(1);
    await user.click(jumps[0]!);
    expect(placement).toHaveBeenCalledWith('x0');
    expect(await screen.findByText('Question 1')).toBeInTheDocument();
  });
});
