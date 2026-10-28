// Phase 4: the learner's notes (storage, cues, personal fill-the-gap) and items that keep slipping.
import { chooseReviewExercise, generateExercise, personalGap, seededRandom } from '../../src/engine/exercises';
import { LEECH_LAPSES, leechCheck } from '../../src/engine/notes';
import { exerciseSteps, planReview } from '../../src/engine/plan';
import { introduceItem } from '../../src/engine/schedule';
import { emptyProgress, type ItemProgress, type LearnerProgress } from '../../src/engine/types';
import { createStore, NOTE_MAX, parseLeeches, parseNotes, STORAGE_KEYS } from '../../src/storage/store';
import { makeCourse, testContrasts, testWordThemes } from '../fixtures/curriculum';
import { createMemoryArea } from '../fixtures/memory-storage';
import { setupLearning, T0 } from '../ui/harness';

const index = makeCourse({}, testWordThemes, testContrasts);

function slipping(lapses: number): ItemProgress {
  return { ...introduceItem({ correctStages: [], mistakes: 0 }, T0 - 10 * 86_400_000), stage: 'recognition', lapses, dueAt: T0 - 1 };
}

function progressWith(items: Record<string, ItemProgress>): LearnerProgress {
  return { ...emptyProgress(), items };
}

describe('storing notes', () => {
  it('parses what it can and drops the rest', () => {
    expect(parseNotes(undefined)).toEqual({});
    expect(
      parseNotes({
        a: { text: '  Mijn vork is van zilver.  ', at: T0 },
        b: { text: '   ', at: T0 },
        c: { text: 'no time' },
        d: 'loose text',
        e: { text: 'x'.repeat(400), at: T0 },
      }),
    ).toEqual({ a: { text: 'Mijn vork is van zilver.', at: T0 }, e: { text: 'x'.repeat(NOTE_MAX), at: T0 } });
    expect(parseLeeches({ a: T0, b: 'soon' })).toEqual({ a: T0 });
  });

  it('keeps the newest copy of a note, and removes one saved empty', async () => {
    const area = createMemoryArea();
    const panel = createStore(area);
    const card = createStore(area);
    await panel.setNote('w-kitchen/vork', 'Mijn vork is van zilver.', T0 + 10);
    // An older write from the other page does not win.
    await card.setNote('w-kitchen/vork', 'An older line', T0 + 5);
    expect((await panel.readNotes())['w-kitchen/vork']).toEqual({ text: 'Mijn vork is van zilver.', at: T0 + 10 });
    await card.setNote('w-kitchen/mes', 'Het mes van opa.', T0 + 20);
    await panel.setNote('w-kitchen/vork', '', T0 + 30);
    expect(await panel.readNotes()).toEqual({ 'w-kitchen/mes': { text: 'Het mes van opa.', at: T0 + 20 } });
    expect((await area.get([STORAGE_KEYS.notes]))[STORAGE_KEYS.notes]).toEqual({ 'w-kitchen/mes': { text: 'Het mes van opa.', at: T0 + 20 } });
  });

  it('remembers which items were offered "Make it yours"', async () => {
    const store = createStore(createMemoryArea());
    await store.markLeech('w-kitchen/vork', T0);
    expect(await store.readLeeches()).toEqual({ 'w-kitchen/vork': T0 });
  });
});

