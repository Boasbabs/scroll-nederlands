import { course, other } from '../build';
import type { WordTheme } from '../types';

export const places: WordTheme = {
  id: 'places',
  title: 'Where and how often',
  words: [
    course('hier'),
    course('daar'),
    course('links'),
    course('rechts'),
    course('onder'),
    other('boven', 'above; upstairs'),
    course('naast'),
    course('achter'),
    course('voor'),
    other('tussen', 'between'),
    course('binnen'),
    other('buiten', 'outside'),
    other('ver', 'far'),
    course('nu'),
    course('altijd'),
    course('vaak'),
    course('soms'),
    course('nooit'),
    course('veel'),
    other('weinig', 'little, few'),
  ],
};
