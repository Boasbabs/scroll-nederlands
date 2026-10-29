import { articleItemId } from '../../src/articles/assemble';
import { chooseReviewExercise, seededRandom } from '../../src/engine/exercises';
import { exerciseSteps, planLesson, type SessionPlan } from '../../src/engine/plan';
import { completeLesson, markLessonStarted } from '../../src/engine/progress';
import { DAY } from '../../src/engine/schedule';
import { getNextLesson, getNextScene, getPackInProgress, isLessonUnlocked, isSceneUnlocked, packOfScene } from '../../src/engine/selection';
import { summarizePack, summarizeProgress } from '../../src/engine/summary';
import { emptyProgress, type ExerciseResult, type LearnerProgress } from '../../src/engine/types';
import { PACKS_STAGE } from '../../src/packs/assemble';
import { makeCourse, testPacks, testSet, testWordThemes } from '../fixtures/curriculum';
import { setupLearning } from '../ui/harness';

const T0 = new Date(2026, 9, 29, 9).getTime();
const index = makeCourse({}, [], [], testPacks);
const pack = index.packs[0]!;

function answers(plan: SessionPlan, correct = true): Array<ExerciseResult> {
  return exerciseSteps(plan).map((planned) => ({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct }));
}

function finishScene(progress: LearnerProgress, sceneId: string, at: number): LearnerProgress {
  return completeLesson(progress, index, sceneId, answers(planLesson(index, sceneId, 'focused')), 'focused', at);
}

describe('packs in the index', () => {
  it('finds scenes by id but keeps them off the course path', () => {
    expect(pack.scenes.map((scene) => scene.id)).toEqual(['sc-markt-kraam', 'sc-markt-prijs', 'sc-markt-tas']);
    expect(index.lesson('sc-markt-prijs')).toBe(pack.scenes[1]);
    expect(index.lessons.map((lesson) => lesson.id)).not.toContain('sc-markt-kraam');
    expect(getNextLesson(index, emptyProgress())?.id).toBe('x0-a-hello');
  });

  it('places items in the pack’s module, beside the course', () => {
    const noun = index.item('sc-markt-kraam/de-kraam')!;
    expect(noun).toMatchObject({ lessonId: 'sc-markt-kraam', moduleId: 'sc-markt', stageId: PACKS_STAGE, primary: false });
    expect(index.item('sc-markt-kraam/twee-kilo-appels')?.primary).toBe(true);
    expect(pack.items.map((item) => item.id)).toEqual([
      'sc-markt-kraam/twee-kilo-appels',
      'sc-markt-kraam/de-kraam',
      'sc-markt-kraam/de-appels',
      'sc-markt-prijs/wat-kost-dat',
      'sc-markt-tas/heeft-u-een-tas',
    ]);
  });

  it('gives singular nouns a de/het item, and plurals none', () => {
    expect(index.item(articleItemId('sc-markt-kraam/de-kraam'))).toBeDefined();
    expect(index.item(articleItemId('sc-markt-kraam/de-appels'))).toBeUndefined();
  });
});

describe('scene order', () => {
  it('opens the scenes of a pack in order, whatever the course path', () => {
    let progress = emptyProgress();
    expect(isSceneUnlocked(index, progress, 'sc-markt-kraam')).toBe(true);
    expect(isLessonUnlocked(index, progress, 'sc-markt-kraam')).toBe(true);
    expect(isLessonUnlocked(index, progress, 'sc-markt-prijs')).toBe(false);
    progress = finishScene(progress, 'sc-markt-kraam', T0);
    expect(isLessonUnlocked(index, progress, 'sc-markt-prijs')).toBe(true);
    expect(isLessonUnlocked(index, progress, 'sc-markt-tas')).toBe(false);
    expect(getNextScene(pack, progress)?.id).toBe('sc-markt-prijs');
    expect(packOfScene(index, 'sc-markt-tas')).toBe(pack);
    expect(packOfScene(index, 'x0-a-hello')).toBeUndefined();
  });

  it('knows the pack in progress, the most recently active first', () => {
    const other = makeCourse({}, [], [], [...testPacks, { ...testPacks[0]!, id: 'kraam', scenes: testPacks[0]!.scenes.map((scene) => ({ ...scene, id: scene.id.replace('markt', 'kraam') })) }]);
    let progress = emptyProgress();
    expect(getPackInProgress(other, progress)).toBeUndefined();
    progress = markLessonStarted(progress, 'sc-markt-kraam', T0);
    progress = markLessonStarted(progress, 'sc-kraam-kraam', T0 + 1000);
    expect(getPackInProgress(other, progress)?.id).toBe('kraam');
    progress = markLessonStarted(progress, 'sc-markt-kraam', T0 + 2000);
    expect(getPackInProgress(other, progress)?.id).toBe('kraam');
    for (const [i, scene] of other.packs[1]!.scenes.entries()) {
      progress = completeLesson(progress, other, scene.id, answers(planLesson(other, scene.id, 'focused')), 'focused', T0 + 3000 + i);
    }
    // The finished pack is no longer in progress.
    expect(getPackInProgress(other, progress)?.id).toBe('markt');
  });
});