describe('the personal fill-the-gap', () => {
  it('blanks the word where the note uses it, with or without its article', () => {
    expect(personalGap('Mijn vork is van zilver.', 'de vork')).toEqual({ sentence: 'Mijn ___ is van zilver.', answer: 'vork', english: '' });
    expect(personalGap('Ik zoek de vork in de la.', 'de vork')).toMatchObject({ sentence: 'Ik zoek ___ in de la.', answer: 'de vork' });
    expect(personalGap('Ik zeg altijd Dank je wel!', 'Dank je wel')).toMatchObject({ sentence: 'Ik zeg altijd ___!', answer: 'Dank je wel' });
  });

  it('needs the word itself, in a line of three words or more', () => {
    expect(personalGap('My grandmother’s silver forks', 'de vork')).toBeUndefined();
    expect(personalGap('Mijn vorken zijn oud.', 'de vork')).toBeUndefined();
    expect(personalGap('Mijn vork', 'de vork')).toBeUndefined();
  });

  it('is the recall drill for an item whose note uses it', () => {
    const vork = index.item('w-kitchen/vork')!;
    const context = { noteFor: (id: string) => (id === vork.id ? 'Mijn vork is van zilver.' : undefined) };
    for (const stage of ['supportedRecall', 'independentRecall'] as const) {
      expect(generateExercise(index, vork, stage, 0, seededRandom(stage), context)).toMatchObject({
        id: `gen-note-${stage}`,
        kind: 'cloze',
        prompt: 'Fill the gap in your note.',
        sentence: 'Mijn ___ is van zilver.',
        answers: ['vork'],
      });
    }
    // Recognition and dictation stay as they were.
    expect(generateExercise(index, vork, 'recognition', 0, seededRandom('r'), context)).toMatchObject({ kind: 'choice' });
    expect(generateExercise(index, vork, 'transfer', 0, seededRandom('t'), context)).toMatchObject({ prompt: 'Listen and type what you hear.' });
  });

  it('shows a note that does not use the word beside the cue', () => {
    const mes = index.item('w-kitchen/mes')!;
    const context = { noteFor: () => 'The knife my grandfather gave me' };
    expect(generateExercise(index, mes, 'supportedRecall', 0, seededRandom('s'), context)).toMatchObject({ kind: 'type', note: 'The knife my grandfather gave me' });
    expect(generateExercise(index, mes, 'independentRecall', 0, seededRandom('i'), context)).toMatchObject({ kind: 'type', note: 'The knife my grandfather gave me' });
  });

  it('beats a lesson’s own exercise at the recall stages', () => {
    const itemId = 'x0-a-hello/hallo-daar';
    const progress = { ...introduceItem({ correctStages: ['recognition'], mistakes: 0 }, T0), stage: 'recognition' as const };
    expect(chooseReviewExercise(index, itemId, progress, 'focused', seededRandom('a')).generated).toBe(false);
    const planned = chooseReviewExercise(index, itemId, progress, 'focused', seededRandom('a'), { noteFor: () => 'Ik roep Hallo daar naar de buren.' });
    expect(planned).toMatchObject({ generated: true, exercise: { kind: 'cloze', sentence: 'Ik roep ___ naar de buren.' } });
  });
});

describe('items that keep slipping', () => {
  const progress = progressWith({
    'w-kitchen/vork': slipping(LEECH_LAPSES - 1),
    'w-kitchen/mes': slipping(LEECH_LAPSES - 2),
    'w-kitchen/lepel': slipping(7),
    'w-kitchen/glas': slipping(5),
    'w-animals/hond': slipping(5),
    'p-a-aa': slipping(9),
    'w-kitchen/vork#article': slipping(9),
  });

  it('are offered "Make it yours" from the fourth lapse, once, unless already personal', () => {
    const leech = leechCheck(index, progress, { 'w-kitchen/lepel': { text: 'Soep met een lepel', at: T0 } }, { 'w-kitchen/glas': T0 }, { 'w-animals/hond': T0 });
    expect(leech('w-kitchen/vork')).toBe(true);
    expect(leech('w-kitchen/mes')).toBe(false);
    expect(leech('w-kitchen/lepel')).toBe(false);
    expect(leech('w-kitchen/glas')).toBe(false);
    expect(leech('w-animals/hond')).toBe(false);
    // Ear training and article items: a note belongs on the word itself.
    expect(leech('p-a-aa')).toBe(false);
    expect(leech('w-kitchen/vork#article')).toBe(false);
  });

  it('are marked in the review plan', () => {
    const plan = planReview(index, progress, ['w-kitchen/vork', 'w-kitchen/mes'], 'focused', 's', { leech: (id) => id === 'w-kitchen/vork' });
    expect(exerciseSteps(plan).map((planned) => planned.leech)).toEqual([true, undefined]);
  });

  it('are found by the bridge from stored progress, notes, pictures and earlier offers', async () => {
    const setup = setupLearning(index);
    await setup.store.updateProgress(() => progressWith({ 'w-kitchen/vork': slipping(LEECH_LAPSES - 1), 'w-kitchen/mes': slipping(LEECH_LAPSES - 1) }));
    await setup.learning.offerLeech('w-kitchen/mes');
    const plan = (await setup.learning.startReview('focused'))!;
    // (The two nouns' de/het items catch up too, due now: after the overdue words.)
    expect(exerciseSteps(plan).map((planned) => [planned.itemIds[0], planned.leech]).slice(0, 2)).toEqual([
      ['w-kitchen/vork', true],
      ['w-kitchen/mes', undefined],
    ]);
    await setup.learning.saveNote('w-kitchen/vork', 'Mijn vork is van zilver.');
    const after = (await setup.learning.startReview('focused'))!;
    expect(exerciseSteps(after)[0]).toMatchObject({ itemIds: ['w-kitchen/vork'], exercise: { kind: 'cloze', sentence: 'Mijn ___ is van zilver.' } });
    expect(exerciseSteps(after)[0]!.leech).toBeUndefined();
  });
});
