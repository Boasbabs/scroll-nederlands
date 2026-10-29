import { adj, noun, verb } from '../build';
import type { WordTheme } from '../types';

export const feelings: WordTheme = {
  id: 'feelings',
  title: 'Feelings',
  tier: 2,
  words: [
    adj('zenuwachtig', 'nervous', { accept: ['nerveus'], example: { dutch: 'Morgen is mijn eerste werkdag. Ik ben zo zenuwachtig!', english: "Tomorrow is my first day at work. I'm so nervous!" } }),
    adj('trots', 'proud', { example: { dutch: 'Je hebt je diploma! Ik ben trots op je.', english: "You've got your diploma! I'm proud of you." } }),
    adj('jaloers', 'jealous', { example: { dutch: 'Mijn buurman heeft een nieuwe auto. Ik ben jaloers!', english: "My neighbour has a new car. I'm jealous!" } }),
    adj('eenzaam', 'lonely', { example: { dutch: 'Mijn oma woont alleen en is vaak eenzaam.', english: 'My grandma lives alone and is often lonely.' } }),
    adj('verbaasd', 'amazed, astonished', { accept: ['verrast'], example: { dutch: 'Hij is negentig en fietst nog. Ik ben verbaasd!', english: "He's ninety and still cycles. I'm amazed!" } }),
    adj('teleurgesteld', 'disappointed', { example: { dutch: 'Ik had meer verwacht van dit hotel. Ik ben teleurgesteld.', english: "I expected more from this hotel. I'm disappointed." } }),
    adj('tevreden', 'satisfied', { example: { dutch: 'Mijn baas is heel tevreden over mijn werk.', english: 'My boss is very satisfied with my work.' } }),
    adj('ongerust', 'worried', {
      accept: ['bezorgd'],
      example: { dutch: 'Mijn zoon is nog niet thuis. Ik ben ongerust.', english: "My son isn't home yet. I'm worried." },
    }),
    adj('gestrest', 'stressed', { example: { dutch: 'Te veel werk en te weinig tijd: ik ben gestrest.', english: "Too much work and too little time: I'm stressed." } }),
    adj('verliefd', 'in love', { example: { dutch: 'Ze denkt de hele dag aan hem. Ze is verliefd.', english: "She thinks about him all day. She's in love." } }),
    adj('opgelucht', 'relieved', { example: { dutch: 'Ik was zo bang, maar nu ben ik opgelucht.', english: "I was so scared, but now I'm relieved." } }),
    adj('bezorgd', 'concerned', {
      note: 'also: delivered (a parcel)',
      accept: ['ongerust'],
      example: { dutch: 'De dokter is bezorgd over mijn hart.', english: 'The doctor is concerned about my heart.' },
    }),
    adj('dankbaar', 'grateful', { example: { dutch: 'Ik ben jullie heel dankbaar voor de hulp.', english: "I'm very grateful to you all for the help." } }),
    adj('schuldig', 'guilty', { accept: ['slecht'], example: { dutch: 'Ik heb haar koekje opgegeten. Nu voel ik me schuldig.', english: 'I ate her biscuit. Now I feel guilty.' } }),
    adj('geduldig', 'patient', { example: { dutch: 'Nederlands leren kost tijd. Je moet geduldig zijn.', english: 'Learning Dutch takes time. You have to be patient.' } }),
    adj('ongeduldig', 'impatient', { example: { dutch: 'Waar blijft de bus? Ik word ongeduldig.', english: "Where's the bus? I'm getting impatient." } }),
    adj('enthousiast', 'enthusiastic', { example: { dutch: 'Hij is enthousiast over yoga en gaat elke dag.', english: "He's enthusiastic about yoga and goes every day." } }),
    adj('vrolijk', 'cheerful', { accept: ['blij'], example: { dutch: 'Mijn buurvrouw is altijd vrolijk en lacht veel.', english: 'My neighbour is always cheerful and laughs a lot.' } }),
    adj('kwaad', 'angry', {
      note: 'like boos, often a bit stronger',
      accept: ['boos'],
      example: { dutch: 'Hij komt weer te laat. Ik word echt kwaad!', english: "He's late again. I'm getting really angry!" },
    }),
    adj('verrast', 'surprised', { accept: ['verbaasd'], example: { dutch: 'Een feest? Ik wist van niets! Ik ben echt verrast.', english: "A party? I had no idea! I'm really surprised." } }),
    adj('geschrokken', 'shocked', { note: 'from schrikken: ik ben geschrokken, I got a fright', near: ['schrikken'], example: { dutch: 'Ik ben erg geschrokken van het nieuws.', english: 'I was really shocked by the news.' } }),
    adj('spannend', 'exciting, thrilling', {
      note: 'of a thing or a moment: Wat spannend! (exciting, or nerve-racking)',
      example: { dutch: 'Wie wint er? Het is nog heel spannend!', english: "Who's going to win? It's still really exciting!" },
    }),
    adj('heerlijk', 'delicious, lovely', {
      accept: ['lekker'],
      example: { dutch: 'Deze soep is heerlijk! Mag ik nog wat?', english: 'This soup is delicious! Can I have some more?' },
    }),
    adj('vreselijk', 'terrible', { accept: ['slecht', 'verschrikkelijk'], example: { dutch: 'Ik heb gisteren te veel gedronken. Ik voel me vreselijk.', english: 'I drank too much yesterday. I feel terrible.' } }),
    adj('zielig', 'pitiful', { example: { dutch: 'Hij is gevallen en huilt. Ach, wat zielig!', english: "He's fallen over and he's crying. Oh, poor thing!" } }),
    verb('schrikken', 'to get a fright', { note: 'ik schrok, ik ben geschrokken', example: { dutch: 'Niet schrikken, het is maar de kat!', english: "Don't be scared, it's only the cat!" } }),
    verb('missen', 'to miss', {
      note: 'a person; also a train',
      example: { dutch: 'Je gaat verhuizen? Jammer, ik ga je missen!', english: "You're moving? What a shame, I'm going to miss you!" },
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
    noun('het heimwee', 'the homesickness', { accept: ['de heimwee'], note: 'de heimwee is right too', example: { dutch: 'Ik woon graag in Nederland, maar soms heb ik heimwee.', english: "I like living in the Netherlands, but sometimes I'm homesick." } }),
  ],
};
