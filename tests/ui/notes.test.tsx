// Phase 4 in the player: Make it yours on cards, notes as cues, and the offer for items that keep slipping.
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateExercise, seededRandom, type DrillContext } from '../../src/engine/exercises';
import { planLesson, planWords, type SessionPlan } from '../../src/engine/plan';
import type { ExerciseStage } from '../../src/curriculum/types';
import { SessionPlayer } from '../../src/ui/player/SessionPlayer';
import { makeCourse, testWordThemes } from '../fixtures/curriculum';
import { makeEnv, renderUi, setupLearning } from './harness';

const course = makeCourse({}, testWordThemes);

function play(plan: SessionPlan, setup = setupLearning(course)) {
  renderUi(makeEnv(setup), <SessionPlayer plan={plan} onExit={vi.fn()} onAction={vi.fn()} />);
  return setup;
}

/** A one-exercise review of an item's generated drill. */
function reviewOf(itemId: string, stage: ExerciseStage, context: DrillContext = {}, leech = false): SessionPlan {
  const exercise = generateExercise(course, course.item(itemId)!, stage, 0, seededRandom('ui'), context);
  const planned = { key: 'drill', exerciseId: `gen:${itemId}:${exercise.id}`, lessonId: 'x', exercise, itemIds: [itemId], generated: true, ...(leech ? { leech } : {}) };
  return { kind: 'review', mode: 'focused', steps: [{ type: 'exercise', planned }] };
}

describe('Make it yours', () => {
  it('saves one line about the learner’s life from a word card', async () => {
    const user = userEvent.setup();
    const setup = play(planWords(course, ['w-kitchen/vork'], 'focused', 'seed'));
    await user.click(await screen.findByRole('button', { name: 'Make it yours' }));
    await user.type(screen.getByRole('textbox', { name: /One line about your own life/ }), 'Mijn vork is van zilver.{Enter}');
    expect(await screen.findByText('Mijn vork is van zilver.')).toBeInTheDocument();
    expect(screen.getByText('Your note')).toBeInTheDocument();
    // Enter saved the note; the card did not move on.
    expect(screen.getByRole('heading', { name: 'de vork' })).toBeInTheDocument();
    expect((await setup.store.readNotes())['w-kitchen/vork']?.text).toBe('Mijn vork is van zilver.');
  });

  it('shows and edits a note written before', async () => {
    const user = userEvent.setup();
    const setup = setupLearning(course);
    await setup.learning.saveNote('w-kitchen/vork', 'Mijn vork is van zilver.');
    play(planWords(course, ['w-kitchen/vork'], 'focused', 'seed'), setup);
    expect(await screen.findByText('Mijn vork is van zilver.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const field = screen.getByRole('textbox', { name: /One line about your own life/ });
    await user.clear(field);
    await user.click(screen.getByRole('button', { name: 'Remove note' }));
    await waitFor(async () => expect(await setup.store.readNotes()).toEqual({}));
    expect(await screen.findByRole('button', { name: 'Make it yours' })).toBeInTheDocument();
  });

  it('is offered on the learn card in the side panel, not in the in-page card', async () => {
    const { unmount } = renderUi(makeEnv(setupLearning(course)), <SessionPlayer plan={planLesson(course, 'x0-a-hello', 'focused')} onExit={vi.fn()} onAction={vi.fn()} />);
    expect(await screen.findByRole('button', { name: 'Make it yours' })).toBeInTheDocument();
    unmount();
    renderUi(makeEnv(setupLearning(course), { surface: 'card' }), <SessionPlayer plan={planLesson(course, 'x0-a-hello', 'micro')} onExit={vi.fn()} onAction={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    // Notes load asynchronously: give them the time they took above before checking.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole('button', { name: 'Make it yours' })).not.toBeInTheDocument();
  });
});

describe('notes in reviews', () => {
  it('ask to fill the word into the learner’s own line', () => {
    play(reviewOf('w-kitchen/vork', 'independentRecall', { noteFor: () => 'Mijn vork is van zilver.' }));
    expect(screen.getByRole('heading', { name: 'Fill the gap in your note.' })).toBeInTheDocument();
    expect(document.querySelector('.tn-cloze__sentence')).toHaveTextContent('Mijn is van zilver.');
  });

  it('show a note that does not use the word as a cue', () => {
    play(reviewOf('w-kitchen/mes', 'supportedRecall', { noteFor: () => 'The knife my grandfather gave me' }));
    expect(screen.getByText('Your note')).toBeInTheDocument();
    expect(screen.getByText('The knife my grandfather gave me')).toBeInTheDocument();
  });
});

describe('an item that keeps slipping', () => {
  it('offers Make it yours after a miss, once, and saves the line', async () => {
    const user = userEvent.setup();
    const setup = play(reviewOf('w-kitchen/vork', 'recognition', {}, true));
    await user.click(screen.getAllByRole('radio').find((option) => !option.textContent?.includes('the fork'))!);
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('This one keeps slipping.')).toBeInTheDocument();
    await waitFor(async () => expect(Object.keys(await setup.store.readLeeches())).toEqual(['w-kitchen/vork']));
    await user.click(screen.getByRole('button', { name: 'Make it yours' }));
    await user.type(screen.getByRole('textbox', { name: /One line about your own life/ }), 'Mijn vork is van zilver.{Enter}');
    expect(await screen.findByText('Saved. Your note comes back with this word.')).toBeInTheDocument();
    expect((await setup.store.readNotes())['w-kitchen/vork']?.text).toBe('Mijn vork is van zilver.');
  });

  it('says nothing after a correct answer', async () => {
    const user = userEvent.setup();
    play(reviewOf('w-kitchen/vork', 'recognition', {}, true));
    await user.click(screen.getByRole('radio', { name: /the fork/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.queryByText('This one keeps slipping.')).not.toBeInTheDocument();
  });

  it('is offered on the recall card after “No”, before moving on', async () => {
    const user = userEvent.setup();
    const exercise = generateExercise(course, course.item('w-kitchen/vork')!, 'independentRecall', 0, seededRandom('x'));
    const plan: SessionPlan = {
      kind: 'review',
      mode: 'focused',
      steps: [
        { type: 'exercise', planned: { key: 'a', exerciseId: `gen:w-kitchen/vork:${exercise.id}`, lessonId: 'x', exercise, itemIds: ['w-kitchen/vork'], generated: true, leech: true } },
        { type: 'exercise', planned: { key: 'b', exerciseId: `gen:w-kitchen/mes:${exercise.id}`, lessonId: 'x', exercise: generateExercise(course, course.item('w-kitchen/mes')!, 'independentRecall', 0, seededRandom('y')), itemIds: ['w-kitchen/mes'], generated: true } },
      ],
    };
    play(plan);
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    await user.click(screen.getByRole('button', { name: 'No' }));
    expect(screen.getByText('This one keeps slipping.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByText('This one keeps slipping.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show answer' })).toBeInTheDocument();
  });
});
