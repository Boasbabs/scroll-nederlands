// The minimal pairs (src/sounds/pairs.ts): real words that differ only in the contrasted sound.
import { course } from '../../src/curriculum';
import { contrastItemId } from '../../src/sounds/assemble';
import { contrasts } from '../../src/sounds/pairs';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Other spellings of a sound: ij is also written ei, ou also au. */
const SPELLINGS: Record<string, Array<string>> = { ij: ['ij', 'ei'], ou: ['ou', 'au'] };

/** The word with the contrasted sound blanked; a final d sounds as t (zuid and zout differ only in ui/ou). */
function skeleton(word: string, sound: string): string | undefined {
  const spelling = (SPELLINGS[sound] ?? [sound]).find((option) => word.includes(option));
  return spelling && word.replace(spelling, '_').replace(/d$/, 't');
}

describe('the sound contrasts', () => {
  it('has twelve contrasts with permanent ids, each one item in the course index', () => {
    expect(contrasts).toHaveLength(12);
    const ids = contrasts.map((contrast) => contrast.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => KEBAB.test(id))).toBe(true);
    expect(course.sounds.map((item) => item.id)).toEqual(contrasts.map(contrastItemId));
  });

  it('gives each contrast 3 to 5 pairs that differ only in its two sounds', () => {
    const issues: Array<string> = [];
    for (const contrast of contrasts) {
      if (contrast.pairs.length < 3 || contrast.pairs.length > 5) issues.push(`${contrast.id}: ${contrast.pairs.length} pairs`);
      if (!contrast.tip.trim()) issues.push(`${contrast.id}: no tip`);
      const words = contrast.pairs.flat().map((word) => word.dutch);
      if (new Set(words).size !== words.length) issues.push(`${contrast.id}: a word twice`);
      for (const [first, second] of contrast.pairs) {
        for (const word of [first, second]) {
          if (!/^[a-z]+$/.test(word.dutch)) issues.push(`${contrast.id}: "${word.dutch}" is not one plain word`);
          if (!word.english.trim()) issues.push(`${contrast.id}: no gloss for ${word.dutch}`);
        }
        const a = skeleton(first.dutch, contrast.sounds[0]);
        const b = skeleton(second.dutch, contrast.sounds[1]);
        if (!a || a !== b) issues.push(`${contrast.id}: ${first.dutch}/${second.dutch} differ in more than ${contrast.sounds.join('/')}`);
      }
    }
    expect(issues).toEqual([]);
  });
});
