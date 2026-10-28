import { course, noun } from '../build';
import type { WordTheme } from '../types';

export const hobbies: WordTheme = {
  id: 'hobbies',
  title: 'Free time',
  words: [
    course('de muziek'),
    noun('de sport', 'the sport'),
    noun('het voetbal', 'the football'),
    noun('de film', 'the film'),
    noun('het spel', 'the game'),
    course('het feest'),
    noun('het lied', 'the song'),
    noun('de hobby', 'the hobby'),
    noun('de wandeling', 'the walk'),
    noun('de gitaar', 'the guitar'),
    noun('de piano', 'the piano'),
    noun('het concert', 'the concert'),
    noun('de dans', 'the dance'),
    noun('de wedstrijd', 'the match, the competition'),
    noun('het team', 'the team'),
    noun('de tekening', 'the drawing'),
  ],
};
