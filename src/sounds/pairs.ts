// The sound contrasts, in introduction order: vowel length first (it changes
// the most words), then the rounded vowels, the diphthongs, and two
// consonants. Every word is a real, everyday-enough Dutch word; each list
// still needs a check by a Dutch speaker (see the plan doc).
import type { PairWord, SoundContrast } from './types';

function pair(first: string, firstMeaning: string, second: string, secondMeaning: string): [PairWord, PairWord] {
  return [
    { dutch: first, english: firstMeaning },
    { dutch: second, english: secondMeaning },
  ];
}

export const contrasts: Array<SoundContrast> = [
  {
    id: 'a-aa',
    sounds: ['a', 'aa'],
    tip: 'Short a is clipped and made far back, close to the o in British "hot". Long aa is held longer and more open, like the a in "father".',
    pairs: [pair('man', 'man', 'maan', 'moon'), pair('zak', 'bag, pocket', 'zaak', 'shop, business'), pair('tak', 'branch', 'taak', 'task'), pair('lat', 'slat', 'laat', 'late')],
  },
  {
    id: 'e-ee',
    sounds: ['e', 'ee'],
    tip: 'Short e is the e in "bed". Long ee is longer and higher, like the ay in "day".',
    pairs: [pair('pen', 'pen', 'peen', 'carrot'), pair('ben', '(I) am', 'been', 'leg'), pair('hel', 'hell', 'heel', 'whole, very'), pair('vel', 'sheet, skin', 'veel', 'a lot, many')],
  },
  {
    id: 'o-oo',
    sounds: ['o', 'oo'],
    tip: 'Short o is the o in British "pot". Long oo is longer and rounder, like the oa in "boat".',
    pairs: [pair('bot', 'bone', 'boot', 'boat'), pair('pot', 'pot, jar', 'poot', 'paw'), pair('kop', 'cup, head', 'koop', 'purchase'), pair('zon', 'sun', 'zoon', 'son')],
  },
  {
    id: 'o-oe',
    sounds: ['o', 'oe'],
    tip: 'Short o is open, as in British "pot". Oe is the closed oo of "food", with tightly rounded lips.',
    pairs: [pair('bok', 'billy goat', 'boek', 'book'), pair('kok', 'cook', 'koek', 'biscuit, cake'), pair('hok', 'hutch, shed', 'hoek', 'corner'), pair('mos', 'moss', 'moes', 'purée')],
  },
  {
    id: 'i-ie',
    sounds: ['i', 'ie'],
    tip: 'Short i is the i in "bit". Ie is the ee in "see": tense, bright and short.',
    pairs: [pair('vis', 'fish', 'vies', 'dirty'), pair('lip', 'lip', 'liep', 'walked'), pair('zit', 'sit, sits', 'ziet', 'sees'), pair('rit', 'ride, trip', 'riet', 'reed')],
  },
  {
    id: 'uu-oe',
    sounds: ['uu', 'oe'],
    tip: 'Oe is the oo in "food". For uu, say "ee" and round your lips as if for "oo", like French u or German ü.',
    pairs: [pair('vuur', 'fire', 'voer', 'animal feed'), pair('muur', 'wall', 'moer', 'nut (for a bolt)'), pair('buur', 'neighbour', 'boer', 'farmer'), pair('stuur', 'steering wheel', 'stoer', 'tough')],
  },
  {
    id: 'eu-uu',
    sounds: ['eu', 'uu'],
    tip: 'Both have rounded lips. Eu is like the vowel in "her" (no r) with rounded lips. Uu is "ee" with rounded lips: higher and tighter.',
    pairs: [pair('deur', 'door', 'duur', 'expensive'), pair('zeur', 'nag', 'zuur', 'sour'), pair('beurt', 'turn', 'buurt', 'neighbourhood'), pair('geur', 'smell', 'guur', 'raw, bleak (weather)')],
  },
  {
    id: 'ui-ij',
    sounds: ['ui', 'ij'],
    tip: 'Ij (also written ei) sits between the ay in "day" and "eye", with spread lips. Ui starts the same way with rounded lips and glides to a rounded "ee"; English has no vowel quite like it.',
    pairs: [pair('ruim', 'spacious', 'rijm', 'rhyme'), pair('zuil', 'pillar', 'zeil', 'sail'), pair('luid', 'loud', 'leid', '(I) lead'), pair('puin', 'rubble', 'pijn', 'pain')],
  },
  {
    id: 'ui-ou',
    sounds: ['ui', 'ou'],
    tip: 'Ou (also written au) is the ow in "how". Ui is rounder and further forward: start with rounded lips and glide to a rounded "ee".',
    pairs: [pair('buit', 'loot', 'bout', 'bolt'), pair('huid', 'skin', 'houd', '(I) hold'), pair('zuid', 'south', 'zout', 'salt')],
  },
  {
    id: 'ie-ij',
    sounds: ['ie', 'ij'],
    tip: 'Ie is one pure, tense sound, the ee in "see". Ij glides, like the ay in "day" or close to "eye".',
    pairs: [pair('wie', 'who', 'wij', 'we'), pair('lief', 'sweet, kind', 'lijf', 'body'), pair('die', 'that, those', 'dij', 'thigh'), pair('biet', 'beetroot', 'bijt', 'bites')],
  },
  {
    id: 'g-h',
    sounds: ['g', 'h'],
    tip: 'Dutch g is a rough sound from the back of the throat, like the ch in Scottish "loch". H is only breath, as in "hat".',
    pairs: [pair('goed', 'good', 'hoed', 'hat'), pair('geel', 'yellow', 'heel', 'whole, very'), pair('gaan', 'to go', 'haan', 'rooster'), pair('geld', 'money', 'held', 'hero')],
  },
  {
    id: 'w-v',
    sounds: ['w', 'v'],
    tip: 'Dutch w is softer than English w: rest your lower lip lightly against your top teeth, without rounding your lips. V is sharper, close to an f in much of the Netherlands.',
    pairs: [pair('wol', 'wool', 'vol', 'full'), pair('wet', 'law', 'vet', 'fat'), pair('wal', 'quay, bank', 'val', 'fall, trap'), pair('wind', 'wind', 'vind', '(I) find')],
  },
];
