import { adj, noun, verb } from '../build';
import type { WordTheme } from '../types';

export const feelings: WordTheme = {
  id: 'feelings',
  title: 'Feelings',
  tier: 2,
  words: [
    adj('zenuwachtig', 'nervous', { example: { dutch: 'Morgen heb ik examen. Ik ben zo zenuwachtig!', english: "I have an exam tomorrow. I'm so nervous!" } }),
    adj('trots', 'proud', { example: { dutch: 'Je hebt je diploma! Ik ben trots op je.', english: "You've got your diploma! I'm proud of you." } }),
    adj('jaloers', 'jealous', { example: { dutch: 'Mijn buurman heeft een nieuwe auto. Ik ben jaloers!', english: "My neighbour has a new car. I'm jealous!" } }),
    adj('eenzaam', 'lonely', { example: { dutch: 'Mijn oma woont alleen en is vaak eenzaam.', english: 'My grandma lives alone and is often lonely.' } }),
    adj('verbaasd', 'amazed', { near: ['verrast'], example: { dutch: 'Ik ben verbaasd dat ze al zo goed Nederlands spreekt.', english: "I'm amazed that she already speaks Dutch so well." } }),
    adj('teleurgesteld', 'disappointed', { example: { dutch: 'Ik heb de baan niet gekregen. Ik ben erg teleurgesteld.', english: "I didn't get the job. I'm very disappointed." } }),
    adj('tevreden', 'satisfied', { example: { dutch: 'Mijn baas is heel tevreden over mijn werk.', english: 'My boss is very satisfied with my work.' } }),
    adj('ongerust', 'worried', {
      accept: ['bezorgd'],
      example: { dutch: 'Mijn zoon is nog niet thuis. Ik ben ongerust.', english: "My son isn't home yet. I'm worried." },
    }),
    adj('gestrest', 'stressed', { example: { dutch: 'Te veel werk en te weinig tijd: ik ben gestrest.', english: "Too much work and too little time: I'm stressed." } }),
    adj('verliefd', 'in love', { example: { dutch: 'Ze denkt de hele dag aan hem. Ze is verliefd.', english: "She thinks about him all day. She's in love." } }),
    adj('opgelucht', 'relieved', { example: { dutch: 'Ik heb mijn telefoon terug! Ik ben zo opgelucht.', english: "I've got my phone back! I'm so relieved." } }),
    adj('bezorgd', 'concerned', {
      note: 'also: delivered (a parcel)',
      accept: ['ongerust'],
      example: { dutch: 'De dokter is bezorgd over mijn hart.', english: 'The doctor is concerned about my heart.' },
    }),
    adj('dankbaar', 'grateful', { example: { dutch: 'Ik ben jullie heel dankbaar voor de hulp.', english: "I'm very grateful to you all for the help." } }),
    adj('schuldig', 'guilty', { example: { dutch: 'Ik ben haar verjaardag vergeten. Ik voel me schuldig.', english: 'I forgot her birthday. I feel guilty.' } }),
    adj('geduldig', 'patient', { example: { dutch: 'Nederlands leren kost tijd. Je moet geduldig zijn.', english: 'Learning Dutch takes time. You have to be patient.' } }),
    adj('ongeduldig', 'impatient', { example: { dutch: 'We wachten al een uur. De kinderen worden ongeduldig.', english: "We've been waiting for an hour. The children are getting impatient." } }),
    adj('enthousiast', 'enthusiastic', { example: { dutch: 'Hij is enthousiast over yoga en gaat elke dag.', english: "He's enthusiastic about yoga and goes every day." } }),
    adj('vrolijk', 'cheerful', { example: { dutch: 'Mijn buurvrouw is altijd vrolijk en lacht veel.', english: 'My neighbour is always cheerful and laughs a lot.' } }),
    adj('kwaad', 'angry', {
      note: 'like boos, often a bit stronger',
      accept: ['boos'],
      example: { dutch: 'Hij komt weer te laat. Ik word echt kwaad!', english: "He's late again. I'm getting really angry!" },
    }),
    adj('verrast', 'surprised', { example: { dutch: 'Een feest voor mij? Ik ben echt verrast!', english: "A party for me? I'm really surprised!" } }),
    adj('geschrokken', 'shocked', { near: ['schrikken'], example: { dutch: 'Ik ben erg geschrokken van het nieuws.', english: 'I was really shocked by the news.' } }),
    adj('spannend', 'exciting, tense', {
      note: "not 'spanning'",
      example: { dutch: 'Dit boek is zo spannend! Ik kan niet stoppen.', english: "This book is so exciting! I can't stop." },
    }),
    adj('heerlijk', 'delicious, lovely', {
      accept: ['lekker'],
      example: { dutch: 'Deze soep is heerlijk! Mag ik nog wat?', english: 'This soup is delicious! Can I have some more?' },
    }),
    adj('vreselijk', 'terrible', { example: { dutch: 'Ik heb slecht geslapen. Ik voel me vreselijk.', english: 'I slept badly. I feel terrible.' } }),
    adj('zielig', 'pitiful', { example: { dutch: 'Hij is gevallen en huilt. Ach, wat zielig!', english: "He's fallen over and he's crying. Oh, poor thing!" } }),
    verb('schrikken', 'to get a fright', { example: { dutch: 'Niet schrikken, het is maar de kat!', english: "Don't be scared, it's only the cat!" } }),
    verb('missen', 'to miss', {
      note: 'a person; also a train',
      example: { dutch: 'Je gaat verhuizen? Ik ga je missen!', english: "You're moving? I'm going to miss you!" },
    }),
    verb('haten', 'to hate', { example: { dutch: 'Ik kan het echt haten als het regent.', english: 'I really hate it when it rains.' } }),
    verb('genieten', 'to enjoy', { example: { dutch: 'We gaan genieten van het mooie weer!', english: "We're going to enjoy the lovely weather!" } }),
    verb('zich vervelen', 'to be bored', {
      note: "ik verveel me = I'm bored; vervelend = annoying",
      example: { dutch: 'Er is hier niets te doen. Hij gaat zich vervelen.', english: "There's nothing to do here. He's going to get bored." },
    }),
    verb('zich schamen', 'to be ashamed, to be embarrassed', {
      example: { dutch: 'Hij gooit afval op straat. Hij moet zich schamen!', english: 'He throws litter in the street. He should be ashamed of himself!' },
    }),
    verb('zich zorgen maken', 'to worry', {
      note: "Maak je geen zorgen! = Don't worry!",
      example: { dutch: 'Bel je moeder even, anders gaat ze zich zorgen maken.', english: "Give your mother a call, or she'll start to worry." },
    }),
    noun('het verdriet', 'the sadness, the grief', { example: { dutch: 'Haar hond is dood. Ze heeft veel verdriet.', english: "Her dog has died. She's very sad." } }),
    verb('spijt hebben', 'to regret', { example: { dutch: 'Ik ga het proberen. Ik wil later geen spijt hebben.', english: "I'm going to give it a try. I don't want any regrets later." } }),
    noun('het heimwee', 'the homesickness', { example: { dutch: 'Ik woon graag in Nederland, maar soms heb ik heimwee.', english: "I like living in the Netherlands, but sometimes I'm homesick." } }),
  ],
};
