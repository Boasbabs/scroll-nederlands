import { course, noun } from '../build';
import type { WordTheme } from '../types';

export const things: WordTheme = {
  id: 'things',
  title: 'Everyday things',
  words: [
    noun('het geld', 'the money'),
    course('de sleutels'),
    course('de portemonnee'),
    noun('het ding', 'the thing'),
    noun('de euro', 'the euro'),
    noun('de pinpas', 'the debit card'),
    noun('de doos', 'the box'),
    noun('de zak', 'the bag; the pocket'),
    course('het pakket'),
    noun('het cadeau', 'the present, the gift'),
    course('de handdoek'),
    noun('de zeep', 'the soap'),
    noun('de tandenborstel', 'the toothbrush'),
    noun('de kam', 'the comb'),
    course('de bon'),
    course('de postzegel'),
    noun('de cent', 'the cent'),
    noun('de bal', 'the ball'),
    noun('het speelgoed', 'the toys'),
    noun('de kaars', 'the candle'),
    noun('de lucifer', 'the match (for lighting)'),
    noun('het touw', 'the rope'),
  ],
};
