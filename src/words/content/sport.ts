import { adj, noun, verb } from '../build';
import type { WordTheme } from '../types';

export const sport: WordTheme = {
  id: 'sport',
  title: 'Sport and clubs',
  tier: 2,
  words: [
    verb('hardlopen', 'to go running', {
      note: 'separable: ik loop hard',
      example: { dutch: 'Ik wil in dertig minuten vijf kilometer hardlopen.', english: 'I want to run five kilometres in thirty minutes.' },
    }),
    noun('de sportschool', 'the gym', {
      example: { dutch: 'Ik ga naar de sportschool om sterker te worden.', english: 'I go to the gym to get stronger.' },
    }),
    verb('trainen', 'to train', {
      example: { dutch: 'Als je beter wilt worden, moet je veel trainen.', english: 'If you want to get better, you have to train a lot.' },
    }),
    noun('de vereniging', 'the association', {
      note: 'most Dutch sports clubs are one: a sportvereniging',
      example: { dutch: 'Onze vereniging zoekt vrijwilligers voor de kantine.', english: 'Our club is looking for volunteers for the canteen.' },
    }),
    verb('lid worden', 'to become a member', {
      example: { dutch: 'Ik wil lid worden van de hockeyclub.', english: 'I want to join the hockey club.' },
    }),
    noun('het lid', 'the member', {
      note: 'plural: de leden',
      example: { dutch: 'Mijn dochter is lid van een tennisclub.', english: 'My daughter is a member of a tennis club.' },
    }),
    noun('de club', 'the club', {
      example: { dutch: 'Bij welke club speel jij?', english: 'Which club do you play for?' },
    }),
    noun('de training', 'the training session', {
      example: { dutch: 'Na de training ben ik altijd moe.', english: "I'm always tired after training." },
    }),
    noun('de ploeg', 'the team, the squad', {
      note: 'also a shift at work: in ploegen werken',
      example: { dutch: 'De hele ploeg gaat na de wedstrijd uit eten.', english: 'The whole team is going out for dinner after the match.' },
    }),
    noun('de trainer', 'the coach', {
      example: { dutch: 'De trainer kiest wie er mag spelen.', english: 'The coach picks who gets to play.' },
    }),
    noun('de scheidsrechter', 'the referee', {
      example: { dutch: 'De scheidsrechter geeft hem een gele kaart.', english: 'The referee gives him a yellow card.' },
    }),
    verb('winnen', 'to win', {
      example: { dutch: 'Je kunt niet elke wedstrijd winnen.', english: "You can't win every match." },
    }),
    verb('verliezen', 'to lose', {
      example: { dutch: 'Als we zo slecht spelen, gaan we verliezen.', english: "If we play this badly, we're going to lose." },
    }),
    noun('het doelpunt', 'the goal (scored)', {
      example: { dutch: 'Hij maakte in de laatste minuut een doelpunt.', english: 'He scored a goal in the last minute.' },
    }),
    verb('scoren', 'to score', {
      example: { dutch: 'Wie gaat er vanavond voor Oranje scoren?', english: "Who's going to score for the Dutch team tonight?" },
    }),
    verb('schaatsen', 'to ice-skate', {
      example: { dutch: 'Als het hard vriest, gaan we schaatsen.', english: "When there's a hard frost, we go skating." },
    }),
    verb('voetballen', 'to play football', {
      example: { dutch: 'Neem je bal mee, dan kunnen we voetballen.', english: 'Bring your ball and we can play football.' },
    }),
    verb('tennissen', 'to play tennis', {
      example: { dutch: 'Ze wil tennissen, maar haar racket is kapot.', english: 'She wants to play tennis, but her racket is broken.' },
    }),
    noun('het hockey', 'the hockey', {
      note: 'field hockey; on ice it is ijshockey',
      example: { dutch: 'Voor hockey heb je een stick nodig.', english: 'You need a stick for hockey.' },
    }),
    noun('de contributie', 'the membership fee', {
      example: { dutch: 'Heb jij de contributie voor de voetbalclub al betaald?', english: 'Have you paid the membership fee for the football club yet?' },
    }),
    noun('het toernooi', 'the tournament', {
      example: { dutch: 'Het toernooi duurt het hele weekend.', english: 'The tournament lasts the whole weekend.' },
    }),
    noun('de supporter', 'the supporter', {
      example: { dutch: 'Mijn buurman is al veertig jaar supporter van Feyenoord.', english: 'My neighbour has been a Feyenoord supporter for forty years.' },
    }),
    noun('de blessure', 'the injury', {
      note: 'mostly from sport',
      example: { dutch: 'Hij heeft een blessure aan zijn knie.', english: 'He has a knee injury.' },
    }),
    adj('geblesseerd', 'injured', {
      note: 'mostly in sport; hurt in an accident: gewond',
      example: { dutch: 'Ze kan niet spelen, want ze is geblesseerd.', english: "She can't play because she's injured." },
    }),
    adj('fit', 'fit', {
      example: { dutch: 'Mijn opa is tachtig, maar nog heel fit.', english: 'My grandpa is eighty, but still very fit.' },
    }),
    noun('de conditie', 'the (physical) condition', {
      example: { dutch: 'Ik fiets elke dag, dus mijn conditie is goed.', english: "I cycle every day, so I'm in good shape." },
    }),
    verb('sporten', 'to do sport', {
      example: { dutch: 'Ik probeer drie keer per week te sporten.', english: 'I try to do sport three times a week.' },
    }),
    noun('de speler', 'the player', {
      example: { dutch: 'Hij is de beste speler van het team.', english: "He's the best player in the team." },
    }),
    noun('de tegenstander', 'the opponent', {
      example: { dutch: 'Geef je tegenstander na de wedstrijd een hand.', english: 'Shake hands with your opponent after the match.' },
    }),
    noun('het zwemdiploma', 'the swimming diploma', {
      note: 'most Dutch children get one: A first, then B and C',
      example: { dutch: 'Na een jaar zwemles heeft ze haar zwemdiploma gehaald.', english: 'After a year of swimming lessons, she got her swimming diploma.' },
    }),
  ],
};
