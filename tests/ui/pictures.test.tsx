// Phase 2 in the player: Dutch first, pictures as cues, the learner's own pictures, situations.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CurriculumIndex } from '../../src/curriculum/assemble';
import type { Exercise } from '../../src/curriculum/types';
import { generateExercise, seededRandom, type DrillContext } from '../../src/engine/exercises';
import { planLesson, planWords, type SessionPlan } from '../../src/engine/plan';
import type { ImageManifest } from '../../src/images/manifest';
import type { PictureSource } from '../../src/images/pictures';
import { SettingsScreen } from '../../src/ui/panel/SettingsScreen';
import { SessionPlayer } from '../../src/ui/player/SessionPlayer';
import { makeCourse, testWordThemes } from '../fixtures/curriculum';
import { makeEnv, renderUi, setupLearning } from './harness';

const course = makeCourse({ 'x0-a-hello': { situation: 'You meet your new neighbour on the stairs.' } }, testWordThemes);
const KITCHEN = { 'w-kitchen/vork': '/images/vork.webp', 'w-kitchen/mes': '/images/mes.webp', 'w-kitchen/lepel': '/images/lepel.webp' };

function fakePictures(bundled: Record<string, string> = {}) {
  const own = new Map<string, string>();
  return {
    pictureFor: vi.fn(async (itemId: string) => {
      const mine = own.get(itemId);
      if (mine) return { src: mine, own: true };
      return bundled[itemId] ? { src: bundled[itemId]!, own: false } : undefined;
    }),
    save: vi.fn(async (itemId: string, _image: Blob) => void own.set(itemId, `blob:${itemId}`)),
    remove: vi.fn(async (itemId: string) => void own.delete(itemId)),
  } satisfies PictureSource;
}

function play(plan: SessionPlan, overrides: Parameters<typeof makeEnv>[1] = {}) {
  const setup = setupLearning(course);
  renderUi(makeEnv(setup, overrides), <SessionPlayer plan={plan} onExit={vi.fn()} onAction={vi.fn()} />);
}

/** A one-exercise review holding a generated drill. */
function drillPlan(index: CurriculumIndex, itemId: string, stage: Exercise['stage'], variant = 0, context: DrillContext = {}): SessionPlan {
  const exercise = generateExercise(index, index.item(itemId)!, stage, variant, seededRandom('ui'), context);
  return {
    kind: 'review',
    mode: 'focused',
    steps: [{ type: 'exercise', planned: { key: 'drill', exerciseId: `gen:${itemId}:${exercise.id}`, lessonId: 'x', exercise, itemIds: [itemId], generated: true } }],
  };
}

const picture = () => document.querySelector('.tn-picture');

