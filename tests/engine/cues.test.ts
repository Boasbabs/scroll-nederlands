// Recall drills without English (Fluent Forever): pictures, situations, lesson examples.
import { course as realCourse } from '../../src/curriculum';
import { exampleGap, generateExercise, seededRandom } from '../../src/engine/exercises';
import { exerciseSteps, introStepIds } from '../../src/engine/plan';
import { imageFor, type ImageManifest } from '../../src/images/manifest';
import { pictureCheck } from '../../src/images/pictures';
import { createLearning } from '../../src/learning/actions';
import { coreLesson, makeCourse, testWordThemes } from '../fixtures/curriculum';
import { setupLearning, T0 } from '../ui/harness';

const index = makeCourse(
  {
    'x0-a-hello': {
      situation: 'You meet your new neighbour on the stairs.',
      items: [
        { key: 'hallo-daar', dutch: 'Hallo daar', english: 'Hello there', kind: 'phrase' },
        { key: 'goedemorgen', dutch: 'Goedemorgen', english: 'Good morning', kind: 'word' },
        { key: 'hoe-gaat-het', dutch: 'Hoe gaat het?', english: 'How are you?', kind: 'phrase' },
      ],
      examples: [{ dutch: 'Goedemorgen, Sanne! Hoe gaat het?', english: 'Good morning, Sanne! How are you?' }],
    },
    'x1-a-coffee': { ...coreLesson('x1-a-coffee', 'Ik wil koffie', 'I want coffee'), situation: 'The barista looks at you and waits.' },
  },
  testWordThemes,
);
const item = (id: string) => index.item(id)!;
const drill = (id: string, stage: Parameters<typeof generateExercise>[2], context = {}, variant = 0) =>
  generateExercise(index, item(id), stage, variant, seededRandom('cues'), context);

describe('a lesson example with the phrase blanked', () => {
  it('blanks the phrase as the example writes it, keeping the punctuation around it', () => {
    expect(exampleGap({ examples: [{ dutch: 'Goedemorgen! Hoe gaat het?', english: 'Morning! How are you?' }] }, 'hoe gaat het')).toEqual({
      sentence: 'Goedemorgen! ___?',
      answer: 'Hoe gaat het',
      english: 'Morning! How are you?',
    });
  });

  it('matches whole words, skips examples that are only the phrase, and reads patterns without their dots', () => {
    const lesson = {
      examples: [
        { dutch: 'Hoe gaat het?', english: 'How are you?' },
        { dutch: 'Welkom in Utrecht!', english: 'Welcome to Utrecht!' },
        { dutch: 'Ik wil graag een koffie.', english: 'I would like a coffee.' },
      ],
    };
    expect(exampleGap(lesson, 'Hoe gaat het?')).toBeUndefined();
    expect(exampleGap(lesson, 'wel')).toBeUndefined();
    expect(exampleGap(lesson, 'Ik wil graag …')).toMatchObject({ sentence: '___ een koffie.', answer: 'Ik wil graag' });
    expect(exampleGap({}, 'Hallo')).toBeUndefined();
  });
});

describe('example gaps in the real course', () => {
  it('fill back into their example word for word', () => {
    let gaps = 0;
    const broken: Array<string> = [];
    for (const lesson of realCourse.lessons) {
      for (const item of lesson.items.slice(1)) {
        const gap = exampleGap(lesson, item.dutch);
        if (!gap) continue;
        gaps++;
        const example = lesson.examples!.find((entry) => entry.english === gap.english)!;
        if (gap.sentence.replace('___', gap.answer) !== example.dutch.split(/\s+/).join(' ')) broken.push(`${item.id}: ${gap.sentence}`);
      }
    }
    expect(broken).toEqual([]);
    expect(gaps).toBeGreaterThan(50);
  });
});

describe('recall cues', () => {
  it('asks for a lesson’s main phrase from its situation, never in English', () => {
    const supported = drill('x0-a-hello/hallo-daar', 'supportedRecall');
    expect(supported).toMatchObject({ kind: 'type', prompt: 'What do you say?', situation: 'You meet your new neighbour on the stairs.', hint: 'H____ d___' });
    const unaided = drill('x0-a-hello/hallo-daar', 'independentRecall');
    expect(unaided).toMatchObject({ kind: 'type', prompt: 'What do you say?', situation: 'You meet your new neighbour on the stairs.', answers: ['Hallo daar'] });
    expect(JSON.stringify([supported.prompt, unaided.prompt])).not.toContain('Hello there');
    expect(drill('x1-a-coffee/ik-wil-koffie', 'supportedRecall')).toMatchObject({
      kind: 'order',
      prompt: 'Build what you would say.',
      situation: 'The barista looks at you and waits.',
      words: ['Ik', 'wil', 'koffie'],
    });
  });

  it('asks for other phrases in a lesson example, with its English only while supported', () => {
    const supported = drill('x0-a-hello/hoe-gaat-het', 'supportedRecall');
    expect(supported).toEqual(
      expect.objectContaining({ kind: 'cloze', sentence: 'Goedemorgen, Sanne! ___?', answers: ['Hoe gaat het', 'Hoe gaat het?'], english: 'Good morning, Sanne! How are you?' }),
    );
    const unaided = drill('x0-a-hello/hoe-gaat-het', 'independentRecall');
    expect(unaided).toMatchObject({ kind: 'cloze', sentence: 'Goedemorgen, Sanne! ___?' });
    expect(unaided).not.toHaveProperty('english');
    expect(drill('x0-a-hello/goedemorgen', 'independentRecall')).toMatchObject({ kind: 'cloze', sentence: '___, Sanne! Hoe gaat het?', answers: ['Goedemorgen', 'Goedemorgen'] });
  });

  it('falls back to the English with no situation or example to use', () => {
    expect(drill('w-kitchen/vork', 'independentRecall')).toMatchObject({ kind: 'type', prompt: 'How do you say "the fork" in Dutch?' });
    expect(drill('w-kitchen/vork', 'independentRecall')).not.toHaveProperty('situation');
    // Dictation stays dictation.
    expect(drill('x0-a-hello/hallo-daar', 'transfer')).toMatchObject({ kind: 'type', listenOnly: true, answers: ['Hallo daar'] });
  });
});

