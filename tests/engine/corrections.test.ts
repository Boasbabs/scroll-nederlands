// Phase 6: what a corrector changed, the items it becomes, their drill and how they are stored.
import { CORRECTIONS_STAGE, withCorrections } from '../../src/corrections/assemble';
import { findCorrections } from '../../src/corrections/diff';
import { EXERCISE_STAGES } from '../../src/curriculum/types';
import { generateExercise, seededRandom } from '../../src/engine/exercises';
import { exerciseSteps } from '../../src/engine/plan';
import { DAY } from '../../src/engine/schedule';
import { parseCorrections, parseDrafts } from '../../src/storage/store';
import { makeCourse } from '../fixtures/curriculum';
import { setupLearning, T0 } from '../ui/harness';

const index = makeCourse();

describe('finding the corrections', () => {
  it('turns a replaced word into a fill-the-gap on the corrected sentence', () => {
    expect(findCorrections('Ik ben gisteren gewerkt.', 'Ik heb gisteren gewerkt.', T0)).toEqual([
      { id: `c-${T0.toString(36)}`, sentence: 'Ik ___ gisteren gewerkt.', answers: ['heb'], wrote: 'ben', dutch: 'Ik heb gisteren gewerkt.', at: T0 },
    ]);
  });

  it('keeps words the learner left out, with nothing written in their place', () => {
    expect(findCorrections('Ik ga naar huis.', 'Ik ga nu naar huis.', T0)).toMatchObject([{ sentence: 'Ik ga ___ naar huis.', answers: ['nu'], wrote: '' }]);
  });

  it('blanks only the sentence that changed, in a longer text', () => {
    const written = 'Hoi Sanne. Ik ben morgen niet op de werk. Groetjes, Tom';
    const corrected = 'Hoi Sanne. Ik ben morgen niet op het werk. Groetjes, Tom';
    expect(findCorrections(written, corrected, T0)).toMatchObject([
      { sentence: 'Ik ben morgen niet op ___ werk.', answers: ['het'], wrote: 'de', dutch: 'Ik ben morgen niet op het werk.' },
    ]);
  });

  it('gives each change of one text its own permanent id', () => {
    const found = findCorrections('Ik woon in de Utrecht sinds twee jaar.', 'Ik woon sinds twee jaar in Utrecht.', T0);
    expect(found.length).toBeGreaterThan(0);
    expect(found.map((correction) => correction.id)).toEqual(found.map((_, i) => `c-${(T0 + i).toString(36)}`));
    for (const correction of found) expect(correction.sentence).toContain('___');
  });

  it('ignores case, punctuation and words that were only removed', () => {
    expect(findCorrections('ik woon in utrecht', 'Ik woon in Utrecht.', T0)).toEqual([]);
    expect(findCorrections('Ik heb heb een fiets.', 'Ik heb een fiets.', T0)).toEqual([]);
    expect(findCorrections('Ik heb een fiets.', 'Ik heb een fiets.', T0)).toEqual([]);
  });
});

describe('corrections as items', () => {
  const [correction] = findCorrections('Ik ben gisteren gewerkt.', 'Ik heb gisteren gewerkt.', T0);
  const withMine = withCorrections(index, [correction!]);

  it('join the index at runtime, beside the course', () => {
    expect(withMine.item(correction!.id)).toMatchObject({ dutch: 'Ik heb gisteren gewerkt.', stageId: CORRECTIONS_STAGE, lessonId: CORRECTIONS_STAGE });
    expect(withMine.items).toHaveLength(index.items.length + 1);
    expect(withMine.lessons).toBe(index.lessons);
    expect(index.item(correction!.id)).toBeUndefined();
    expect(withCorrections(index, [])).toBe(index);
  });

  it('are practised as their fill-the-gap, with dictation at transfer', () => {
    const item = withMine.item(correction!.id)!;
    for (const stage of EXERCISE_STAGES.slice(0, 3)) {
      expect(generateExercise(withMine, item, stage, 0, seededRandom(stage))).toMatchObject({
        kind: 'cloze',
        prompt: 'Fill the gap the way it was corrected.',
        sentence: 'Ik ___ gisteren gewerkt.',
        answers: ['heb'],
        hint: 'You first wrote "ben".',
      });
    }
    expect(generateExercise(withMine, item, 'transfer', 0, seededRandom('t'))).toMatchObject({ kind: 'type', listenOnly: true, answers: ['Ik heb gisteren gewerkt.'] });
  });

  it('are parsed back with defaults, dropping broken ones', () => {
    expect(parseCorrections({ [correction!.id]: correction, 'c-bad': { sentence: 'no gap', answers: ['x'], dutch: 'x' }, other: correction })).toEqual({ [correction!.id]: correction });
    expect(parseDrafts({ 'd-1': { text: 'Ik ben ziek.', at: T0 }, 'd-2': { text: '  ', at: T0 } })).toEqual({ 'd-1': { id: 'd-1', text: 'Ik ben ziek.', prompt: '', exerciseId: '', at: T0 } });
  });
});

describe('the loop', () => {
  it('keeps a draft until its correction comes back, then reviews the changes from the next day', async () => {
    const setup = setupLearning(index);
    const draft = await setup.learning.saveDraft({ text: 'Ik ben gisteren gewerkt.', prompt: 'Tell a colleague about yesterday.', exerciseId: 'x0-a-hello/write' });
    expect((await setup.learning.snapshot('focused')).drafts).toEqual([draft]);

    const added = await setup.learning.correctDraft(draft.id, 'Ik heb gisteren gewerkt.');
    expect(added).toHaveLength(1);
    expect((await setup.learning.snapshot('focused')).drafts).toEqual([]);
    const progress = await setup.store.readProgress();
    expect(progress.items[added[0]!.id]).toMatchObject({ stage: 'introduced', dueAt: setup.now() + DAY });

    setup.advance(DAY);
    const plan = (await setup.learning.startReview('focused'))!;
    expect(exerciseSteps(plan).map((planned) => planned.itemIds[0])).toContain(added[0]!.id);
    expect(exerciseSteps(plan).find((planned) => planned.itemIds[0] === added[0]!.id)!.exercise).toMatchObject({ kind: 'cloze', sentence: 'Ik ___ gisteren gewerkt.' });
  });

  it('adds nothing when the corrector changed nothing', async () => {
    const setup = setupLearning(index);
    const draft = await setup.learning.saveDraft({ text: 'Ik heb een fiets.', prompt: '', exerciseId: 'x' });
    expect(await setup.learning.correctDraft(draft.id, 'Ik heb een fiets.')).toEqual([]);
    expect(await setup.store.readCorrections()).toEqual({});
    expect((await setup.learning.snapshot('focused')).drafts).toEqual([]);
  });
});
