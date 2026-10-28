import { course, noun, other } from '../build';
import type { WordTheme } from '../types';

export const time: WordTheme = {
  id: 'time',
  title: 'Time',
  words: [
    course('vandaag'),
    course('morgen'),
    course('gisteren'),
    course('de dag'),
    noun('de week', 'the week'),
    noun('de maand', 'the month'),
    course('het jaar'),
    course('uur'),
    noun('de ochtend', 'the morning'),
    noun('de avond', 'the evening'),
    noun('de nacht', 'the night'),
    other('maandag', 'Monday'),
    other('dinsdag', 'Tuesday'),
    course('woensdag'),
    course('donderdag'),
    course('vrijdag'),
    other('zaterdag', 'Saturday'),
    other('zondag', 'Sunday'),
    noun('de verjaardag', 'the birthday'),
    noun('de middag', 'the afternoon'),
  ],
};