describe('finishing a scene', () => {
  it('introduces its items and leaves course items the course has not taught yet', () => {
    const progress = finishScene(emptyProgress(), 'sc-markt-kraam', T0);
    expect(progress.items['sc-markt-kraam/twee-kilo-appels']).toBeDefined();
    expect(progress.items['sc-markt-kraam/de-kraam']).toBeDefined();
    expect(progress.items['x1-a-pay/ik-wil-betalen']).toBeUndefined();
  });

  it('grades course items it refers to once they are met', () => {
    const plan = planLesson(index, 'x1-a-pay', 'focused');
    let progress = completeLesson(emptyProgress(), index, 'x1-a-pay', answers(plan), 'focused', T0 - 10 * DAY);
    const before = progress.items['x1-a-pay/ik-wil-betalen']!;
    progress = finishScene(progress, 'sc-markt-kraam', T0);
    expect(progress.items['x1-a-pay/ik-wil-betalen']!.history.length).toBeGreaterThan(before.history.length);
  });

  it('serves its authored exercises in later reviews of its items', () => {
    const progress = finishScene(emptyProgress(), 'sc-markt-kraam', T0);
    const item = progress.items['sc-markt-kraam/twee-kilo-appels']!;
    const review = chooseReviewExercise(index, 'sc-markt-kraam/twee-kilo-appels', { ...item, stage: 'supportedRecall', history: [] }, 'focused', seededRandom('x'));
    expect(review).toMatchObject({ generated: false, lessonId: 'sc-markt-kraam', exerciseId: 'sc-markt-kraam/type' });
  });
});

describe('pack summaries', () => {
  it('counts a pack’s scenes, its next scene and its items', () => {
    const progress = finishScene(emptyProgress(), 'sc-markt-kraam', T0);
    const summary = summarizePack(pack, progress, T0);
    expect(summary.scenes).toEqual({ completed: 1, total: 3 });
    expect(summary.next?.id).toBe('sc-markt-prijs');
    expect(summary.started).toBe(true);
    expect(summary.items).toMatchObject({ new: 2, learning: 3, total: 5 });
    expect(summarizePack(pack, emptyProgress(), T0)).toMatchObject({ started: false, scenes: { completed: 0, total: 3 } });
  });

  it('counts the situations started on Progress, and leaves the course counts alone', () => {
    const progress = markLessonStarted(emptyProgress(), 'sc-markt-kraam', T0);
    const summary = summarizeProgress(index, progress, T0);
    expect(summary.packs).toEqual({ started: 1, total: 1, items: { new: 5, learning: 0, strong: 0, total: 5 } });
    expect(summary.lessons.total).toBe(index.lessons.length);
    expect(summary.items.total).toBe(index.lessons.flatMap((lesson) => lesson.items).length);
  });
});

