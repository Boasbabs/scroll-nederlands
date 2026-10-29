import { adj } from '../build';
import type { WordTheme } from '../types';

export const qualities: WordTheme = {
  id: 'qualities',
  title: 'More describing words',
  tier: 2,
  words: [
    adj('mogelijk', 'possible', {
      example: { dutch: 'Pinnen is hier niet mogelijk, alleen contant.', english: 'Paying by card isn’t possible here, only cash.' },
    }),
    adj('onmogelijk', 'impossible', {
      example: { dutch: 'Een huis vinden in Amsterdam is bijna onmogelijk.', english: 'Finding a house in Amsterdam is almost impossible.' },
    }),
    adj('nodig', 'needed, necessary', {
      note: 'nodig hebben: to need',
      example: { dutch: 'Ik heb een nieuwe fiets nodig, de oude is kapot.', english: 'I need a new bike, the old one is broken.' },
    }),
    adj('eenvoudig', 'simple', {
      example: { dutch: 'Het eten bij oma is eenvoudig: aardappelen, groente en vlees.', english: 'The food at Grandma’s is simple: potatoes, vegetables and meat.' },
    }),
    adj('ingewikkeld', 'complicated', {
      example: { dutch: 'Dit formulier is te ingewikkeld voor mij.', english: 'This form is too complicated for me.' },
    }),
    adj('normaal', 'normal', {
      example: { dutch: 'Fietsen in de regen is hier heel normaal.', english: 'Cycling in the rain is perfectly normal here.' },
    }),
    adj('bijzonder', 'remarkable, special', {
      accept: ['speciaal'],
      example: { dutch: 'Een witte Kerst is in Nederland heel bijzonder.', english: 'A white Christmas is something special in the Netherlands.' },
    }),
    adj('speciaal', 'special', {
      note: 'speciaal voor: specially for',
      example: { dutch: 'Deze taart is speciaal voor jouw verjaardag.', english: 'This cake is specially for your birthday.' },
    }),
    adj('echt', 'real, really', {
      example: { dutch: 'Deze bloemen zijn niet echt, ze zijn van plastic.', english: 'These flowers aren’t real, they’re plastic.' },
    }),
    adj('bezet', 'occupied, taken', {
      note: 'also: engaged (a phone line)',
      example: { dutch: 'Sorry, deze stoel is bezet. Mijn vriend komt zo.', english: 'Sorry, this seat is taken. My friend is coming in a minute.' },
    }),
    adj('beschikbaar', 'available', {
      example: { dutch: 'Deze schoenen zijn niet meer beschikbaar in maat 40.', english: 'These shoes are no longer available in size 40.' },
    }),
    adj('gratis', 'free (of charge)', {
      note: 'vrij is free as in not busy or not taken',
      example: { dutch: 'Voor kinderen tot vier jaar is de trein gratis.', english: 'The train is free for children under four.' },
    }),
    adj('zwak', 'weak', {
      example: { dutch: 'Na de griep ben ik nog erg zwak.', english: 'After the flu I’m still very weak.' },
    }),
    adj('gezond', 'healthy', {
      example: { dutch: 'Fruit is gezond, snoep niet.', english: 'Fruit is healthy, sweets aren’t.' },
    }),
    adj('veilig', 'safe', {
      example: { dutch: "Deze straat is veilig, er rijden geen auto's.", english: 'This street is safe, no cars drive here.' },
    }),
    adj('gevaarlijk', 'dangerous', {
      example: { dutch: 'Bellen op de fiets is gevaarlijk.', english: 'Phoning while you cycle is dangerous.' },
    }),
    adj('rond', 'round', {
      note: 'also: around (rond acht uur)',
      example: { dutch: 'Een pizza is meestal rond.', english: 'A pizza is usually round.' },
    }),
    adj('breed', 'wide, broad', {
      example: { dutch: 'De kast is te breed voor de deur.', english: 'The cupboard is too wide for the door.' },
    }),
    adj('smal', 'narrow', {
      example: { dutch: 'De trap in ons huis is erg smal.', english: 'The stairs in our house are very narrow.' },
    }),
    adj('diep', 'deep', {
      example: { dutch: 'Het water is hier twee meter diep.', english: 'The water is two metres deep here.' },
    }),
    adj('fris', 'fresh, chilly', {
      note: 'for food, fresh is vers',
      example: { dutch: 'Neem een jas mee, het is fris buiten.', english: 'Take a coat, it’s chilly outside.' },
    }),
    adj('recht', 'straight', {
      note: 'also: het recht, the right (to something)',
      example: { dutch: 'Hangt de foto nu recht?', english: 'Is the photo straight now?' },
    }),
    adj('los', 'loose', {
      note: 'also: separately (los kopen)',
      example: { dutch: 'De knoop van mijn jas zit los.', english: 'The button on my coat is loose.' },
    }),
    adj('modern', 'modern', {
      example: { dutch: 'Rotterdam is heel modern, met veel hoge gebouwen.', english: 'Rotterdam is very modern, with lots of tall buildings.' },
    }),
    adj('ouderwets', 'old-fashioned', {
      example: { dutch: 'Een fax? Dat is zo ouderwets!', english: 'A fax? That’s so old-fashioned!' },
    }),
    adj('bekend', 'known, familiar', {
      example: { dutch: 'Ken ik jou ergens van? Je komt me bekend voor.', english: 'Do I know you from somewhere? You look familiar.' },
    }),
    adj('onbekend', 'unknown', {
      example: { dutch: 'Wie belt er? Het nummer is onbekend.', english: 'Who’s calling? The number is unknown.' },
    }),
    adj('beroemd', 'famous', {
      near: ['bekend'],
      example: { dutch: 'Van Gogh is over de hele wereld beroemd.', english: 'Van Gogh is famous all over the world.' },
    }),
    adj('populair', 'popular', {
      example: { dutch: 'Die bakker is populair, het is daar altijd druk.', english: 'That bakery is popular, it’s always busy there.' },
    }),
    adj('eigen', 'own', {
      note: 'never takes -e: mijn eigen fiets',
      example: { dutch: 'Mijn dochter wil een eigen kamer.', english: 'My daughter wants her own room.' },
    }),
    adj('verschillend', 'different', {
      near: ['ander'],
      note: 'verschillende (before a noun): several, various',
      example: { dutch: 'Mijn zus en ik zijn heel verschillend.', english: 'My sister and I are very different.' },
    }),
    adj('gelijk', 'equal', {
      note: 'also: gelijk hebben, to be right',
      example: { dutch: 'Mannen en vrouwen zijn gelijk.', english: 'Men and women are equal.' },
    }),
    adj('ander', 'other, another', {
      note: 'often with -e: een andere keer',
      example: { dutch: 'Dit huis is te klein, we zoeken een ander huis.', english: 'This house is too small, we’re looking for another house.' },
    }),
    adj('persoonlijk', 'personal', {
      example: { dutch: 'Die vraag is te persoonlijk.', english: 'That question is too personal.' },
    }),
    adj('algemeen', 'general', {
      note: 'in het algemeen: in general',
      example: { dutch: 'Nederlanders zijn in het algemeen erg direct.', english: 'In general, Dutch people are very direct.' },
    }),
    adj('openbaar', 'public', {
      note: 'het ov (often OV) is short for het openbaar vervoer',
      example: { dutch: 'Ik reis altijd met het openbaar vervoer.', english: 'I always travel by public transport.' },
    }),
    adj('volgend', 'next', {
      note: 'volgend jaar, but volgende week',
      example: { dutch: 'Volgend weekend ga ik naar mijn ouders.', english: 'Next weekend I’m going to my parents’.' },
    }),
    adj('vorig', 'last, previous', {
      near: ['laatst'],
      note: 'vorig jaar, but vorige week',
      example: { dutch: 'Vorig weekend waren we in Parijs.', english: 'Last weekend we were in Paris.' },
    }),
    adj('laatst', 'last, final', {
      note: 'also: recently, the other day',
      example: { dutch: 'Wanneer heb je haar voor het laatst gezien?', english: 'When did you last see her?' },
    }),
    adj('vroeg', 'early', {
      note: 'also: asked (from vragen)',
      example: { dutch: 'Het is nog vroeg, de winkels zijn dicht.', english: 'It’s still early, the shops are closed.' },
    }),
    adj('lelijk', 'ugly', {
      example: { dutch: 'Mijn tante vindt het mooi, maar ik vind het lelijk.', english: 'My aunt thinks it’s beautiful, but I think it’s ugly.' },
    }),
    adj('dom', 'stupid', {
      example: { dutch: 'Sorry, dat was dom van mij.', english: 'Sorry, that was stupid of me.' },
    }),
    adj('oneerlijk', 'unfair', {
      note: 'also: dishonest',
      example: { dutch: 'Mijn broer krijgt meer snoep, dat is oneerlijk!', english: 'My brother gets more sweets, that’s unfair!' },
    }),
    adj('beleefd', 'polite', {
      example: { dutch: 'Hij houdt de deur voor me open, dat is beleefd.', english: 'He holds the door open for me, that’s polite.' },
    }),
    adj('onbeleefd', 'impolite, rude', {
      example: { dutch: 'Met je mond vol praten is onbeleefd.', english: 'Talking with your mouth full is rude.' },
    }),
    adj('vriendelijk', 'friendly', {
      note: 'met vriendelijke groet: kind regards (in an email)',
      example: { dutch: 'De buurvrouw is vriendelijk, ze zegt altijd hallo.', english: 'The neighbour is friendly, she always says hello.' },
    }),
    adj('streng', 'strict', {
      example: { dutch: 'De juf is streng: niet praten in de klas!', english: 'The teacher is strict: no talking in class!' },
    }),
    adj('gemeen', 'mean, nasty', {
      note: 'also: iets gemeen hebben, to have something in common',
      example: { dutch: 'Doe niet zo gemeen tegen je zus!', english: 'Don’t be so mean to your sister!' },
    }),
    adj('lui', 'lazy', {
      example: { dutch: 'Op zondag ben ik lekker lui.', english: 'On Sundays I’m nice and lazy.' },
    }),
    adj('handig', 'handy, useful', {
      near: ['praktisch'],
      note: 'also: good with your hands',
      example: { dutch: 'Het is handig om een paraplu mee te nemen.', english: 'It’s handy to take an umbrella with you.' },
    }),
    adj('onhandig', 'clumsy, awkward', {
      example: { dutch: 'Ik ben zo onhandig, ik laat alles vallen.', english: 'I’m so clumsy, I drop everything.' },
    }),
    adj('praktisch', 'practical', {
      example: { dutch: 'Een bakfiets is niet mooi, maar wel praktisch.', english: 'A cargo bike isn’t pretty, but it is practical.' },
    }),
    adj('logisch', 'logical', {
      note: 'dat is logisch: that makes sense',
      example: { dutch: 'Je bent moe? Dat is logisch, je hebt weinig geslapen.', english: 'You’re tired? That makes sense, you’ve hardly slept.' },
    }),
    adj('serieus', 'serious', {
      example: { dutch: 'Ik maak geen grapje, ik ben serieus.', english: 'I’m not joking, I’m serious.' },
    }),
    adj('vreemd', 'strange', {
      note: 'also: foreign (een vreemde taal)',
      example: { dutch: 'Dat is vreemd, mijn fiets staat er niet meer.', english: 'That’s strange, my bike isn’t there any more.' },
    }),
    adj('perfect', 'perfect', {
      example: { dutch: 'Het weer is perfect voor een dagje strand.', english: 'The weather is perfect for a day at the beach.' },
    }),
    adj('bezig', 'busy (doing something)', {
      example: { dutch: 'Ik ben nog bezig met mijn huiswerk.', english: 'I’m still busy with my homework.' },
    }),
    adj('wakker', 'awake', {
      note: 'wakker worden: to wake up',
      example: { dutch: 'De baby is om vijf uur al wakker.', english: 'The baby is already awake at five o’clock.' },
    }),
    adj('zwanger', 'pregnant', {
      example: { dutch: 'Mijn zus is zwanger, de baby komt in mei.', english: 'My sister is pregnant, the baby is due in May.' },
    }),
    adj('getrouwd', 'married', {
      example: { dutch: 'Mijn ouders zijn al dertig jaar getrouwd.', english: 'My parents have been married for thirty years.' },
    }),
  ],
};
