// Phase 6 in the UI: sending writing for correction and adding the corrected version.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WriteExercise } from '../../src/curriculum/types';
import type { SessionPlan } from '../../src/engine/plan';
import { PanelApp } from '../../src/ui/panel/PanelApp';
import { correctionRequest } from '../../src/ui/player/corrections';
import { SessionPlayer } from '../../src/ui/player/SessionPlayer';
import { makeCourse } from '../fixtures/curriculum';
import { makeEnv, renderUi, setupLearning, silentSpeaker } from './harness';

const course = makeCourse();

const write: WriteExercise = {
  id: 'write',
  stage: 'transfer',
  kind: 'write',
  prompt: 'Tell a colleague what you did yesterday.',
  explanation: 'Past tense with hebben.',
  mustInclude: [['gisteren']],
  minWords: 3,
  modelAnswer: 'Ik heb gisteren gewerkt.',
};

const plan: SessionPlan = {
  kind: 'lesson',
  mode: 'focused',
  lessonId: 'x0-a-hello',
  steps: [{ type: 'exercise', planned: { key: 'w', exerciseId: 'x0-a-hello/write', lessonId: 'x0-a-hello', exercise: write, itemIds: ['x0-a-hello/hallo-daar'], generated: false } }],
};

async function writeAndCheck(user: ReturnType<typeof userEvent.setup>, surface: 'panel' | 'card' = 'panel') {
  const setup = setupLearning(course);
  renderUi(makeEnv(setup, { surface }), <SessionPlayer plan={plan} onExit={vi.fn()} onAction={vi.fn()} />);
  await user.type(screen.getByRole('textbox', { name: 'Your message in Dutch' }), 'Ik ben gisteren gewerkt.');
  await user.click(screen.getByRole('button', { name: 'Check' }));
  return setup;
}

describe('getting writing corrected', () => {
  it('copies the text with a request and keeps it waiting for the correction', async () => {
    const user = userEvent.setup();
    const setup = await writeAndCheck(user);
    const section = screen.getByRole('region', { name: 'Get it corrected' });
    await user.click(within(section).getByRole('button', { name: 'Copy for correction' }));
    expect(await within(section).findByText(/^Copied\. Send it to a tutor/)).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(correctionRequest('Ik ben gisteren gewerkt.'));
    expect(correctionRequest('Ik ben gisteren gewerkt.')).toMatch(/^Kun je mijn Nederlands verbeteren\?.*\n\nIk ben gisteren gewerkt\.$/s);
    expect(Object.values(await setup.store.readDrafts())).toMatchObject([{ text: 'Ik ben gisteren gewerkt.', prompt: write.prompt, exerciseId: 'x0-a-hello/write' }]);
  });

  it('offers the text to copy by hand when the clipboard refuses', async () => {
    const user = userEvent.setup();
    const setup = await writeAndCheck(user);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    await user.click(screen.getByRole('button', { name: 'Copy for correction' }));
    expect(await screen.findByRole('textbox', { name: 'Copy it from here (⌘C or Ctrl+C)' })).toHaveValue(correctionRequest('Ik ben gisteren gewerkt.'));
    expect(Object.keys(await setup.store.readDrafts())).toHaveLength(1);
  });

  it('turns a pasted correction into practice straight away', async () => {
    const user = userEvent.setup();
    const setup = await writeAndCheck(user);
    await user.click(screen.getByRole('button', { name: 'Add the corrected version' }));
    await user.type(await screen.findByRole('textbox', { name: 'Paste the corrected version' }), 'Ik heb gisteren gewerkt.');
    await user.click(screen.getByRole('button', { name: 'Save correction' }));
    expect(await screen.findByText('1 correction added to your reviews.')).toBeInTheDocument();
    expect(Object.values(await setup.store.readCorrections())).toMatchObject([{ sentence: 'Ik ___ gisteren gewerkt.', answers: ['heb'], wrote: 'ben' }]);
    expect(await setup.store.readDrafts()).toEqual({});
    // The rating stays the learner's: the zone still asks.
    expect(screen.getByText('Compare with the model answer. Did yours work?')).toBeInTheDocument();
  });

  it('is left out of the in-page card', async () => {
    const user = userEvent.setup();
    await writeAndCheck(user, 'card');
    expect(screen.getByText('Compare with the model answer. Did yours work?')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Get it corrected' })).not.toBeInTheDocument();
  });
});

describe('the Review tab', () => {
  it('lists writing waiting for correction, and takes the correction there', async () => {
    const user = userEvent.setup();
    const setup = setupLearning(course);
    await setup.store.updatePreferences({ onboarded: true });
    await setup.learning.saveDraft({ text: 'Hoi Sanne. Ik ben morgen niet op de werk.', prompt: 'Tell Sanne you are off tomorrow.', exerciseId: 'x' });
    render(<PanelApp deps={{ learning: setup.learning, course, speaker: silentSpeaker(), now: setup.now }} />);
    await user.click(await screen.findByRole('button', { name: 'Review' }));
    expect(screen.getByRole('heading', { name: 'Waiting for correction (1)' })).toBeInTheDocument();
    expect(screen.getByText('Hoi Sanne. Ik ben morgen niet op de werk.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add correction' }));
    await user.type(screen.getByRole('textbox', { name: 'Paste the corrected version' }), 'Hoi Sanne. Ik ben morgen niet op het werk.');
    await user.click(screen.getByRole('button', { name: 'Save correction' }));
    expect(await screen.findByText('1 correction added to your reviews.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Waiting for correction (0)' })).toBeInTheDocument());
    expect(screen.queryByText('Hoi Sanne. Ik ben morgen niet op de werk.')).not.toBeInTheDocument();
  });

  it('removes a draft the learner gives up on', async () => {
    const user = userEvent.setup();
    const setup = setupLearning(course);
    await setup.store.updatePreferences({ onboarded: true });
    await setup.learning.saveDraft({ text: 'Ik ben ziek.', prompt: '', exerciseId: 'x' });
    render(<PanelApp deps={{ learning: setup.learning, course, speaker: silentSpeaker(), now: setup.now }} />);
    await user.click(await screen.findByRole('button', { name: 'Review' }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByText('Ik ben ziek.')).not.toBeInTheDocument());
    expect(await setup.store.readDrafts()).toEqual({});
  });
});
