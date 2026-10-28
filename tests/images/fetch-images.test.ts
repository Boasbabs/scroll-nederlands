// The dev script that builds the bundled pictures: which licenses it takes, and how it names files.
import { checkPick, commonsCredit, fileNameFor, plainText } from '../../scripts/fetch-images.ts';

const page = 'https://commons.wikimedia.org/wiki/File:Fork.jpg';
const meta = (license: string, extra: Record<string, string> = {}) =>
  Object.fromEntries(Object.entries({ License: license, LicenseShortName: license.toUpperCase(), Artist: '<a href="//commons.wikimedia.org/wiki/User:Ann">Ann &amp; Co</a>', ...extra }).map(([key, value]) => [key, { value }]));

describe('licenses from Commons', () => {
  it('credits CC0, public domain and CC BY with a link to the license', () => {
    expect(commonsCredit(meta('cc0'), page)).toEqual({ author: 'Ann & Co', source: page, license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' });
    expect(commonsCredit(meta('pd'), page)).toMatchObject({ license: 'Public domain', licenseUrl: '' });
    expect(commonsCredit(meta('cc-by-4.0'), page)).toMatchObject({ license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' });
  });

  it('refuses share-alike, non-commercial and no-derivatives licenses, restricted files, and CC BY with nobody to credit', () => {
    for (const license of ['cc-by-sa-4.0', 'cc-by-nc-2.0', 'cc-by-nd-3.0', 'gfdl', '']) expect(commonsCredit(meta(license), page)).toHaveProperty('refused');
    expect(commonsCredit(meta('cc0', { Restrictions: 'personality' }), page)).toEqual({ refused: 'restricted (personality)' });
    expect(commonsCredit(meta('cc-by-2.0', { Artist: '' }), page)).toEqual({ refused: 'CC BY without an author to credit' });
    expect(commonsCredit(meta('cc0', { Artist: '' }), page)).toMatchObject({ author: 'Unknown author' });
  });

  it('reads the author out of Commons HTML', () => {
    expect(plainText('<span class="fn">Walter&nbsp;Bichler</span>')).toBe('Walter Bichler');
  });
});

describe('picks', () => {
  it('names files after the word, with a hash that changes with the pick', () => {
    const pick = { commons: 'File:Fork.jpg' };
    expect(fileNameFor('de vork', pick)).toMatch(/^vork-[0-9a-f]{6}\.webp$/);
    expect(fileNameFor('de vork', pick)).toBe(fileNameFor('de vork', { ...pick }));
    expect(fileNameFor('de vork', { ...pick, focus: [0.5, 0.3] })).not.toBe(fileNameFor('de vork', pick));
    expect(fileNameFor('het T-shirt', pick)).toMatch(/^t-shirt-/);
  });

  it('checks a pick before anything is fetched', () => {
    expect(checkPick('de vork', { commons: 'File:Fork.jpg' })).toBeUndefined();
    expect(checkPick('het brood', { file: 'photos/brood.jpg', author: 'Me' })).toBeUndefined();
    expect(checkPick('De vork', { commons: 'File:Fork.jpg' })).toMatch(/lower case/);
    expect(checkPick('de vork', { commons: 'Fork.jpg' })).toMatch(/File:/);
    expect(checkPick('de vork', { commons: 'File:Fork.jpg', file: 'x.jpg' })).toMatch(/exactly one/);
    expect(checkPick('de vork', { url: 'https://example.org/fork.jpg', author: 'Ann', source: 'https://example.org', license: 'CC BY-SA 4.0' })).toMatch(/CC BY license/);
    expect(checkPick('de vork', { commons: 'File:Fork.jpg', focus: [1.5, 0] })).toMatch(/focus/);
  });
});
