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
      accept: ['simpel'],
      example: { dutch: 'Het eten bij oma is eenvoudig: aardappelen, groente en vlees.', english: 'The food at Grandma’s is simple: potatoes, vegetables and meat.' },
    }),
    adj('ingewikkeld', 'complicated', {
      accept: ['moeilijk'],
      example: { dutch: 'Dit formulier is te ingewikkeld voor mij.', english: 'This form is too complicated for me.' },
    }),
    adj('normaal', 'normal', {
      accept: ['gewoon'],
      example: { dutch: 'Fietsen in de regen is hier heel normaal.', english: 'Cycling in the rain is perfectly normal here.' },
    }),
    adj('bijzonder', 'remarkable, special', {
      accept: ['speciaal'],
      example: { dutch: 'Een witte Kerst is in Nederland heel bijzonder.', english: 'A white Christmas is something special in the Netherlands.' },
    }),
    adj('speciaal', 'special', {
      note: 'speciaal voor: specially for',
      example: { dutch: 'Deze taart is speciaal voor jouw verjaardag gemaakt.', english: 'This cake was made specially for your birthday.' },
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
      example: { dutch: 'Na de griep zijn mijn benen nog erg zwak.', english: 'After the flu my legs are still very weak.' },
    }),
    adj('gezond', 'healthy', {
      example: { dutch: 'Fruit is gezond, snoep niet.', english: 'Fruit is healthy, sweets aren’t.' },
    }),
    adj('veilig', 'safe', {
      example: { dutch: 'Het ijs is nog niet veilig, het is te dun.', english: "The ice isn't safe yet, it's too thin." },
    }),
    adj('gevaarlijk', 'dangerous', {
      example: { dutch: "Spelen op straat is gevaarlijk, er rijden veel auto's.", english: 'Playing in the street is dangerous, there are lots of cars.' },
    }),
    adj('rond', 'round', {
      note: 'also: around (rond acht uur)',
      example: { dutch: 'De aarde is rond, niet plat.', english: 'The earth is round, not flat.' },
    }),
    adj('breed', 'wide, broad', {
      example: { dutch: 'De rivier is hier honderd meter breed.', english: 'The river is a hundred metres wide here.' },
    }),
    adj('smal', 'narrow', {
      example: { dutch: "Deze straat is te smal voor auto's.", english: 'This street is too narrow for cars.' },
    }),
    adj('diep', 'deep', {
      example: { dutch: 'Het water is hier twee meter diep.', english: 'The water is two metres deep here.' },
    }),
    adj('fris', 'fresh, chilly', {
      note: 'for food, fresh is vers',
      example: { dutch: 'Doe het raam open, dan wordt het lekker fris.', english: "Open the window and it'll be nice and fresh." },
    }),
    adj('recht', 'straight', {
      note: 'also: het recht, the right (to something)',
      example: { dutch: 'De weg is hier helemaal recht, zonder bochten.', english: 'The road here is completely straight, with no bends.' },
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
      accept: ['bekend'],
      example: { dutch: 'Van Gogh is over de hele wereld beroemd.', english: 'Van Gogh is famous all over the world.' },
    }),
    adj('populair', 'popular', {
      example: { dutch: 'Die bakker is populair, het is daar altijd druk.', english: 'That bakery is popular, it’s always busy there.' },
    }),
    adj('eigen', 'own', {
      note: 'never takes -e: mijn eigen fiets',
      example: { dutch: 'Ik ben te laat. Het is mijn eigen schuld.', english: "I'm late. It's my own fault." },
    }),
    adj('verschillend', 'different', {
      near: ['ander'],
      note: 'verschillende (before a noun): several, various',
      example: { dutch: 'Mijn zus en ik zijn heel verschillend.', english: 'My sister and I are very different.' },
    }),
    adj('gelijk', 'equal', {
      note: 'also: gelijk hebben, to be right',
      example: { dutch: 'In Nederland is iedereen gelijk voor de wet.', english: 'In the Netherlands everyone is equal before the law.' },
    }),
    adj('ander', 'other, another', {
      note: 'often with -e: een andere keer',
      example: { dutch: 'Het is hier vol, we gaan naar een ander restaurant.', english: "It's full here, we're going to another restaurant." },
    }),
    adj('persoonlijk', 'personal', {
      example: { dutch: 'Wat ik verdien? Die vraag is te persoonlijk.', english: 'How much I earn? That question is too personal.' },
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
      example: { dutch: 'Dit weekend kan ik niet, volgend weekend wel.', english: "I can't this weekend, but next weekend I can." },
    }),
    adj('vorig', 'last, previous', {
      accept: ['afgelopen'],
      near: ['laatst'],
      note: 'vorig jaar, but vorige week',
      example: { dutch: 'Vorig jaar woonde ik nog in Spanje.', english: 'Last year I was still living in Spain.' },
    }),
    adj('laatst', 'last, final', {
      note: 'also: recently, the other day',
      example: { dutch: 'Ik zeg het voor het laatst: ruim je kamer op!', english: "I'm telling you for the last time: tidy your room!" },
    }),
    adj('vroeg', 'early', {
      note: 'also: asked (from vragen)',
      example: { dutch: 'Het is nog vroeg, de winkels zijn dicht.', english: 'It’s still early, the shops are closed.' },
    }),
    adj('lelijk', 'ugly', {
      example: { dutch: 'Mijn tante vindt het mooi, maar ik vind het lelijk.', english: 'My aunt thinks it’s beautiful, but I think it’s ugly.' },
    }),
    adj('dom', 'stupid', {
      accept: ['stom'],
      example: { dutch: 'Mijn hond is niet dom, hij snapt alles.', english: "My dog isn't stupid, he understands everything." },
    }),
    adj('oneerlijk', 'unfair', {
      accept: ['niet eerlijk'],
      note: 'also: dishonest',
      example: { dutch: 'De scheidsrechter is oneerlijk, hij helpt alleen Ajax.', english: 'The referee is unfair, he only helps Ajax.' },
    }),
    adj('beleefd', 'polite', {
      example: { dutch: 'Hij zegt altijd ‘u’ tegen oudere mensen. Heel beleefd!', english: 'He always says ‘u’ to older people. Very polite!' },
    }),
    adj('onbeleefd', 'impolite, rude', {
      example: { dutch: 'Met je mond vol praten is onbeleefd.', english: 'Talking with your mouth full is rude.' },
    }),
    adj('vriendelijk', 'friendly', {
      accept: ['aardig'],
      note: 'met vriendelijke groet: kind regards (in an email)',
      example: { dutch: 'De buurvrouw is vriendelijk, ze zegt altijd hallo.', english: 'The neighbour is friendly, she always says hello.' },
    }),
    adj('streng', 'strict', {
      example: { dutch: 'De juf is streng: niet praten in de klas!', english: 'The teacher is strict: no talking in class!' },
    }),
    adj('gemeen', 'mean, nasty', {
      note: 'also: iets gemeen hebben, to have something in common',
      example: { dutch: 'Ze pest haar zusje, dat is gemeen.', english: "She bullies her little sister, that's mean." },
    }),
    adj('lui', 'lazy', {
      example: { dutch: 'Hij is lui: hij doet nooit zijn huiswerk.', english: "He's lazy: he never does his homework." },
    }),
    adj('handig', 'handy, useful', {
      near: ['praktisch'],
      note: 'also: good with your hands',
      example: { dutch: 'Mijn vader is handig: hij maakt alles zelf.', english: 'My dad is handy: he fixes everything himself.' },
    }),
    adj('onhandig', 'clumsy, awkward', {
      example: { dutch: 'Ik ben zo onhandig, ik laat alles vallen.', english: 'I’m so clumsy, I drop everything.' },
    }),
    adj('praktisch', 'practical', {
      example: { dutch: 'De cursus is praktisch, niet theoretisch.', english: 'The course is practical, not theoretical.' },
    }),
    adj('logisch', 'logical', {
      note: 'dat is logisch: that makes sense',
      example: { dutch: 'Logisch dat je moe bent, je hebt weinig geslapen.', english: "No wonder you're tired, you've hardly slept." },
    }),
    adj('serieus', 'serious', {
      example: { dutch: 'Ik maak geen grapje, ik ben serieus.', english: 'I’m not joking, I’m serious.' },
    }),
    adj('vreemd', 'strange', {
      accept: ['raar', 'gek'],
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
      example: { dutch: 'Ik ben getrouwd, dit is mijn man.', english: "I'm married, this is my husband." },
    }),
  ],
};
