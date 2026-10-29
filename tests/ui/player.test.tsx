import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Exercise } from '../../src/curriculum/types';
import { exerciseSteps } from '../../src/engine/plan';
import { Conversation, Highlighted } from '../../src/ui/player/parts';
import { SessionComplete } from '../../src/ui/player/SessionComplete';
import { SessionPlayer } from '../../src/ui/player/SessionPlayer';
import { makeCourse, stageExercises, testPacks } from '../fixtures/curriculum';
import { makeEnv, renderUi, setupLearning } from './harness';

async function startLesson(setup: ReturnType<typeof setupLearning>, lessonId = 'x0-a-hello') {
  const plan = await setup.learning.startLesson(lessonId, 'focused');
  const onExit = vi.fn();
  const onAction = vi.fn();
  renderUi(makeEnv(setup), <SessionPlayer plan={plan} onExit={onExit} onAction={onAction} />);
  return { onExit, onAction };
}

describe('lesson player', () => {
  it('runs learn → answer → feedback → complete and saves the lesson', async () => {
    const user = userEvent.setup();
    const setup = setupLearning();
    const { onAction } = await startLesson(setup);

    expect(screen.getByRole('heading', { name: /Hallo daar/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Recognition: choose the meaning.
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /Hello there/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Word tiles.
    const bank = screen.getByLabelText('Words');
    await user.click(within(bank).getByRole('button', { name: 'Hallo' }));
    await user.click(within(bank).getByRole('button', { name: 'daar' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Typed recall, without the capital letter.
    await user.type(screen.getByLabelText('Your answer in Dutch'), 'hallo daar');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Transfer: a wrong first try is graded wrong; "Try again" is practice.
    await user.type(screen.getByLabelText('Your answer in Dutch'), 'Hoi');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByText('Correct answer:')).toBeInTheDocument();
    expect(screen.getByText('Your answer:')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Got it' }));

    // The miss comes back at the end, labelled Review, and is not graded again.
    expect(screen.getByText('Review')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your answer in Dutch'), 'Hallo daar');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Lesson complete!')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
    const progress = await setup.store.readProgress();
    expect(progress.lessons['x0-a-hello']?.completedAt).toBeDefined();
    // A first-try mistake brings the item back within minutes.
    expect(progress.items['x0-a-hello/hallo-daar']?.relearning).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onAction).toHaveBeenCalledWith('next', expect.objectContaining({ next: { type: 'lesson', lessonId: 'x0-a-thanks' } }));
  });

  it('works from the keyboard: digits pick, Enter checks and continues, Esc asks to quit', async () => {
    const user = userEvent.setup();
    const setup = setupLearning();
    const { onExit } = await startLesson(setup);
    await user.keyboard('{Enter}');
    const options = screen.getAllByRole('radio');
    const right = options.findIndex((option) => option.textContent?.includes('Hello there'));
    await user.keyboard(String(right + 1));
    expect(options[right]).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Words')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Quit lesson?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quit' }));
    expect(onExit).toHaveBeenCalled();
    expect((await setup.store.readProgress()).lessons['x0-a-hello']?.completedAt).toBeUndefined();
  });

  it('treats a swapped article as a mistake and says which word to check', async () => {
    const user = userEvent.setup();
    const exercise: Exercise = {
      id: 'type',
      stage: 'independentRecall',
      kind: 'type',
      prompt: 'Tell your guest the cup is in the kitchen.',
      answers: ['Het kopje is in de keuken.'],
      explanation: 'Kopje ends in -je, so it takes het.',
    };
    const setup = setupLearning(makeCourse({ 'x0-a-hello': { exercises: [exercise] } }));
    await startLesson(setup);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('Your answer in Dutch'), 'De kopje is in de keuken.');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Check the word "de".')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('marks only the words that differ from the option picked', async () => {
    const user = userEvent.setup();
    const exercises = stageExercises('Hallo daar', 'Hello there').map((exercise) =>
      exercise.kind === 'choice' ? { ...exercise, options: ['Hello there', 'Hello here', 'Goodbye'] } : exercise,
    );
    const setup = setupLearning(makeCourse({ 'x0-a-hello': { exercises } }));
    await startLesson(setup);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: /Hello here/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    const answer = screen.getByText('Correct answer:').nextElementSibling!;
    expect(answer).toHaveTextContent('Hello there');
    expect([...answer.querySelectorAll('.tn-miss')].map((token) => token.textContent)).toEqual(['there']);
    expect(screen.queryByText('Your answer:')).not.toBeInTheDocument();
  });

  it('grades match pairs per item, so one slip only brings back the pairs involved', async () => {
    const user = userEvent.setup();
    const course = makeCourse({
      'x0-a-hello': {
        items: [
          { key: 'hallo-daar', dutch: 'Hallo daar', english: 'Hello there', kind: 'phrase' },
          { key: 'hoi', dutch: 'hoi', english: 'hi', kind: 'word' },
          { key: 'dag', dutch: 'dag', english: 'bye', kind: 'word' },
        ],
      },
    });
    const setup = setupLearning(course);
    const plan = await setup.learning.startLesson('x0-a-hello', 'focused');
    const finish = vi.spyOn(setup.learning, 'finish');
    renderUi(makeEnv(setup), <SessionPlayer plan={plan} onExit={() => {}} onAction={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Continue' })); // learn
    await user.click(screen.getByRole('button', { name: 'Continue' })); // key phrases
    await user.click(screen.getByRole('radio', { name: /Hello there/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const pairs = [
      ['hoi', 'hi'],
      ['dag', 'bye'],
      ['Hallo daar', 'Hello there'],
    ] as const;
    async function matchAll() {
      const dutch = screen.getByLabelText('Dutch');
      const english = screen.getByLabelText('English');
      for (const [nl, en] of pairs) {
        await user.click(within(dutch).getByRole('button', { name: nl }));
        await user.click(within(english).getByRole('button', { name: en }));
      }
    }
    // One mismatch first: hoi ↔ bye.
    await user.click(within(screen.getByLabelText('Dutch')).getByRole('button', { name: 'hoi' }));
    await user.click(within(screen.getByLabelText('English')).getByRole('button', { name: 'bye' }));
    await new Promise((resolve) => setTimeout(resolve, 700));
    await matchAll();
    const next = screen.getByRole('button', { name: 'Continue' });
    expect(next).toBeEnabled();
    await user.click(next);

    // Answer the rest correctly; the missed match comes back once, labelled Review.
    while (!screen.queryByText('Lesson complete!')) {
      if (screen.queryByLabelText('Dutch')) {
        expect(screen.getByText('Review')).toBeInTheDocument();
        await matchAll();
        await user.click(screen.getByRole('button', { name: 'Continue' }));
        continue;
      }
      const words = screen.queryByLabelText('Words');
      if (words) {
        for (const word of ['Hallo', 'daar']) await user.click(within(words).getByRole('button', { name: word }));
      } else {
        await user.type(screen.getByLabelText('Your answer in Dutch'), 'Hallo daar');
      }
      await user.click(screen.getByRole('button', { name: 'Check' }));
      await user.click(screen.getByRole('button', { name: 'Continue' }));
      await waitFor(() => expect(screen.queryByRole('button', { name: /Check|Continue/ }) ?? screen.getByText('Lesson complete!')).toBeTruthy());
    }
    const results = finish.mock.calls[0]![1];
    const matchResults = results.filter((result) => result.exerciseId === 'gen:x0-a-hello:match');
    expect(Object.fromEntries(matchResults.map((result) => [result.itemIds[0], result.correct]))).toEqual({
      'x0-a-hello/hallo-daar': true,
      'x0-a-hello/hoi': false,
      'x0-a-hello/dag': false,
    });
  });
});

describe('the end of a pack scene', () => {
  async function finishScene(setup: ReturnType<typeof setupLearning>, lessonId: string) {
    const plan = await setup.learning.startLesson(lessonId, 'focused');
    const results = exerciseSteps(plan).map((planned) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct: true }));
    return { plan, outcome: await setup.learning.finish(plan, results), stats: { correct: results.length, graded: results.length, ms: 60_000 } };
  }

  it('leads on to the next scene, or back to the pack', async () => {
    const user = userEvent.setup();
    const setup = setupLearning(makeCourse({}, [], [], testPacks));
    const first = await finishScene(setup, 'sc-markt-kraam');
    const onAction = vi.fn();
    const { unmount } = renderUi(makeEnv(setup), <SessionComplete {...first} onAction={onAction} />);
    expect(screen.getByText('Scene complete!')).toBeInTheDocument();
    expect(await screen.findByRole('progressbar', { name: 'At the market: scenes done' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next scene' }));
    expect(onAction).toHaveBeenLastCalledWith('scene');
    await user.click(screen.getByRole('button', { name: 'Back to the pack' }));
    expect(onAction).toHaveBeenLastCalledWith('pack');
    unmount();

    await finishScene(setup, 'sc-markt-prijs');
    const last = await finishScene(setup, 'sc-markt-tas');
    renderUi(makeEnv(setup), <SessionComplete {...last} onAction={onAction} />);
    expect(screen.queryByRole('button', { name: 'Next scene' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to the pack' })).toBeInTheDocument();
  });
});

describe('highlighted examples', () => {
  it('marks the words of the items, but never an article on its own', () => {
    const { container } = renderUi(makeEnv(setupLearning()), <Highlighted text="Trek een nummertje bij de ingang van het loket." targets={['het nummertje', 'het loket']} />);
    expect([...container.querySelectorAll('.tn-target')].map((word) => word.textContent)).toEqual(['nummertje', 'loket.']);
  });
});

describe('conversations', () => {
  it('puts the learner’s lines on the right, called You or Jij, and the reply under the same name', () => {
    const lines = [
      { speaker: 'Medewerker', dutch: 'Heeft u een afspraak?', english: 'Do you have an appointment?' },
      { speaker: 'Jij', dutch: 'Ja, om tien uur.', english: 'Yes, at ten.' },
      { speaker: 'Medewerker', dutch: 'Mag ik uw identiteitsbewijs?', english: 'May I have your proof of identity?' },
    ];
    const { container } = renderUi(makeEnv(setupLearning()), <Conversation lines={lines} reply={{ text: 'Hier is mijn paspoort.' }} />);
    const mine = [...container.querySelectorAll('.tn-bubble-row--mine')].map((row) => row.querySelector('.tn-bubble__speaker')?.textContent);
    expect(mine).toEqual(['Jij', 'Jij']);
    expect(container.querySelectorAll('.tn-bubble-row:not(.tn-bubble-row--mine)')).toHaveLength(2);
  });
});