describe('Dutch first', () => {
  it('keeps a new word’s English behind Show meaning, under its picture', async () => {
    const user = userEvent.setup();
    play(planWords(course, ['w-kitchen/vork'], 'focused', 'seed'), { pictures: fakePictures(KITCHEN) });
    expect(screen.getByRole('heading', { name: 'de vork' })).toBeInTheDocument();
    await waitFor(() => expect(picture()).toHaveAttribute('src', '/images/vork.webp'));
    expect(screen.queryByText('the fork')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show meaning' }));
    expect(screen.getByText('the fork')).toBeInTheDocument();
  });

  it('does the same on the learn card, examples included', async () => {
    const user = userEvent.setup();
    const withExample = makeCourse({ 'x0-a-hello': { examples: [{ dutch: 'Hallo daar, Sanne!', english: 'Hello there, Sanne!' }] } });
    const setup = setupLearning(withExample);
    renderUi(makeEnv(setup), <SessionPlayer plan={planLesson(withExample, 'x0-a-hello', 'focused')} onExit={vi.fn()} onAction={vi.fn()} />);
    expect(screen.queryByText('Hello there')).not.toBeInTheDocument();
    expect(screen.queryByText('Hello there, Sanne!')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show meaning' }));
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('Hello there, Sanne!')).toBeInTheDocument();
  });

  it('shows the English at once for a learner who wants translations', () => {
    play(planWords(course, ['w-kitchen/vork'], 'focused', 'seed'), { prefs: { showTranslations: true } });
    expect(screen.getByText('the fork')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show meaning' })).not.toBeInTheDocument();
  });
});

describe('the learner’s own picture', () => {
  it('comes from a Dutch image search, pasted or chosen, and can be removed again', async () => {
    const user = userEvent.setup();
    const pictures = fakePictures();
    play(planWords(course, ['w-kitchen/vork'], 'focused', 'seed'), { pictures });
    await user.click(await screen.findByRole('button', { name: 'Add a picture' }));
    const picker = screen.getByRole('group', { name: 'Choose your own picture' });
    const search = within(picker).getByRole('link', { name: 'Search pictures of “vork”' });
    expect(search).toHaveAttribute('href', 'https://www.google.com/search?tbm=isch&hl=nl&q=vork');
    expect(search).toHaveAttribute('target', '_blank');

    const pasted = new File(['png'], 'vork.png', { type: 'image/png' });
    fireEvent.paste(document, { clipboardData: { items: [{ type: 'image/png', getAsFile: () => pasted }], types: ['Files'] } });
    await waitFor(() => expect(pictures.save).toHaveBeenCalledWith('w-kitchen/vork', pasted));
    await waitFor(() => expect(picture()).toHaveAttribute('src', 'blob:w-kitchen/vork'));
    expect(screen.queryByRole('group', { name: 'Choose your own picture' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change picture' }));
    await user.upload(screen.getByLabelText('Or choose a file'), new File(['jpg'], 'other.jpg', { type: 'image/jpeg' }));
    expect(pictures.save).toHaveBeenCalledTimes(2);

    await user.click(await screen.findByRole('button', { name: 'Remove my picture' }));
    expect(pictures.remove).toHaveBeenCalledWith('w-kitchen/vork');
    expect(await screen.findByRole('button', { name: 'Add a picture' })).toBeInTheDocument();
    expect(picture()).toBeNull();
  });

  it('says so when what was chosen is not an image', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const pictures = fakePictures();
    play(planWords(course, ['w-kitchen/vork'], 'focused', 'seed'), { pictures });
    await user.click(await screen.findByRole('button', { name: 'Add a picture' }));
    await user.upload(screen.getByLabelText('Or choose a file'), new File(['text'], 'notes.txt', { type: 'text/plain' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That was not an image.');
    expect(pictures.save).not.toHaveBeenCalled();
  });

  it('is only chosen in the side panel, never in the in-page card', async () => {
    play(planWords(course, ['w-kitchen/vork'], 'micro', 'seed'), { pictures: fakePictures(KITCHEN), surface: 'card' });
    await waitFor(() => expect(picture()).toHaveAttribute('src', '/images/vork.webp'));
    expect(screen.queryByRole('button', { name: /picture/ })).not.toBeInTheDocument();
  });
});

describe('cues in drills', () => {
  const hasPicture = (id: string) => id in KITCHEN;

  it('picks a picture by ear, naming the pictures once answered', async () => {
    const user = userEvent.setup();
    play(drillPlan(course, 'w-kitchen/vork', 'recognition', 1, { hasPicture }), { pictures: fakePictures(KITCHEN) });
    expect(screen.getByRole('heading', { name: 'Listen. Which picture?' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    await waitFor(() => expect(document.querySelectorAll('.tn-option .tn-picture[src]')).toHaveLength(3));
    expect(screen.queryByText('the fork')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'the fork' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(within(screen.getByRole('radiogroup')).getByText('the fork')).toBeInTheDocument();
  });

  it('asks for the word from its picture, and falls back to the English if the picture is gone', async () => {
    play(drillPlan(course, 'w-kitchen/vork', 'supportedRecall', 0, { hasPicture }), { pictures: fakePictures(KITCHEN) });
    expect(screen.getByRole('heading', { name: 'What is this in Dutch?' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'the fork' })).toHaveAttribute('src', '/images/vork.webp');
    expect(screen.getByText('Hint: d_ v___')).toBeInTheDocument();
  });

  it('falls back to the English when the picture cannot be found', async () => {
    play(drillPlan(course, 'w-kitchen/vork', 'supportedRecall', 0, { hasPicture }), { pictures: fakePictures() });
    expect(await screen.findByText('the fork')).toBeInTheDocument();
  });

  it('recalls a main phrase from its situation in a review, then shows the English with the answer', async () => {
    const user = userEvent.setup();
    play(drillPlan(course, 'x0-a-hello/hallo-daar', 'independentRecall'));
    expect(screen.getByRole('heading', { name: 'What do you say?' })).toBeInTheDocument();
    expect(screen.getByText('You meet your new neighbour on the stairs.')).toBeInTheDocument();
    expect(screen.queryByText('Hello there')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByText('Hallo daar')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('shows the situation above a typed answer in a lesson-style drill', () => {
    play({ ...drillPlan(course, 'x0-a-hello/hallo-daar', 'supportedRecall'), kind: 'words' });
    expect(screen.getByRole('heading', { name: 'What do you say?' })).toBeInTheDocument();
    expect(screen.getByText('You meet your new neighbour on the stairs.')).toHaveClass('tn-scene');
  });
});

describe('Settings', () => {
  const images: ImageManifest = {
    'de vork': { file: 'vork-1a2b3c.webp', author: 'A. Photographer', source: 'https://example.org/vork', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  };

  it('turns translations on, and lists who made the pictures under which license', async () => {
    const user = userEvent.setup();
    const setup = setupLearning(course);
    const setPrefs = vi.fn(async () => undefined);
    renderUi(makeEnv(setup, { setPrefs }), <SettingsScreen images={images} />);
    await user.click(screen.getByRole('switch', { name: 'Show translations' }));
    expect(setPrefs).toHaveBeenCalledWith({ showTranslations: true });

    await user.click(screen.getByRole('button', { name: 'Pictures in the lessons (1)' }));
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    expect(screen.getByRole('link', { name: 'Photo' })).toHaveAttribute('href', 'https://example.org/vork');
    expect(screen.getByText(/by A\. Photographer/)).toBeInTheDocument();
  });

  it('has no credits section without bundled pictures', () => {
    renderUi(makeEnv(setupLearning(course)), <SettingsScreen images={{}} />);
    expect(screen.queryByText('Image credits')).not.toBeInTheDocument();
  });
});
