import { course, noun } from '../build';
import type { WordTheme } from '../types';

export const clothing: WordTheme = {
  id: 'clothing',
  title: 'Clothes',
  words: [
    noun('de kleren', 'the clothes', { plural: true }),
    course('de jas'),
    noun('de broek', 'the trousers'),
    noun('de schoen', 'the shoe'),
    noun('het T-shirt', 'the T-shirt', { accept: ['de T-shirt'], note: 'de T-shirt is right too' }),
    noun('de trui', 'the jumper'),
    noun('het overhemd', 'the shirt'),
    noun('de jurk', 'the dress'),
    noun('de rok', 'the skirt'),
    noun('de sok', 'the sock'),
    noun('de spijkerbroek', 'the jeans'),
    course('de tas'),
    course('de bril'),
    noun('de muts', 'the woolly hat'),
    noun('de pet', 'the cap'),
    noun('de sjaal', 'the scarf'),
    noun('de handschoen', 'the glove'),
    noun('de laars', 'the boot'),
    course('de paraplu'),
    noun('de riem', 'the belt'),
    noun('het horloge', 'the watch'),
    noun('de ring', 'the ring'),
    noun('de knoop', 'the button'),
    noun('het pak', 'the suit'),
    noun('de pyjama', 'the pyjamas'),
  ],
};
