// The scenario packs (src/packs): the pack format, one home per word, and the
// lesson rules for every scene.
import { course } from '../../src/curriculum';
import type { Exercise, LearningItemDraft } from '../../src/curriculum/types';
import { PACKS_STAGE } from '../../src/packs/assemble';
import { packs } from '../../src/packs/content';
import type { Pack } from '../../src/packs/types';
import { validatePacks } from '../../src/packs/validate';
import { coreLesson, makeCourse, stageExercises, testSet, testWordThemes } from '../fixtures/curriculum';

describe('the bundled packs', () => {
  it('pass validation', () => {
    expect(validatePacks(course)).toEqual([]);
  });

  it('list every pack written in src/packs/content, each once', () => {
    const files = import.meta.glob<Record<string, Pack>>('../../src/packs/content/!(index).ts', { eager: true });
    const written = Object.values(files).flatMap((module) => Object.values(module));
    expect(written.length).toBeGreaterThan(0);
    expect(packs.map((pack) => pack.id).sort()).toEqual(written.map((pack) => pack.id).sort());
  });

  it('include the false-friends set, with the words it shares listed among its own', () => {
    const set = course.packs.find((pack) => pack.id === 'valse-vrienden')!;
    expect(set.kind).toBe('set');
    const members = set.members.map((item) => item.id);
    expect(members).toEqual(expect.arrayContaining(['w-adjectives/slim', 'w-people/kind', 'w-food/worst', 'sc-baan-solliciteren/solliciteren']));
    expect(members).toHaveLength(set.items.length + set.shared!.length);
  });

  it('stay beside the course: no scene on the path, the course unchanged', () => {
    expect(course.packs.map((pack) => pack.id)).toEqual(packs.map((pack) => pack.id));
    expect(course.lessons).toHaveLength(272);
    expect(course.lessons.every((lesson) => lesson.stageId !== PACKS_STAGE)).toBe(true);
    for (const pack of course.packs) {
      for (const scene of pack.scenes) expect(course.lesson(scene.id), scene.id).toBe(scene);
    }
  });
});

/** Seven words for a scene, unlike anything in the fixture course. */
function words(scene: string): Array<LearningItemDraft> {
  return ['tafel', 'stoel', 'kast', 'lamp', 'deur', 'muur', 'vloer'].map((word) => ({
    key: `de-${word}-${scene}`,
    dutch: `de ${word}${scene}`,
    english: `the ${word} ${scene}`,
    kind: 'word',
  }));
}

const listen: Exercise = {
  id: 'listen',
  stage: 'recognition',
  kind: 'choice',
  prompt: 'Listen. When can the technician come?',
  audioText: 'De monteur komt morgen tussen negen en twaalf.',
  listenOnly: true,
  options: ['Tomorrow morning', 'Tomorrow afternoon'],
  answer: 'Tomorrow morning',
  explanation: 'Tussen negen en twaalf: between nine and twelve.',
};
const read: Exercise = {
  id: 'read',
  stage: 'recognition',
  kind: 'choice',
  prompt: 'How much is the deposit?',
  passage: 'Huur: € 950 per maand. Borg: twee maanden huur.',
  options: ['€ 1.900', '€ 950'],
  answer: '€ 1.900',
  explanation: 'Twee maanden huur: two months’ rent.',
};
const write: Exercise = {
  id: 'write',
  stage: 'transfer',
  kind: 'write',
  prompt: 'Tell your landlord about the leak and ask when someone can come.',
  mustInclude: [['lekkage'], ['wanneer']],
  minWords: 6,
  modelAnswer: 'Er is een lekkage in de badkamer. Wanneer kan de monteur komen?',
  explanation: 'Say what is wrong, then ask when.',
};

/** A pack in the shape the format asks for: three scenes, 24 items, a listening, a text and a writing task. */
function validPack(overrides: Partial<Pack> = {}): Pack {
  const exercises = (dutch: string, english: string, extra: Array<Exercise>) =>
    [...stageExercises(dutch, english), ...extra].sort((a, b) => ['recognition', 'supportedRecall', 'independentRecall', 'transfer'].indexOf(a.stage) - ['recognition', 'supportedRecall', 'independentRecall', 'transfer'].indexOf(b.stage));
  return {
    id: 'kamer',
    title: 'A room',
    situation: 'Finding a room.',
    buildsOn: ['x1-a'],
    scenes: [
      coreLesson('sc-kamer-kijken', 'Mag ik komen kijken', 'May I come and look', {
        items: [{ key: 'mag-ik-komen-kijken', dutch: 'Mag ik komen kijken', english: 'May I come and look', kind: 'phrase' }, ...words('a')],
        exercises: exercises('Mag ik komen kijken', 'May I come and look', [listen]),
      }),
      coreLesson('sc-kamer-huur', 'Wat is de huur', 'What is the rent', {
        items: [{ key: 'wat-is-de-huur', dutch: 'Wat is de huur', english: 'What is the rent', kind: 'phrase' }, ...words('b')],
        exercises: exercises('Wat is de huur', 'What is the rent', [read]),
      }),
      coreLesson('sc-kamer-lek', 'Er is een lek', 'There is a leak', {
        items: [{ key: 'er-is-een-lek', dutch: 'Er is een lek', english: 'There is a leak', kind: 'phrase' }, ...words('c')],
        exercises: exercises('Er is een lek', 'There is a leak', [write]),
      }),
    ],
    mission: 'Read three rental adverts.',
    cultureNote: 'Check whether the rent includes service charges.',
    ...overrides,
  };
}

