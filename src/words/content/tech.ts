import { course, noun } from '../build';
import type { WordTheme } from '../types';

export const tech: WordTheme = {
  id: 'tech',
  title: 'Phones and computers',
  words: [
    course('de telefoon'),
    noun('het mobieltje', 'the mobile phone'),
    noun('de computer', 'the computer'),
    noun('de laptop', 'the laptop'),
    noun('het internet', 'the internet'),
    noun('de app', 'the app'),
    noun('het bericht', 'the message'),
    noun('de e-mail', 'the email'),
    noun('de foto', 'the photo'),
    noun('het scherm', 'the screen'),
    noun('het toetsenbord', 'the keyboard'),
    course('de oplader'),
    noun('de batterij', 'the battery'),
    noun('het wachtwoord', 'the password'),
    noun('de radio', 'the radio'),
    noun('de krant', 'the newspaper'),
  ],
};
