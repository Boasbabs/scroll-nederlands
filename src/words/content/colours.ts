import { adj, course, noun } from '../build';
import type { WordTheme } from '../types';

export const colours: WordTheme = {
  id: 'colours',
  title: 'Colours and materials',
  words: [
    course('de kleur'),
    adj('rood', 'red'),
    adj('blauw', 'blue'),
    adj('groen', 'green'),
    adj('geel', 'yellow'),
    adj('zwart', 'black'),
    adj('wit', 'white'),
    adj('oranje', 'orange'),
    adj('bruin', 'brown'),
    adj('grijs', 'grey'),
    adj('roze', 'pink'),
    adj('paars', 'purple'),
    noun('het hout', 'the wood (material)'),
    noun('het metaal', 'the metal'),
    noun('het plastic', 'the plastic'),
    noun('de wol', 'the wool'),
    noun('het leer', 'the leather'),
    noun('de stof', 'the fabric', { note: 'dust is het stof', articleCue: 'the fabric clothes and curtains are made of' }),
    noun('het goud', 'the gold'),
    noun('het zilver', 'the silver'),
  ],
};
