import { other } from '../build';
import type { WordTheme } from '../types';

export const linking: WordTheme = {
  id: 'linking',
  title: 'Linking words',
  tier: 2,
  words: [
    other('gewoon', 'just, simply', {
      note: 'also: normal, ordinary',
      example: { dutch: 'Het is niet moeilijk, doe het gewoon.', english: 'It’s not difficult, just do it.' },
    }),
    other('zelfs', 'even', {
      example: { dutch: 'Hij werkt altijd, zelfs op zondag.', english: 'He always works, even on Sundays.' },
    }),
    other('vooral', 'especially, mainly', {
      example: { dutch: 'Het is hier druk, vooral in de zomer.', english: 'It’s busy here, especially in summer.' },
    }),
    other('bijna', 'almost, nearly', {
      example: { dutch: 'Ik ben bijna klaar, nog vijf minuten.', english: 'I’m almost ready, five more minutes.' },
    }),
    other('juist', 'right, correct', {
      note: 'also: actually, on the contrary (ik vind het juist leuk)',
      example: { dutch: 'Heel goed, je antwoord is helemaal juist.', english: 'Very good, your answer is completely right.' },
    }),
    other('hoewel', 'although', {
      note: 'verb to the end: hoewel ik moe ben',
      example: { dutch: 'Hoewel het regent, gaan we toch fietsen.', english: 'Although it’s raining, we’re still going cycling.' },
    }),
    other('terwijl', 'while', {
      note: 'verb to the end: terwijl ik de krant lees',
      example: { dutch: 'Terwijl ik kook, luister ik naar de radio.', english: 'While I cook, I listen to the radio.' },
    }),
    other('zodat', 'so that', {
      note: 'so (therefore) is dus',
      example: { dutch: 'Kun je langzamer praten, zodat ik het begrijp?', english: 'Can you speak more slowly so that I understand?' },
    }),
    other('zodra', 'as soon as', {
      example: { dutch: 'Zodra ik thuis ben, bel ik je.', english: 'As soon as I’m home, I’ll call you.' },
    }),
    other('voordat', 'before', {
      note: 'voor works too (voor je eet); before a noun, only voor (voor het eten)',
      accept: ['voor'],
      example: { dutch: 'Was je handen voordat je eet.', english: 'Wash your hands before you eat.' },
    }),
    other('nadat', 'after', {
      note: 'before a noun: na (na het eten)',
      example: { dutch: 'Nadat ik heb gegeten, doe ik de afwas.', english: 'After I’ve eaten, I do the washing-up.' },
    }),
    other('sinds', 'since', {
      note: 'present tense: ik woon hier sinds mei = I’ve lived here since May',
      example: { dutch: 'Ik leer sinds januari Nederlands.', english: 'I’ve been learning Dutch since January.' },
    }),
    other('behalve', 'except', {
      example: { dutch: 'Ik eet alles, behalve vis.', english: 'I eat everything except fish.' },
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
      example: { dutch: 'Tijdens de les staat mijn telefoon uit.', english: 'During the lesson my phone is off.' },
    }),
    other('namelijk', 'you see (giving a reason)', {
      note: 'never first in the sentence',
      example: { dutch: 'Ik kom niet, ik ben namelijk ziek.', english: 'I’m not coming, I’m ill, you see.' },
    }),
    other('bovendien', 'what’s more, besides', {
      accept: ['daarnaast'],
      example: { dutch: 'Fietsen is goedkoop en bovendien is het gezond.', english: 'Cycling is cheap, and what’s more, it’s healthy.' },
    }),
    other('verder', 'further (on)', {
      note: 'also: apart from that (verder is alles goed)',
      example: { dutch: 'Het station is nog een stukje verder.', english: 'The station is a bit further on.' },
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
      example: { dutch: 'Op zondag gaat de winkel pas om twaalf uur open.', english: 'On Sundays the shop doesn’t open until twelve.' },
    }),
    other('slechts', 'only (formal)', {
      near: ['alleen', 'pas'],
      note: 'slecht, with no s, means bad',
      example: { dutch: 'De cursus kost slechts tien euro per maand.', english: 'The course costs only ten euros a month.' },
    }),
    other('waarschijnlijk', 'probably', {
      example: { dutch: 'Morgen gaat het waarschijnlijk regenen.', english: 'It’s probably going to rain tomorrow.' },
    }),
    other('zeker', 'sure; definitely', {
      note: 'also: I suppose (je bent zeker moe?)',
      example: { dutch: 'Ik weet zeker dat hij morgen komt.', english: 'I’m sure he’s coming tomorrow.' },
    }),
    other('inderdaad', 'indeed', {
      note: 'everyday Dutch, for agreeing: ja, inderdaad',
      example: { dutch: 'Je hebt gelijk, de winkel is inderdaad dicht.', english: 'You’re right, the shop is indeed closed.' },
    }),
    other('precies', 'exactly', {
      example: { dutch: 'Dit is precies wat ik zoek.', english: 'This is exactly what I’m looking for.' },
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
      example: { dutch: 'Na het werk ga ik meteen naar huis.', english: 'After work I go straight home.' },
    }),
    other('ondertussen', 'meanwhile, in the meantime', {
      example: { dutch: 'Het water kookt en ondertussen maak ik de saus.', english: 'The water is boiling, and meanwhile I’m making the sauce.' },
    }),
    other('vroeger', 'in the past', {
      note: 'also: earlier',
      example: { dutch: 'Vroeger woonde ik in Spanje, nu in Utrecht.', english: 'I used to live in Spain; now I live in Utrecht.' },
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
      example: { dutch: 'Je bent blijkbaar jarig, gefeliciteerd!', english: 'Apparently it’s your birthday, congratulations!' },
    }),
    other('sowieso', 'anyway', {
      note: 'also: definitely (ik kom sowieso)',
      accept: ['in ieder geval', 'in elk geval', 'toch', 'zeker'],
      example: { dutch: 'Ik ga sowieso, ook als het regent.', english: 'I’m going anyway, even if it rains.' },
    }),
    other('trouwens', 'by the way', {
      note: 'not trouwen (to marry)',
      example: { dutch: 'Hoe gaat het trouwens met je moeder?', english: 'How is your mother doing, by the way?' },
    }),
    other('daardoor', 'because of that, as a result', {
      note: 'gives a cause; for a choice, use daarom',
      example: { dutch: 'Er is een storing, daardoor rijden er geen treinen.', english: 'There’s a fault, and as a result no trains are running.' },
    }),
    other('opnieuw', 'again, once more', {
      note: 'opnieuw beginnen: to start over',
      example: { dutch: 'Het werkt niet, probeer het opnieuw.', english: 'It isn’t working, try again.' },
    }),
    other('apart', 'separately', {
      note: 'also: unusual, odd',
      example: { dutch: 'Mag ik de saus apart, alstublieft?', english: 'Can I have the sauce separately, please?' },
    }),
    other('elk', 'every, each', {
      note: 'before a de-word: elke (elke dag)',
      example: { dutch: 'We gaan elk jaar op vakantie naar Italië.', english: 'We go on holiday to Italy every year.' },
    }),
    other('iedereen', 'everyone', {
      note: 'with a singular verb: iedereen weet het',
      example: { dutch: 'Iedereen is welkom op mijn verjaardag.', english: 'Everyone is welcome at my birthday party.' },
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
      example: { dutch: 'Ik heb deze taart zelf gemaakt.', english: 'I made this cake myself.' },
    }),
    other('ergens', 'somewhere', {
      example: { dutch: 'Ik ken die man ergens van.', english: 'I know that man from somewhere.' },
    }),
    other('overal', 'everywhere', {
      example: { dutch: 'Ik heb overal gezocht, maar mijn bril is weg.', english: 'I’ve looked everywhere, but my glasses are gone.' },
    }),
    other('steeds', 'more and more; all the time', {
      note: 'nog steeds: still',
      example: { dutch: 'In de herfst wordt het steeds kouder.', english: 'In autumn it gets colder and colder.' },
    }),
    other('of', 'or; whether', {
      note: '"if" meaning whether: of, not als',
      example: { dutch: 'Ik weet niet of ik morgen kan komen.', english: 'I don’t know if I can come tomorrow.' },
    }),
    other('in ieder geval', 'in any case, at least', {
      accept: ['in elk geval', 'tenminste'],
      example: { dutch: 'Het is koud, maar in ieder geval droog.', english: 'It’s cold, but at least it’s dry.' },
    }),
  ],
};
