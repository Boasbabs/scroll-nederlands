import { coverCrop } from '../../src/images/crop';
import type { ImageManifest } from '../../src/images/manifest';
import { createMemoryPictures } from '../../src/images/own';
import { answerPicture, createPictureSource, createRemotePictures, toDataUrl } from '../../src/images/pictures';
import { createStore, parsePictures, parsePreferences } from '../../src/storage/store';
import { makeCourse, testWordThemes } from '../fixtures/curriculum';
import { createMemoryArea } from '../fixtures/memory-storage';

const course = makeCourse({}, testWordThemes);
const images: ImageManifest = {
  'de vork': { file: 'vork-1a2b3c.webp', author: 'A. Photographer', source: 'https://example.org/vork', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
};

describe('cropping to 4:3', () => {
  it('takes the largest centred 4:3 box from wide and tall pictures', () => {
    expect(coverCrop(1000, 500)).toEqual({ x: 167, y: 0, width: 667, height: 500 });
    expect(coverCrop(600, 1000)).toEqual({ x: 0, y: 275, width: 600, height: 450 });
    expect(coverCrop(800, 600)).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });

  it('moves the box towards a focus point, never past the edges', () => {
    expect(coverCrop(600, 1000, [0.5, 0])).toMatchObject({ y: 0 });
    expect(coverCrop(600, 1000, [0.5, 1])).toMatchObject({ y: 550 });
    expect(coverCrop(1000, 500, [0.9, 0.5])).toMatchObject({ x: 333 });
  });
});

describe('an item’s picture', () => {
  // jsdom has no object URLs.
  const original = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };
  beforeEach(() => {
    let count = 0;
    Object.assign(URL, { createObjectURL: vi.fn(() => `blob:own-${++count}`), revokeObjectURL: vi.fn() });
  });
  afterEach(() => Object.assign(URL, original));

  function setup() {
    const store = createStore(createMemoryArea());
    const blobs = createMemoryPictures();
    const downscale = vi.fn(async (image: Blob) => new Blob([image], { type: 'image/webp' }));
    const pictures = createPictureSource({ course, images, blobs, record: store.setPicture, downscale, now: () => 1234 });
    return { store, blobs, downscale, pictures };
  }

  it('is the bundled one, or none', async () => {
    const { pictures } = setup();
    expect(await pictures.pictureFor('w-kitchen/vork')).toEqual({ src: '/images/vork-1a2b3c.webp', own: false });
    expect(await pictures.pictureFor('w-kitchen/mes')).toBeUndefined();
  });

  it('is the learner’s own once saved (made small first and listed for the drills), until removed', async () => {
    const { store, blobs, downscale, pictures } = setup();
    await pictures.save!('w-kitchen/vork', new Blob(['pasted'], { type: 'image/png' }));
    expect(downscale).toHaveBeenCalledOnce();
    expect((await blobs.get('w-kitchen/vork'))?.type).toBe('image/webp');
    expect(await store.readPictures()).toEqual({ 'w-kitchen/vork': 1234 });
    expect(await pictures.pictureFor('w-kitchen/vork')).toEqual({ src: 'blob:own-1', own: true });

    await pictures.remove!('w-kitchen/vork');
    expect(await store.readPictures()).toEqual({});
    expect(await pictures.pictureFor('w-kitchen/vork')).toEqual({ src: '/images/vork-1a2b3c.webp', own: false });
  });
});

describe('pictures in the in-page card', () => {
  it('reach the card as data URLs from the background worker', async () => {
    expect(await toDataUrl(new Blob(['hi'], { type: 'image/webp' }))).toBe('data:image/webp;base64,aGk=');
    const blobs = createMemoryPictures();
    const readFile = vi.fn(async () => new Blob(['bundled'], { type: 'image/webp' }));
    expect(await answerPicture(blobs, readFile, 'w-kitchen/vork', 'vork-1a2b3c.webp')).toEqual({ ok: true, own: false, src: expect.stringMatching(/^data:image\/webp;base64,/) });
    await blobs.put('w-kitchen/vork', new Blob(['own'], { type: 'image/webp' }));
    expect(await answerPicture(blobs, readFile, 'w-kitchen/vork', 'vork-1a2b3c.webp')).toMatchObject({ ok: true, own: true });
    expect(readFile).toHaveBeenCalledOnce();
  });

  it('only reads plain file names from the bundled folder', async () => {
    const readFile = vi.fn(async () => new Blob(['x']));
    expect(await answerPicture(createMemoryPictures(), readFile, 'w-kitchen/mes', '../manifest.json')).toEqual({ ok: false });
    expect(await answerPicture(createMemoryPictures(), readFile, 'w-kitchen/mes')).toEqual({ ok: false });
    expect(readFile).not.toHaveBeenCalled();
  });

  it('asks with the bundled file name and copes with no reply', async () => {
    const send = vi.fn(async () => ({ ok: true, src: 'data:image/webp;base64,AAAA', own: false }));
    const pictures = createRemotePictures(course, images, send);
    expect(await pictures.pictureFor('w-kitchen/vork')).toEqual({ src: 'data:image/webp;base64,AAAA', own: false });
    expect(send).toHaveBeenCalledWith({ type: 'tn:picture', itemId: 'w-kitchen/vork', file: 'vork-1a2b3c.webp' });
    expect(pictures.save).toBeUndefined();
    const silent = createRemotePictures(course, images, async () => {
      throw new Error('extension reloaded');
    });
    expect(await silent.pictureFor('w-kitchen/vork')).toBeUndefined();
  });
});

describe('stored picture settings', () => {
  it('keeps only well-formed entries in the list of own pictures', () => {
    expect(parsePictures({ a: 1, b: 'x', c: Number.NaN })).toEqual({ a: 1 });
    expect(parsePictures(null)).toEqual({});
  });

  it('shows the Dutch first unless the learner asks for translations', () => {
    expect(parsePreferences({}).showTranslations).toBe(false);
    expect(parsePreferences({ showTranslations: true }).showTranslations).toBe(true);
  });
});
