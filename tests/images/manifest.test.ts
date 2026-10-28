// The bundled pictures (src/images/images.json, public/images/): openly
// licensed, credited, and each showing a word the learner meets.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { course } from '../../src/curriculum';
import { normalizeAnswer } from '../../src/engine/answers';
import { bundledImages } from '../../src/images/manifest';

// Vitest runs from the repository root.
const folder = path.resolve('public/images');
/** CC0, public domain and CC BY allow cropping without passing a license on; NC, ND and SA are out. */
const LICENSE = /^(CC0 1\.0|Public domain|CC BY \d\.\d|Own photo)$/;

describe('the bundled pictures', () => {
  const entries = Object.entries(bundledImages);
  const taught = new Set(course.items.map((item) => normalizeAnswer(item.dutch)));

  it('show words the course or the word list teaches', () => {
    expect(entries.map(([dutch]) => dutch).filter((dutch) => !taught.has(dutch) || normalizeAnswer(dutch) !== dutch)).toEqual([]);
  });

  it('credit the author and an allowed license', () => {
    const issues: Array<string> = [];
    for (const [dutch, credit] of entries) {
      if (!LICENSE.test(credit.license)) issues.push(`${dutch}: license "${credit.license}"`);
      if (!credit.author.trim()) issues.push(`${dutch}: no author`);
      if (credit.license !== 'Own photo' && !/^https:\/\//.test(credit.source)) issues.push(`${dutch}: no source page`);
      if (/^CC/.test(credit.license) && !/^https:\/\/creativecommons\.org\//.test(credit.licenseUrl)) issues.push(`${dutch}: no license link`);
    }
    expect(issues).toEqual([]);
  });

  it('are WebP files in public/images, with no file left over', () => {
    const files = entries.map(([, credit]) => credit.file);
    expect(files.filter((file) => !/^[a-z0-9-]+\.webp$/.test(file) || !existsSync(path.join(folder, file)))).toEqual([]);
    const onDisk = existsSync(folder) ? readdirSync(folder).filter((file) => !file.startsWith('.')) : [];
    expect(onDisk.filter((file) => !files.includes(file))).toEqual([]);
  });
});