describe('picture drills', () => {
  const kitchen = new Set(['w-kitchen/vork', 'w-kitchen/mes', 'w-kitchen/lepel']);
  const context = { hasPicture: (id: string) => kitchen.has(id) };

  it('recognises by picture: listen and pick, or read and pick', () => {
    const listen = drill('w-kitchen/vork', 'recognition', context, 1);
    expect(listen).toMatchObject({ kind: 'choice', prompt: 'Listen. Which picture?', listenOnly: true, audioText: 'de vork', answer: 'the fork' });
    if (listen.kind !== 'choice') throw new Error('not a choice');
    expect(new Set(Object.values(listen.optionPictures ?? {}))).toEqual(kitchen);
    expect(Object.keys(listen.optionPictures ?? {}).sort()).toEqual([...listen.options].sort());
    const read = drill('w-kitchen/vork', 'recognition', context, 0);
    expect(read).toMatchObject({ kind: 'choice', prompt: 'Which picture is "de vork"?', audioText: 'de vork' });
    expect(read.listenOnly).toBeFalsy();
  });

  it('shows four pictures when there are enough', () => {
    const more = { hasPicture: (id: string) => kitchen.has(id) || id === 'w-kitchen/glas' || id === 'w-animals/hond' };
    const choice = drill('w-kitchen/vork', 'recognition', more, 1);
    expect(choice.kind === 'choice' && choice.options).toHaveLength(4);
  });

  it('needs two other pictures for a picture choice, else asks for the meaning', () => {
    const few = { hasPicture: (id: string) => id === 'w-kitchen/vork' || id === 'w-kitchen/mes' };
    const choice = drill('w-kitchen/vork', 'recognition', few, 1);
    expect(choice).toMatchObject({ kind: 'choice', prompt: 'Listen. What does it mean?' });
    expect(choice).not.toHaveProperty('optionPictures');
  });

  it('recalls from the picture, with a letter hint while supported', () => {
    expect(drill('w-kitchen/vork', 'supportedRecall', context)).toMatchObject({ kind: 'type', prompt: 'What is this in Dutch?', picture: 'w-kitchen/vork', hint: 'd_ v___' });
    expect(drill('w-kitchen/vork', 'independentRecall', context)).toMatchObject({ kind: 'type', prompt: 'What is this in Dutch?', picture: 'w-kitchen/vork', answers: ['de vork'] });
    expect(drill('w-kitchen/vork', 'transfer', context)).toMatchObject({ kind: 'type', listenOnly: true });
  });

  it('prefers a picture to the situation for a main phrase that has one', () => {
    const exercise = drill('x0-a-hello/hallo-daar', 'independentRecall', { hasPicture: (id: string) => id === 'x0-a-hello/hallo-daar' });
    expect(exercise).toMatchObject({ picture: 'x0-a-hello/hallo-daar', prompt: 'What is this in Dutch?' });
    expect(exercise).not.toHaveProperty('situation');
  });
});

describe('which items have a picture', () => {
  const images: ImageManifest = { 'de vork': { file: 'vork-1a2b3c.webp', author: 'A. Photographer', source: 'https://example.org/vork', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' } };

  it('finds a bundled picture by the item’s Dutch, and the learner’s own by item id', () => {
    expect(imageFor(images, 'De vork.')?.file).toBe('vork-1a2b3c.webp');
    expect(imageFor(images, 'de lepel')).toBeUndefined();
    const has = pictureCheck(index, images, { 'w-kitchen/mes': T0 });
    expect(['w-kitchen/vork', 'w-kitchen/mes', 'w-kitchen/lepel'].map(has)).toEqual([true, true, false]);
  });

  it('plans word drills with the pictures it finds', async () => {
    const setup = setupLearning(index);
    const learning = createLearning({ store: setup.store, course: index, images, now: setup.now });
    await setup.store.setPicture('w-animals/hond', T0);
    const plan = await learning.startWords('focused');
    expect(introStepIds(plan!)).toContain('w-kitchen/vork');
    const pictured = exerciseSteps(plan!).filter((planned) => planned.exercise.picture).map((planned) => planned.exercise.picture);
    expect(new Set(pictured)).toEqual(new Set(['w-kitchen/vork', 'w-animals/hond']));
  });
});