describe('pack sessions', () => {
  it('plays the scenes in order through the lesson player', async () => {
    const setup = setupLearning(makeCourse({}, [], [], testPacks));
    await expect(setup.learning.startLesson('sc-markt-prijs', 'focused')).rejects.toThrow('locked');
    const first = await setup.learning.startNextScene('markt');
    expect(first).toMatchObject({ kind: 'lesson', mode: 'focused', lessonId: 'sc-markt-kraam' });
    const outcome = await setup.learning.finish(first!, answers(first!));
    expect(outcome.newItemIds).toEqual(['sc-markt-kraam/twee-kilo-appels', 'sc-markt-kraam/de-kraam', 'sc-markt-kraam/de-appels']);
    const progress = await setup.store.readProgress();
    // The new noun's de/het item starts with it.
    expect(progress.items[articleItemId('sc-markt-kraam/de-kraam')]).toBeDefined();
    expect((await setup.learning.startNextScene('markt'))?.lessonId).toBe('sc-markt-prijs');
    expect(await setup.learning.startNextScene('unknown')).toBeUndefined();
  });

  it('practises the pack with the course items it builds on, and nothing else', async () => {
    const setup = setupLearning(makeCourse({}, [], [], testPacks));
    expect(await setup.learning.startPackPractice('markt')).toBeUndefined();
    for (const lessonId of ['x0-a-hello', 'x1-a-coffee']) {
      const plan = await setup.learning.startLesson(lessonId, 'focused').catch(() => planLesson(setup.course, lessonId, 'focused'));
      await setup.learning.finish(plan, answers(plan));
    }
    const scene = await setup.learning.startNextScene('markt');
    await setup.learning.finish(scene!, answers(scene!));
    setup.advance(30 * DAY);

    const practice = await setup.learning.startPackPractice('markt');
    const practised = new Set(exerciseSteps(practice!).flatMap((step) => step.itemIds));
    expect(practised.has('x1-a-coffee/ik-wil-koffie')).toBe(true);
    expect(practised.has('sc-markt-kraam/de-kraam')).toBe(true);
    expect(practised.has('x0-a-hello/hallo-daar')).toBe(false);
    expect(await setup.learning.startPackPractice('unknown')).toBeUndefined();
  });

  it('keeps the mission tick apart from progress', async () => {
    const setup = setupLearning(makeCourse({}, [], [], testPacks));
    await setup.learning.setMission('markt', true);
    expect((await setup.learning.snapshot('focused')).missions).toEqual({ markt: setup.now() });
    expect(await setup.store.readProgress()).toEqual(emptyProgress());
    await setup.learning.setMission('markt', false);
    expect((await setup.learning.snapshot('focused')).missions).toEqual({});
  });
});

describe('sets', () => {
  const withSet = makeCourse({}, testWordThemes, [], [...testPacks, testSet]);
  const set = withSet.packs.find((entry) => entry.id === 'lijkt')!;

  function finishPart(progress: LearnerProgress, sceneId: string, at: number): LearnerProgress {
    return completeLesson(progress, withSet, sceneId, answers(planLesson(withSet, sceneId, 'focused')), 'focused', at);
  }

  it('lists a set’s shared words with its own, after the part that practises them first', () => {
    expect(set.items.map((item) => item.id)).not.toContain('w-kitchen/vork');
    expect(set.members.map((item) => item.id)).toEqual([
      'sc-lijkt-raar/wat-raar',
      'sc-lijkt-raar/raar',
      'sc-lijkt-vork/een-vork-graag',
      'w-kitchen/vork',
      'sc-lijkt-eng/wat-eng',
    ]);
    // A situation's members are its own items.
    expect(withSet.packs[0]!.members).toEqual(withSet.packs[0]!.items);
  });

  it('introduces the shared words a part practises, as its own', () => {
    let progress = finishPart(emptyProgress(), 'sc-lijkt-raar', T0);
    expect(progress.items['w-kitchen/vork']).toBeUndefined();
    progress = finishPart(progress, 'sc-lijkt-vork', T0 + 1000);
    expect(progress.items['w-kitchen/vork']).toBeDefined();
    // A situation still leaves the course's words to the course.
    expect(finishScene(emptyProgress(), 'sc-markt-kraam', T0).items['x1-a-pay/ik-wil-betalen']).toBeUndefined();
  });

  it('counts its parts and members, and stays out of the situations on Progress', () => {
    const progress = finishPart(emptyProgress(), 'sc-lijkt-raar', T0);
    expect(summarizePack(set, progress, T0)).toMatchObject({ scenes: { completed: 1, total: 3 }, items: { total: 5, new: 3 } });
    expect(summarizeProgress(withSet, progress, T0).packs).toEqual({ started: 0, total: 1, items: { new: 5, learning: 0, strong: 0, total: 5 } });
  });

  it('practises its members, shared words included, and no course module', async () => {
    const setup = setupLearning(withSet);
    for (const sceneId of ['sc-lijkt-raar', 'sc-lijkt-vork']) {
      const plan = await setup.learning.startLesson(sceneId, 'focused');
      await setup.learning.finish(plan, answers(plan));
    }
    setup.advance(30 * DAY);
    const practice = await setup.learning.startPackPractice('lijkt');
    const practised = new Set(exerciseSteps(practice!).flatMap((step) => step.itemIds));
    expect(practised.has('w-kitchen/vork')).toBe(true);
    expect(practised.has('sc-lijkt-raar/raar')).toBe(true);
    expect([...practised].some((id) => id.startsWith('x'))).toBe(false);
  });
});