function issuesFor(pack: Pack): Array<string> {
  return validatePacks(makeCourse({}, testWordThemes, [], [pack]));
}

describe('validatePacks', () => {
  it('accepts a pack in the pack format', () => {
    expect(issuesFor(validPack())).toEqual([]);
  });

  it('reports a word the course or the word track already teaches, articles aside', () => {
    const pack = validPack();
    pack.scenes[0]!.items.push({ key: 'vork', dutch: 'vork', english: 'fork', kind: 'phrase' }, { key: 'koffie', dutch: 'Ik wil koffie', english: 'I want coffee', kind: 'phrase' });
    expect(issuesFor(pack)).toEqual([
      'sc-kamer-kijken/vork: "vork" is already taught by w-kitchen/vork',
      'sc-kamer-kijken/koffie: "Ik wil koffie" is already taught by x1-a-coffee/ik-wil-koffie',
    ]);
  });

  it('reports a noun without its article, and an article without a noun', () => {
    const pack = validPack();
    pack.scenes[0]!.items.push({ key: 'borg', dutch: 'borg', english: 'the deposit', kind: 'word' }, { key: 'kaal', dutch: 'de kaal', english: 'unfurnished', kind: 'word' });
    expect(issuesFor(pack)).toEqual(['sc-kamer-kijken/borg: a noun needs de or het', 'sc-kamer-kijken/kaal: a noun\'s English starts with "the"']);
  });

  it('reports a pack outside the format', () => {
    const pack = validPack();
    const issues = issuesFor({ ...pack, mission: ' ', buildsOn: ['nowhere'], scenes: pack.scenes.slice(0, 2).map((scene) => ({ ...scene, exercises: scene.exercises.filter((exercise) => !exercise.listenOnly) })) });
    expect(issues).toEqual(
      expect.arrayContaining([
        'kamer: empty mission',
        'kamer: builds on unknown module nowhere',
        'kamer: needs 3 to 4 scenes',
        'kamer: needs at least 20 items (has 16)',
        'kamer: needs a listening exercise (listenOnly)',
        'kamer: needs a writing exercise',
      ]),
    );
  });

  it('reports scene ids outside the pack, and stages out of order', () => {
    const pack = validPack();
    const [first, ...rest] = pack.scenes;
    const issues = issuesFor({ ...pack, scenes: [{ ...first!, id: 'sc-room-kijken', exercises: [...first!.exercises].reverse() }, ...rest] });
    expect(issues).toContain('sc-room-kijken: scene id must be kebab-case and start with sc-kamer-');
    expect(issues.some((issue) => issue.endsWith('exercises are not in stage order'))).toBe(true);
  });

  it('reports an exercise that practises a later scene’s item', () => {
    const pack = validPack();
    pack.scenes[0]!.exercises = pack.scenes[0]!.exercises.map((exercise) => (exercise.id === 'listen' ? { ...exercise, items: ['sc-kamer-huur/wat-is-de-huur'] } : exercise));
    expect(issuesFor(pack)).toContain(
      'sc-kamer-kijken/listen: item sc-kamer-huur/wat-is-de-huur is not taught by this scene, an earlier one, the course or the word track',
    );
  });
});

describe('validatePacks: sets', () => {
  function issuesForSet(set: Pack): Array<string> {
    return validatePacks(makeCourse({}, testWordThemes, [], [set]));
  }

  it('accepts a set without the situation’s parts: no text, listening, writing or mission, and few items', () => {
    expect(issuesForSet(testSet)).toEqual([]);
  });

  it('still holds a set’s scenes to the lesson rules', () => {
    const [first, ...rest] = testSet.scenes;
    expect(issuesForSet({ ...testSet, scenes: [{ ...first!, exercises: first!.exercises.filter((exercise) => exercise.stage !== 'transfer') }, ...rest] })).toEqual(['sc-lijkt-raar: no transfer exercise']);
  });

  it('reports shared words that are unknown, its own, practised nowhere or listed twice', () => {
    expect(issuesForSet({ ...testSet, shared: ['w-kitchen/vork', 'w-kitchen/vork', 'w-kitchen/lepel', 'w-kitchen/nowhere', 'sc-lijkt-raar/raar'] })).toEqual([
      'lijkt: no scene practises the shared word w-kitchen/lepel',
      'lijkt: shared word w-kitchen/nowhere is not taught by the course, the word track or another pack',
      'lijkt: shared word sc-lijkt-raar/raar is not taught by the course, the word track or another pack',
      'lijkt: a shared word is listed twice',
    ]);
  });

  it('reports an empty mission on a set, a missing one on a situation, and shared words on a situation', () => {
    expect(issuesForSet({ ...testSet, mission: ' ' })).toEqual(['lijkt: empty mission']);
    const situation = validPack({ mission: undefined, shared: ['w-kitchen/vork'] });
    expect(issuesFor(situation)).toEqual(expect.arrayContaining(['kamer: empty mission', 'kamer: only a set lists shared words']));
  });
});
