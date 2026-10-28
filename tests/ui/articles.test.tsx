// Phase 3 in the UI: the het image on cards and answers, the de or het drill, Settings and Progress.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateExercise, seededRandom } from '../../src/engine/exercises';
import { planWords, type SessionPlan } from '../../src/engine/plan';
import { introduceItem } from '../../src/engine/schedule';
import { PanelApp } from '../../src/ui/panel/PanelApp';
import { SessionPlayer } from '../../src/ui/player/SessionPlayer';
import { makeCourse, testWordThemes } from '../fixtures/curriculum';
import { makeEnv, renderUi, setupLearning, silentSpeaker } from './harness';

const course = makeCourse({}, testWordThemes);

function play(plan: SessionPlan, overrides: Parameters<typeof makeEnv>[1] = {}) {
  const setup = setupLearning(course);
  const env = makeEnv(setup, overrides);
  renderUi(env, <SessionPlayer plan={plan} onExit={vi.fn()} onAction={vi.fn()} />);
  return env;
}

/** A one-exercise review of an item's generated drill. */
function reviewOf(itemId: string, stage: 'recognition' | 'supportedRecall' = 'recognition'): SessionPlan {
  const exercise = generateExercise(course, course.item(itemId)!, stage, 0, seededRandom('ui'));
  return {
    kind: 'review',
    mode: 'focused',
    steps: [{ type: 'exercise', planned: { key: 'drill', exerciseId: `gen:${itemId}:${exercise.id}`, lessonId: 'x', exercise, itemIds: [itemId], generated: true } }],
  };
}

describe('the het image', () => {
  it('is chosen the first time a het-noun appears', async () => {
    const user = userEvent.setup();
    const setPrefs = vi.fn(async () => undefined);
    play(planWords(course, ['w-kitchen/mes'], 'focused', 'seed'), { setPrefs });
    expect(screen.getByText(/A het-word\. Picture every het-word the same way/)).toBeInTheDocument();
    await user.click(within(screen.getByRole('group', { name: 'Your image for het-words' })).getByRole('button', { name: 'frozen in ice' }));
    expect(setPrefs).toHaveBeenCalledWith({ hetImage: 'frozen in ice' });
  });

  it('can be the learner’s own words', async () => {
    const user = userEvent.setup();
    const setPrefs = vi.fn(async () => undefined);
    play(planWords(course, ['w-kitchen/mes'], 'focused', 'seed'), { setPrefs });
    await user.click(screen.getByRole('button', { name: 'My own' }));
    await user.type(screen.getByRole('textbox', { name: 'Picture it…' }), 'covered in glitter');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(setPrefs).toHaveBeenCalledWith({ hetImage: 'covered in glitter' });
  });

  it('then shows as one line with a het badge, on het-nouns only', () => {
    play(planWords(course, ['w-kitchen/mes'], 'focused', 'seed'), { prefs: { hetImage: 'frozen in ice' } });
    expect(screen.getByText('Picture it frozen in ice.')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Your image for het-words' })).not.toBeInTheDocument();
  });

  it('is not shown for a de-word', () => {
    play(planWords(course, ['w-kitchen/vork'], 'focused', 'seed'));
    expect(screen.getByRole('heading', { name: 'de vork' })).toBeInTheDocument();
    expect(screen.queryByText(/het-word/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Picture it/)).not.toBeInTheDocument();
  });

  it('comes with the answer to a het-noun’s drill', async () => {
    const user = userEvent.setup();
    play(reviewOf('w-kitchen/mes'), { prefs: { hetImage: 'glowing hot' } });
    await user.click(screen.getByRole('radio', { name: /the knife/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('Picture it glowing hot.')).toBeInTheDocument();
  });
});

describe('the de or het drill', () => {
  it('shows the bare noun, keeps de first, and fills in the article once answered', async () => {
    const user = userEvent.setup();
    play(reviewOf('w-kitchen/mes#article'));
    expect(screen.getByRole('heading', { name: 'De or het?' })).toBeInTheDocument();
    expect(document.querySelector('.tn-article-word')).toHaveTextContent('___ mes');
    expect(screen.getAllByRole('radio').map((option) => option.textContent)).toEqual(['1de', '2het']);
    await user.click(screen.getByRole('radio', { name: /het/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(document.querySelector('.tn-article-word')).toHaveTextContent('het mes');
    // The image line stands in with the first ready-made image until the learner picks one.
    expect(screen.getByText('Picture it made of gold.')).toBeInTheDocument();
  });

  it('says which article a de-word takes, without the het image', async () => {
    const user = userEvent.setup();
    play(reviewOf('w-kitchen/vork#article'));
    await user.click(screen.getByRole('radio', { name: /het/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Not quite')).toBeInTheDocument();
    expect(document.querySelector('.tn-sheet__answer')).toHaveTextContent('de');
    expect(screen.queryByText(/Picture it/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Why?' }));
    expect(screen.getByText('de vork means "the fork". It is a de-word.')).toBeInTheDocument();
  });
});

describe('Settings and Progress', () => {
  it('changes the het image in Settings', async () => {
    const user = userEvent.setup();
    const setup = setupLearning(course);
    await setup.store.updatePreferences({ onboarded: true });
    render(<PanelApp deps={{ learning: setup.learning, course, speaker: silentSpeaker(), now: setup.now }} />);
    await user.click(await screen.findByRole('button', { name: 'Settings' }));
    const choice = screen.getByRole('group', { name: 'Het-word image' });
    await user.click(within(choice).getByRole('button', { name: 'glowing hot' }));
    await waitFor(async () => expect((await setup.store.readPreferences()).hetImage).toBe('glowing hot'));
    await waitFor(() => expect(within(screen.getByRole('group', { name: 'Het-word image' })).getByRole('button', { name: 'glowing hot' })).toHaveAttribute('aria-pressed', 'true'));
  });

  it('counts the articles met on Progress', async () => {
    const user = userEvent.setup();
    const setup = setupLearning(course);
    await setup.store.updatePreferences({ onboarded: true });
    await setup.store.updateProgress((progress) => ({
      ...progress,
      items: { 'w-kitchen/mes': introduceItem({ correctStages: [], mistakes: 0 }, setup.now()), 'w-kitchen/mes#article': introduceItem({ correctStages: [], mistakes: 0 }, setup.now()) },
    }));
    render(<PanelApp deps={{ learning: setup.learning, course, speaker: silentSpeaker(), now: setup.now }} />);
    await user.click(await screen.findByRole('button', { name: 'Progress' }));
    const card = screen.getByRole('heading', { name: 'Articles · de or het' }).closest('section')!;
    expect(card).toHaveTextContent('1 of 6 nouns · 0 strong');
  });
});
