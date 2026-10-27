import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HOUR, MINUTE } from '../../src/engine/schedule';
import { NudgeApp, type NudgeController } from '../../src/ui/nudge/NudgeApp';
import { TOAST_MS } from '../../src/ui/nudge/NudgeCard';
import { makeEnv, renderUi, setupLearning, T0 } from './harness';

function fakeController(failed: ReadonlySet<string> = new Set()) {
  return {
    release: vi.fn(),
    rememberFailed: vi.fn(),
    excludeItemIds: vi.fn(() => failed),
    close: vi.fn(),
  } satisfies NudgeController;
}

function renderNudge(setup = setupLearning(), controller = fakeController()) {
  const openSidePanel = vi.fn();
  renderUi(
    makeEnv(setup, { surface: 'card', openSidePanel }),
    <NudgeApp preview={{ dutch: 'Hallo daar', english: 'Hello there' }} controller={controller} />,
  );
  return { setup, controller, openSidePanel };
}

describe('in-page prompt card', () => {
  it('Not now and × dismiss the prompt for this interval', async () => {
    const user = userEvent.setup();
    const { controller } = renderNudge();
    expect(screen.getByText('Ready for a 2-minute Dutch break?')).toBeInTheDocument();
    expect(screen.getByText('Hallo daar')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(controller.release).toHaveBeenCalledTimes(1);
    expect(controller.close).toHaveBeenCalledTimes(1);

    const other = fakeController();
    renderNudge(setupLearning(), other);
    await user.click(screen.getAllByRole('button', { name: 'Close' }).at(-1)!);
    expect(other.release).toHaveBeenCalledTimes(1);
    expect(other.close).toHaveBeenCalledTimes(1);
  });

  it('snoozes from the ⋯ menu and Undo brings the card back', async () => {
    const user = userEvent.setup();
    const { setup, controller } = renderNudge();
    await user.click(screen.getByRole('button', { name: 'More options' }));
    const menu = screen.getByRole('menu', { name: 'Prompt options' });
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Snooze 30 min · until 09:30',
      'Snooze 1 hour',
      'Snooze until tomorrow',
      'Quiet mode',
    ]);
    expect(within(menu).getAllByRole('menuitem')[0]).toHaveFocus();

    await user.click(within(menu).getByRole('menuitem', { name: /Snooze 30 min/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Snoozed until 09:30');
    expect((await setup.store.readPreferences()).snoozeUntil).toBe(T0 + 30 * MINUTE);
    expect(controller.release).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByText('Ready for a 2-minute Dutch break?')).toBeInTheDocument();
    expect((await setup.store.readPreferences()).snoozeUntil).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'More options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Snooze 1 hour' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Snoozed until 10:00');
    expect((await setup.store.readPreferences()).snoozeUntil).toBe(T0 + HOUR);
    await user.click(within(screen.getByRole('status')).getByRole('button', { name: 'Close' }));
    expect(controller.release).toHaveBeenCalledTimes(1);
    expect(controller.close).toHaveBeenCalledTimes(1);
  });

  it('turns on quiet mode with Undo, and the toast leaves by itself', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { setup, controller } = renderNudge();
      await user.click(screen.getByRole('button', { name: 'More options' }));
      await user.click(screen.getByRole('menuitem', { name: 'Quiet mode' }));
      expect(await screen.findByRole('status')).toHaveTextContent('Quiet mode is on');
      expect((await setup.store.readPreferences()).quietMode).toBe(true);

      await user.click(screen.getByRole('button', { name: 'Undo' }));
      expect(await screen.findByText('Ready for a 2-minute Dutch break?')).toBeInTheDocument();
      expect((await setup.store.readPreferences()).quietMode).toBe(false);

      await user.click(screen.getByRole('button', { name: 'More options' }));
      await user.click(screen.getByRole('menuitem', { name: 'Quiet mode' }));
      await screen.findByRole('status');
      act(() => vi.advanceTimersByTime(TOAST_MS));
      expect(controller.release).toHaveBeenCalledTimes(1);
      expect(controller.close).toHaveBeenCalledTimes(1);
      expect((await setup.store.readPreferences()).quietMode).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('Learn now runs a micro-lesson, and Done passes its misses to the trigger', async () => {
    const user = userEvent.setup();
    const setup = setupLearning();
    const startNext = vi.spyOn(setup.learning, 'startNext');
    const exclude = new Set(['x0-a-thanks/dank-je-wel']);
    const { controller } = renderNudge(setup, fakeController(exclude));

    await user.click(screen.getByRole('button', { name: 'Learn now' }));
    expect(startNext).toHaveBeenCalledWith('micro', exclude);
    expect(await screen.findByRole('heading', { name: /Hallo daar/ })).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // A wrong first answer: the compact sheet shows the right one.
    await user.click(screen.getByRole('radio', { name: /Something else/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Not quite')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Got it' }));

    const bank = screen.getByLabelText('Words');
    await user.click(within(bank).getByRole('button', { name: 'Hallo' }));
    await user.click(within(bank).getByRole('button', { name: 'daar' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText(/1\/2 correct/)).toBeInTheDocument();
    expect(controller.rememberFailed).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(controller.rememberFailed).toHaveBeenCalledWith(['x0-a-hello/hallo-daar']);
    expect(controller.release).toHaveBeenCalledTimes(1);
    expect(controller.close).toHaveBeenCalledTimes(1);
    const progress = await setup.store.readProgress();
    expect(progress.lessons['x0-a-hello']?.completedAt).toBe(T0);
    expect(progress.items['x0-a-hello/hallo-daar']?.relearning).toBe(true);
  });

  it('Open side panel at the end opens the panel and closes the card', async () => {
    const user = userEvent.setup();
    const { controller, openSidePanel } = renderNudge();
    await user.click(screen.getByRole('button', { name: 'Learn now' }));
    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: /Hello there/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const bank = screen.getByLabelText('Words');
    await user.click(within(bank).getByRole('button', { name: 'Hallo' }));
    await user.click(within(bank).getByRole('button', { name: 'daar' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.click(await screen.findByRole('button', { name: 'Open side panel' }));
    expect(openSidePanel).toHaveBeenCalledTimes(1);
    expect(controller.rememberFailed).toHaveBeenCalledWith([]);
    expect(controller.close).toHaveBeenCalledTimes(1);
  });

  it('keeps host-page keys out: digits only count while focus is in the card', async () => {
    const user = userEvent.setup();
    renderNudge();
    await user.click(screen.getByRole('button', { name: 'Learn now' }));
    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    const radios = screen.getAllByRole('radio');

    const outside = document.createElement('input');
    document.body.append(outside);
    outside.focus();
    await user.keyboard('1');
    expect(radios.every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true);
    outside.remove();

    radios[0]!.focus();
    await user.keyboard('2');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('says so when there is nothing to practise', async () => {
    const user = userEvent.setup();
    const setup = setupLearning();
    vi.spyOn(setup.learning, 'startNext').mockResolvedValue(undefined);
    vi.spyOn(setup.learning, 'startPractice').mockResolvedValue(undefined);
    const { controller, openSidePanel } = renderNudge(setup);
    await user.click(screen.getByRole('button', { name: 'Learn now' }));
    expect(await screen.findByText('All caught up')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open side panel' }));
    expect(openSidePanel).toHaveBeenCalled();
    await waitFor(() => expect(controller.close).toHaveBeenCalledTimes(1));
  });
});
