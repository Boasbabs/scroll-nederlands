import { adj, noun, verb } from '../build';
import type { WordTheme } from '../types';

export const sport: WordTheme = {
  id: 'sport',
  title: 'Sport and clubs',
  tier: 2,
  words: [
    verb('hardlopen', 'to go running', {
      accept: ['rennen', 'lopen'],
      note: 'separable: ik loop hard',
      example: { dutch: 'Ik wil in dertig minuten vijf kilometer hardlopen.', english: 'I want to run five kilometres in thirty minutes.' },
    }),
    noun('de sportschool', 'the gym', {
      example: { dutch: 'Ik ga naar de sportschool om sterker te worden.', english: 'I go to the gym to get stronger.' },
    }),
    verb('trainen', 'to train', {
      example: { dutch: 'Met gewichten kun je je armen trainen.', english: 'You can train your arms with weights.' },
    }),
    noun('de vereniging', 'the association', {
      accept: ['de club'],
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
      accept: ['de vereniging', 'de ploeg'],
      example: { dutch: 'Bij welke club speel jij?', english: 'Which club do you play for?' },
    }),
    noun('de training', 'the training session', {
      example: { dutch: 'Zaterdag hebben we geen wedstrijd, alleen training.', english: "On Saturday we don't have a match, only training." },
    }),
    noun('de ploeg', 'the team, the squad', {
      note: 'also a shift at work: in ploegen werken',
      example: { dutch: 'De Nederlandse ploeg staat in de finale.', english: 'The Dutch team is in the final.' },
    }),
    noun('de trainer', 'the coach', {
      accept: ['de coach'],
      example: { dutch: 'De trainer kiest wie er mag spelen.', english: 'The coach picks who gets to play.' },
    }),
    noun('de scheidsrechter', 'the referee', {
      example: { dutch: 'De scheidsrechter geeft hem een gele kaart.', english: 'The referee gives him a yellow card.' },
    }),
    verb('winnen', 'to win', {
      example: { dutch: 'Als we vandaag winnen, zijn we kampioen.', english: "If we win today, we're the champions." },
    }),
    verb('verliezen', 'to lose', {
      example: { dutch: 'Als we zo slecht spelen, gaan we verliezen.', english: "If we play this badly, we're going to lose." },
    }),
    noun('het doelpunt', 'the goal (scored)', {
      example: { dutch: 'Het enige doelpunt viel in de laatste minuut.', english: 'The only goal came in the last minute.' },
    }),
    verb('scoren', 'to score', {
      example: { dutch: 'Hij krijgt veel kansen, maar hij kan niet scoren.', english: "He gets lots of chances, but he can't score." },
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
      example: { dutch: 'Voor hockey heb je een stick en een bal nodig.', english: 'For hockey you need a stick and a ball.' },
    }),
    noun('de contributie', 'the membership fee', {
      example: { dutch: 'Heb jij de contributie voor de voetbalclub al betaald?', english: 'Have you paid the membership fee for the football club yet?' },
    }),
    noun('het toernooi', 'the tournament', {
      example: { dutch: 'Aan het toernooi doen zestien teams mee.', english: 'Sixteen teams are taking part in the tournament.' },
    }),
    noun('de supporter', 'the supporter', {
      accept: ['de fan'],
      example: { dutch: 'Mijn buurman is al veertig jaar supporter van Feyenoord.', english: 'My neighbour has been a Feyenoord supporter for forty years.' },
    }),
    noun('de blessure', 'the injury', {
      note: 'mostly from sport',
      example: { dutch: 'Hij heeft een blessure aan zijn knie.', english: 'He has a knee injury.' },
    }),
    adj('geblesseerd', 'injured', {
      note: 'mostly in sport; hurt in an accident: gewond',
      example: { dutch: 'Ze kan niet spelen: ze is geblesseerd aan haar knie.', english: "She can't play: she has a knee injury." },
    }),
    adj('fit', 'fit', {
      example: { dutch: 'Ik ben niet fit genoeg om tien kilometer te rennen.', english: "I'm not fit enough to run ten kilometres." },
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
      accept: ['het diploma'],
      note: 'most Dutch children get one: A first, then B and C',
      example: { dutch: 'Na een jaar zwemles heeft ze haar zwemdiploma gehaald.', english: 'After a year of swimming lessons, she got her swimming diploma.' },
    }),
  ],
};
