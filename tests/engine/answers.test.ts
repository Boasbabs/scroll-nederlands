import { checkChoice, checkOrder, checkTyped, checkWriting, diffTokens, normalizeAnswer } from '../../src/engine/answers';

describe('normalizeAnswer', () => {
  it('ignores case, outer punctuation and extra spaces but keeps apostrophes', () => {
    expect(normalizeAnswer('  Ik wil  graag water! ')).toBe('ik wil graag water');
    expect(normalizeAnswer('Twee auto’s.')).toBe("twee auto's");
  });
});

describe('checkTyped', () => {
  const accepted = ['Ik wil graag betalen.', 'Mag ik betalen?'];

  it('accepts any listed answer regardless of case and punctuation', () => {
    expect(checkTyped('ik wil graag betalen', accepted)).toMatchObject({ verdict: 'correct', correct: true });
    expect(checkTyped('Mag ik betalen', accepted)).toMatchObject({ verdict: 'correct', expected: 'Mag ik betalen?' });
  });

  it('counts a missing accent as correct but says so', () => {
    const result = checkTyped('een', ['één']);
    expect(result).toMatchObject({ verdict: 'accent', correct: true });
    expect(result.note).toContain('één');
  });

  it('tolerates one slip in a longer answer and shows the spelling', () => {
    const result = checkTyped('Ik wil graag betaeln', accepted);
    expect(result).toMatchObject({ verdict: 'typo', correct: true, expected: 'Ik wil graag betalen.' });
  });

  it('does not tolerate slips in short words, or at all when spelling is the point', () => {
    expect(checkTyped('hoj', ['hoi']).correct).toBe(false);
    expect(checkTyped('Goedemidag', ['Goedemiddag'], true).correct).toBe(false);
    expect(checkTyped('Goedemidag', ['Goedemiddag']).correct).toBe(true);
  });

  it('never counts a swapped article or determiner as a typo', () => {
    const kopje = ['Het kopje is in de keuken.', 'Het kopje staat in de keuken.'];
    expect(checkTyped('De kopje is in de keuken.', kopje)).toMatchObject({
      verdict: 'incorrect',
      correct: false,
      expected: 'Het kopje is in de keuken.',
      note: 'Check the word "de".',
    });
    expect(checkTyped('Het kopje is in het keuken.', kopje)).toMatchObject({ verdict: 'incorrect', note: 'Check the word "het".' });
    expect(checkTyped('Die huis is groot.', ['Dat huis is groot.']).correct).toBe(false);
    expect(checkTyped('Deze huis is groot.', ['Dit huis is groot.']).correct).toBe(false);
    expect(checkTyped('Ik heb een auto.', ['Ik heb geen auto.']).correct).toBe(false);
  });

  it('still tolerates a slip elsewhere when the determiners are right', () => {
    const kopje = ['Het kopje is in de keuken.'];
    expect(checkTyped('Het kopje is in de keukne.', kopje)).toMatchObject({ verdict: 'typo', correct: true });
    // A transposed letter inside "het" is a typo, not a different word.
    expect(checkTyped('Hte kopje is in de keuken.', kopje)).toMatchObject({ verdict: 'typo', correct: true });
    // één and een differ only by accents.
    expect(checkTyped('Ik heb een kind.', ['Ik heb één kind.'])).toMatchObject({ verdict: 'accent', correct: true });
  });

  it('counts a slip that spells another word the app teaches as that word, and names it', () => {
    const words = new Map([
      ['de boot', { dutch: 'de boot', english: 'the boat' }],
      ['slecht', { dutch: 'slecht', english: 'bad' }],
      ['hoe gaat het met je', { dutch: 'Hoe gaat het met je?', english: 'How are you?' }],
    ]);
    const taught = (text: string) => words.get(normalizeAnswer(text));
    expect(checkTyped('De boot', ['de boom'], false, taught)).toMatchObject({
      verdict: 'incorrect',
      correct: false,
      expected: 'de boom',
      note: '"de boot" means "the boat".',
    });
    expect(checkTyped('slecht', ['slechts'], false, taught)).toMatchObject({ verdict: 'incorrect', note: '"slecht" means "bad".' });
    expect(checkTyped('Hoe gaat het met je?', ['Hoe gaat het met u?'], false, taught)).toMatchObject({ verdict: 'incorrect', note: '"Hoe gaat het met je?" means "How are you?"' });
    // A slip that spells no word is still a typo, and another word the answers accept is right.
    expect(checkTyped('de booom', ['de boom'], false, taught)).toMatchObject({ verdict: 'typo', correct: true });
    expect(checkTyped('de boot', ['de boom', 'de boot'], false, taught)).toMatchObject({ verdict: 'correct' });
  });

  it('marks a wrong or empty answer incorrect and returns the closest model answer', () => {
    expect(checkTyped('Ik wil koffie', accepted)).toMatchObject({ verdict: 'incorrect', expected: 'Ik wil graag betalen.' });
    expect(checkTyped('   ', accepted).correct).toBe(false);
  });
});

describe('other answer checks', () => {
  it('checks choices exactly', () => {
    expect(checkChoice('Goedemiddag!', 'Goedemiddag!').correct).toBe(true);
    expect(checkChoice('Goedemorgen!', 'Goedemiddag!').correct).toBe(false);
  });

  it('accepts the main word order or a listed alternative', () => {
    const words = ['Morgen', 'ga', 'ik', 'werken.'];
    const alternatives = [['Ik', 'ga', 'morgen', 'werken.']];
    expect(checkOrder(['Morgen', 'ga', 'ik', 'werken.'], words, alternatives).correct).toBe(true);
    expect(checkOrder(['Ik', 'ga', 'morgen', 'werken.'], words, alternatives).correct).toBe(true);
    expect(checkOrder(['Morgen', 'ik', 'ga', 'werken.'], words, alternatives)).toMatchObject({
      correct: false,
      expected: 'Morgen ga ik werken.',
    });
  });

  it('checks short writing leniently and explains what is missing', () => {
    const groups = [['hoi', 'hallo'], ['morgen'], ['kom', 'kan']];
    expect(checkWriting('Hoi Sam, ik kom morgen om acht uur.', groups, 5, 'model').correct).toBe(true);
    const missing = checkWriting('Hoi Sam!', groups, 5, 'Hoi Sam, ik kom morgen.');
    expect(missing.correct).toBe(false);
    expect(missing.note).toContain('morgen');
    expect(missing.note).toContain('at least 5 words');
  });

  it('highlights the words of the model answer that were missed', () => {
    const tokens = diffTokens('Ik wil graag betalen.', 'Ik wil betalen');
    expect(tokens.filter((token) => token.missed).map((token) => token.text)).toEqual(['graag']);
  });
});
