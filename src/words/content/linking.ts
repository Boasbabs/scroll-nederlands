import { other } from '../build';
import type { WordTheme } from '../types';

export const linking: WordTheme = {
  id: 'linking',
  title: 'Linking words',
  tier: 2,
  words: [
    other('gewoon', 'just, simply', {
      note: 'also: normal, ordinary',
      example: { dutch: 'Geen restaurant vandaag, we eten gewoon thuis.', english: "No restaurant today, we're just eating at home." },
    }),
    other('zelfs', 'even', {
      example: { dutch: 'Zelfs mijn oma van negentig heeft een smartphone.', english: 'Even my ninety-year-old grandma has a smartphone.' },
    }),
    other('vooral', 'especially, mainly', {
      accept: ['zeker'],
      example: { dutch: 'Het strand is druk, vooral in de zomer.', english: 'The beach is busy, especially in summer.' },
    }),
    other('bijna', 'almost, nearly', {
      example: { dutch: 'Ik ben bijna klaar, nog vijf minuten.', english: 'I’m almost ready, five more minutes.' },
    }),
    other('juist', 'right, correct', {
      accept: ['correct'],
      note: 'also: actually, on the contrary (ik vind het juist leuk)',
      example: { dutch: 'Heel goed, je antwoord is helemaal juist.', english: 'Very good, your answer is completely right.' },
    }),
    other('hoewel', 'although', {
      note: 'verb to the end: hoewel ik moe ben',
      example: { dutch: 'Hoewel het duur was, heb ik het toch gekocht.', english: 'Although it was expensive, I bought it anyway.' },
    }),
    other('terwijl', 'while', {
      note: 'verb to the end: terwijl ik de krant lees',
      example: { dutch: 'Terwijl ik kookte, ging mijn telefoon.', english: 'While I was cooking, my phone rang.' },
    }),
    other('zodat', 'so that', {
      note: 'so (therefore) is dus',
      example: { dutch: 'Kun je langzamer praten, zodat ik het begrijp?', english: 'Can you speak more slowly so that I understand?' },
    }),
    other('zodra', 'as soon as', {
      example: { dutch: 'Zodra ik iets weet, bel ik je.', english: "As soon as I know anything, I'll call you." },
    }),
    other('voordat', 'before', {
      note: 'voor works too (voor je eet); before a noun, only voor (voor het eten)',
      accept: ['voor'],
      example: { dutch: 'Was je handen voordat je eet.', english: 'Wash your hands before you eat.' },
    }),
    other('nadat', 'after', {
      note: 'before a noun: na (na het eten)',
      example: { dutch: 'Een uur nadat ik heb gegeten, ga ik sporten.', english: "An hour after I've eaten, I go and exercise." },
    }),
    other('sinds', 'since', {
      note: 'present tense: ik woon hier sinds mei = I’ve lived here since May',
      example: { dutch: 'Ik leer sinds vorig jaar Nederlands.', english: "I've been learning Dutch since last year." },
    }),
    other('behalve', 'except', {
      example: { dutch: 'Ik eet alles behalve vis: daar ben ik allergisch voor.', english: "I eat everything except fish: I'm allergic to it." },
    }),
    other('ondanks', 'despite', {
      note: 'ondanks de regen, but hoewel het regent',
      example: { dutch: 'Ondanks de file was ik op tijd.', english: 'Despite the traffic jam, I was on time.' },
    }),
    other('volgens', 'according to', {
      note: 'volgens mij: I think',
      example: { dutch: 'Volgens de app is de trein te laat.', english: 'According to the app, the train is late.' },
    }),
    other('tijdens', 'during', {
      note: 'tijdens het eten, but terwijl we eten',
      example: { dutch: 'Tijdens de film staat mijn telefoon uit.', english: 'During the film my phone is off.' },
    }),
    other('namelijk', 'you see (giving a reason)', {
      note: 'never first in the sentence',
      example: { dutch: 'Ik heb geen honger, ik heb namelijk al gegeten.', english: "I'm not hungry, I've already eaten, you see." },
    }),
    other('bovendien', 'what’s more, besides', {
      accept: ['daarnaast'],
      example: { dutch: 'Fietsen is goedkoop en bovendien is het gezond.', english: 'Cycling is cheap, and what’s more, it’s healthy.' },
    }),
    other('verder', 'further (on)', {
      note: 'also: apart from that (verder is alles goed)',
      example: { dutch: 'Het station is nog een stukje verder dan de kerk.', english: 'The station is a bit further than the church.' },
    }),
    other('daarnaast', 'in addition', {
      note: 'also: next to it',
      accept: ['bovendien'],
      example: { dutch: 'Ik studeer en daarnaast werk ik in een café.', english: 'I study, and on top of that I work in a café.' },
    }),
    other('alleen', 'only; alone', {
      example: { dutch: 'Ik drink alleen thee, geen koffie.', english: 'I only drink tea, not coffee.' },
    }),
    other('pas', 'not until; only', {
      near: ['alleen'],
      note: 'also: only (hij is pas twintig); de pas is a card, as in de pinpas',
      example: { dutch: 'Helaas, op zondag gaat de winkel pas om twaalf open.', english: "Unfortunately, on Sundays the shop doesn't open until twelve." },
    }),
    other('slechts', 'only (formal)', {
      accept: ['maar'],
      near: ['alleen', 'pas'],
      note: 'slecht, with no s, means bad',
      example: { dutch: 'Goedkoop! De cursus kost slechts tien euro per maand.', english: 'Cheap! The course costs only ten euros a month.' },
    }),
    other('waarschijnlijk', 'probably', {
      example: { dutch: 'Misschien regent het morgen, maar waarschijnlijk niet.', english: 'It might rain tomorrow, but probably not.' },
    }),
    other('zeker', 'sure; definitely', {
      note: 'also: I suppose (je bent zeker moe?)',
      example: { dutch: 'Ik weet het honderd procent zeker: hij komt morgen.', english: "I'm a hundred percent sure: he's coming tomorrow." },
    }),
    other('inderdaad', 'indeed', {
      note: 'everyday Dutch, for agreeing: ja, inderdaad',
      example: { dutch: 'Je hebt gelijk, de winkel is inderdaad dicht.', english: 'You’re right, the shop is indeed closed.' },
    }),
    other('precies', 'exactly', {
      example: { dutch: 'Perfect, dit is precies wat ik zoek!', english: "Perfect, this is exactly what I'm looking for!" },
    }),
    other('nogal', 'rather', {
      near: ['best'],
      note: 'often a bit critical: het is nogal duur',
      example: { dutch: 'De huur in Amsterdam is nogal hoog.', english: 'The rent in Amsterdam is rather high.' },
    }),
    other('best', 'quite, pretty', {
      note: 'also: best, as in goed, beter, best',
      example: { dutch: 'Nederlands is best moeilijk, maar ook leuk.', english: 'Dutch is pretty difficult, but fun too.' },
    }),
    other('zowel', 'both (… and)', {
      near: ['beide'],
      note: 'zowel … als: both … and',
      example: { dutch: 'Ik spreek zowel Engels als Nederlands.', english: 'I speak both English and Dutch.' },
    }),
    other('meteen', 'straight away, immediately', {
      accept: ['direct'],
      example: { dutch: 'Na het werk ga ik meteen naar huis.', english: 'After work I go straight home.' },
    }),
    other('ondertussen', 'meanwhile, in the meantime', {
      accept: ['intussen'],
      example: { dutch: 'Het water kookt en ondertussen maak ik de saus.', english: 'The water is boiling, and meanwhile I’m making the sauce.' },
    }),
    other('vroeger', 'in the past', {
      note: 'also: earlier',
      example: { dutch: 'Vroeger was alles beter, zegt mijn opa.', english: 'Everything was better in the old days, my grandad says.' },
    }),
    other('tegenwoordig', 'nowadays, these days', {
      example: { dutch: 'Tegenwoordig betaal ik alles met mijn telefoon.', english: 'These days I pay for everything with my phone.' },
    }),
    other('eindelijk', 'finally, at last', {
      note: 'in the end, eventually: uiteindelijk',
      example: { dutch: 'Na een uur wachten is de bus er eindelijk.', english: 'After an hour of waiting, the bus is finally here.' },
    }),
    other('opeens', 'all of a sudden', {
      accept: ['plotseling', 'ineens'],
      example: { dutch: 'Opeens gaat het licht uit.', english: 'All of a sudden the light goes out.' },
    }),
    other('plotseling', 'suddenly', {
      note: 'like opeens, a bit more formal',
      accept: ['opeens', 'ineens'],
      example: { dutch: 'Plotseling staat mijn buurman voor de deur.', english: 'Suddenly my neighbour is at the door.' },
    }),
    other('toevallig', 'by chance', {
      note: 'Wat toevallig! = What a coincidence!',
      example: { dutch: 'Heb je toevallig een pen voor me?', english: 'Do you have a pen for me, by any chance?' },
    }),
    other('expres', 'on purpose', {
      note: 'not "express"',
      example: { dutch: 'Sorry, dat was niet expres!', english: 'Sorry, that wasn’t on purpose!' },
    }),
    other('blijkbaar', 'apparently', {
      example: { dutch: 'Je bent blijkbaar vandaag jarig, gefeliciteerd!', english: "Apparently it's your birthday today, congratulations!" },
    }),
    other('sowieso', 'anyway', {
      note: 'also: definitely (ik kom sowieso)',
      accept: ['in ieder geval', 'in elk geval', 'toch', 'zeker'],
      example: { dutch: 'Ik ga sowieso, ook als het regent.', english: 'I’m going anyway, even if it rains.' },
    }),
    other('trouwens', 'by the way', {
      note: 'not trouwen (to marry)',
      example: { dutch: 'O, en trouwens: ik heb een nieuwe baan!', english: "Oh, and by the way: I've got a new job!" },
    }),
    other('daardoor', 'because of that, as a result', {
      note: 'gives a cause; for a choice, use daarom',
      example: { dutch: 'Er is een storing, daardoor rijden er geen treinen.', english: 'There’s a fault, and as a result no trains are running.' },
    }),
    other('opnieuw', 'again, once more', {
      accept: ['nog een keer', 'nog eens'],
      note: 'opnieuw beginnen: to start over',
      example: { dutch: 'Het werkt nu niet, probeer het later opnieuw.', english: "It isn't working right now, try again later." },
    }),
    other('apart', 'separately', {
      note: 'also: unusual, odd',
      example: { dutch: 'Ik wil graag de saus apart, niet op de friet.', english: "I'd like the sauce separately, not on the chips." },
    }),
    other('elk', 'every, each', {
      accept: ['ieder'],
      note: 'before a de-word: elke (elke dag)',
      example: { dutch: 'Als kind ging ik elk jaar naar Italië.', english: 'As a child I went to Italy every year.' },
    }),
    other('iedereen', 'everyone', {
      note: 'with a singular verb: iedereen weet het',
      example: { dutch: 'Iedereen is welkom, ook je kinderen!', english: 'Everyone is welcome, your children too!' },
    }),
    other('niemand', 'nobody, no one', {
      example: { dutch: 'Ik bel aan, maar er is niemand thuis.', english: 'I ring the bell, but nobody’s home.' },
    }),
    other('beide', 'both', {
      note: 'spoken Dutch: allebei',
      example: { dutch: 'Je kunt op beide dagen komen: zaterdag en zondag.', english: 'You can come on both days: Saturday and Sunday.' },
    }),
    other('zelf', 'myself, yourself …', {
      note: 'zelfs, with an s, means even',
      example: { dutch: 'Deze taart is niet gekocht, ik heb hem zelf gemaakt.', english: "This cake isn't shop-bought, I made it myself." },
    }),
    other('ergens', 'somewhere', {
      example: { dutch: 'Ik ken die man ergens van.', english: 'I know that man from somewhere.' },
    }),
    other('overal', 'everywhere', {
      example: { dutch: 'Ik heb overal gezocht, ook onder het bed.', english: "I've looked everywhere, under the bed too." },
    }),
    other('steeds', 'more and more; all the time', {
      note: 'nog steeds: still',
      example: { dutch: 'In de herfst wordt het steeds kouder.', english: 'In autumn it gets colder and colder.' },
    }),
    other('of', 'or; whether', {
      note: '"if" meaning whether: of, not als',
      example: { dutch: 'Kom je morgen? Ik weet nog niet of ik kan.', english: "Are you coming tomorrow? I don't know yet if I can." },
    }),
    other('in ieder geval', 'in any case, at least', {
      accept: ['in elk geval', 'tenminste'],
      example: { dutch: 'Het is koud, maar in ieder geval droog.', english: 'It’s cold, but at least it’s dry.' },
    }),
  ],
};
