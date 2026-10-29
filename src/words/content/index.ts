// The basic-word list, theme by theme. Theme order matters: introduction
// takes one word from each theme in turn (see placeWords), so the first
// themes here lead each round. Tier 1 (the 625 basic words) comes first,
// then tier 2 (words 626–1,000), which follows it in the mixed list.
import type { WordTheme } from '../types';
import { actions } from './actions';
import { adjectives } from './adjectives';
import { animals } from './animals';
import { body } from './body';
import { clothing } from './clothing';
import { colours } from './colours';
import { drinks } from './drinks';
import { feelings } from './feelings';
import { food } from './food';
import { fruitVeg } from './fruit-veg';
import { hobbies } from './hobbies';
import { home } from './home';
import { ideas } from './ideas';
import { jobs } from './jobs';
import { kitchen } from './kitchen';
import { linking } from './linking';
import { nature } from './nature';
import { people } from './people';
import { places } from './places';
import { qualities } from './qualities';
import { sport } from './sport';
import { tech } from './tech';
import { things } from './things';
import { time } from './time';
import { town } from './town';
import { transport } from './transport';
import { verbs } from './verbs';
import { workSchool } from './work-school';

export const wordThemes: Array<WordTheme> = [
  verbs,
  people,
  home,
  adjectives,
  food,
  body,
  town,
  kitchen,
  drinks,
  clothing,
  transport,
  animals,
  time,
  nature,
  fruitVeg,
  places,
  colours,
  workSchool,
  things,
  tech,
  hobbies,
  // Tier 2
  actions,
  ideas,
  qualities,
  linking,
  feelings,
  jobs,
  sport,
];
