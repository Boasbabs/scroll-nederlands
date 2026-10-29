import { other, verb } from '../build';
import type { WordTheme } from '../types';

export const actions: WordTheme = {
  id: 'actions',
  title: 'More doing words',
  tier: 2,
  words: [
    verb('gebeuren', 'to happen', {
      example: { dutch: 'Geen probleem, dat kan iedereen gebeuren.', english: 'No problem, that can happen to anyone.' },
    }),
    verb('lijken', 'to seem; to look like', {
      note: 'lijken op: to look like',
      example: { dutch: 'Je zoon begint steeds meer op jou te lijken.', english: 'Your son is starting to look more and more like you.' },
    }),
    verb('veranderen', 'to change', {
      example: { dutch: 'Het weer kan in Nederland snel veranderen.', english: 'The weather in the Netherlands can change quickly.' },
    }),
    verb('ontmoeten', 'to meet', {
      note: 'meeting up with a friend: afspreken',
      example: { dutch: 'Ik wil graag nieuwe mensen ontmoeten.', english: "I'd like to meet new people." },
    }),
    verb('onthouden', 'to remember (keep in mind)', {
      example: { dutch: 'Kun je dit nummer onthouden? Ik heb geen pen.', english: "Can you remember this number? I don't have a pen." },
    }),
    verb('herinneren', 'to remind', {
      note: 'zich herinneren: to remember (recall)',
      example: { dutch: 'Wil je me morgen aan de afspraak herinneren?', english: 'Will you remind me about the appointment tomorrow?' },
    }),
    verb('beslissen', 'to decide', {
      accept: ['besluiten'],
      example: { dutch: 'Je mag zelf over je eigen leven beslissen.', english: 'You get to decide about your own life.' },
    }),
    verb('kiezen', 'to choose', {
      example: { dutch: 'Ik kan niet kiezen tussen pizza en pasta.', english: "I can't choose between pizza and pasta." },
    }),
    verb('besluiten', 'to make up your mind', {
      accept: ['beslissen'],
      note: 'close to beslissen; ik heb besloten: I have decided',
      example: { dutch: 'Ik moet vandaag besluiten of ik die baan aanneem.', english: 'I have to make up my mind today whether to take that job.' },
    }),
    verb('regelen', 'to sort out, to take care of', {
      example: { dutch: 'Geen zorgen, ik ga het met de gemeente regelen.', english: "Don't worry, I'll sort it out with the council." },
    }),
    verb('organiseren', 'to organise', {
      accept: ['plannen'],
      example: { dutch: 'Het is veel werk om een bruiloft te organiseren.', english: "It's a lot of work to organise a wedding." },
    }),
    verb('plannen', 'to plan', {
      example: { dutch: 'Ik wil mijn week beter plannen.', english: 'I want to plan my week better.' },
    }),
    verb('verdienen', 'to earn; to deserve', {
      example: { dutch: 'Ik werk in een café om geld te verdienen.', english: 'I work in a café to earn money.' },
    }),
    verb('uitgeven', 'to spend (money)', {
      note: 'ik geef uit, ik heb uitgegeven',
      example: { dutch: 'Hoeveel wil je aan een nieuwe telefoon uitgeven?', english: 'How much do you want to spend on a new phone?' },
    }),
    verb('sparen', 'to save (money)', {
      note: 'also: to collect (stamps, points)',
      example: { dutch: 'We sparen al twee jaar voor een huis.', english: "We've been saving for a house for two years." },
    }),
    verb('lenen', 'to borrow; to lend', {
      example: { dutch: 'Kun je me tot morgen tien euro lenen?', english: 'Can you lend me ten euros until tomorrow?' },
    }),
    verb('delen', 'to share', {
      example: { dutch: 'Je moet je speelgoed met je zusje delen.', english: 'You have to share your toys with your little sister.' },
    }),
    verb('ontvangen', 'to receive', {
      note: 'more formal than krijgen',
      example: { dutch: 'Wij hebben uw betaling ontvangen.', english: 'We have received your payment.' },
    }),
    verb('verwachten', 'to expect', {
      example: { dutch: 'Voor morgen verwachten ze veel regen en wind.', english: "They're expecting a lot of rain and wind tomorrow." },
    }),
    verb('hopen', 'to hope', {
      example: { dutch: 'We kunnen alleen maar hopen dat het goed gaat.', english: 'We can only hope that it goes well.' },
    }),
    verb('geloven', 'to believe', {
      example: { dutch: 'Je moet me geloven, het is echt waar!', english: "You have to believe me, it's really true!" },
    }),
    verb('uitleggen', 'to explain', {
      note: 'ik leg uit, ik heb uitgelegd',
      example: { dutch: 'Ik begrijp deze regel niet. Kun je hem uitleggen?', english: "I don't understand this rule. Can you explain it?" },
    }),
    verb('beschrijven', 'to describe', {
      example: { dutch: 'Hoe ziet hij eruit? Kun je hem beschrijven?', english: 'What does he look like? Can you describe him?' },
    }),
    verb('vergelijken', 'to compare', {
      example: { dutch: 'Het is slim om eerst de prijzen te vergelijken.', english: "It's smart to compare the prices first." },
    }),
    verb('aanbieden', 'to offer', {
      note: 'ik bied aan, ik heb aangeboden',
      example: { dutch: 'Mag ik je iets te drinken aanbieden?', english: 'Can I offer you something to drink?' },
    }),
    verb('accepteren', 'to accept', {
      accept: ['aannemen'],
      example: { dutch: 'Ik kan zijn excuses niet accepteren.', english: "I can't accept his apology." },
    }),
    verb('weigeren', 'to refuse', {
      example: { dutch: 'Mijn kinderen weigeren hun groente te eten.', english: 'My children refuse to eat their vegetables.' },
    }),
    verb('verbieden', 'to forbid, to ban', {
      example: { dutch: 'De gemeente wil vuurwerk verbieden.', english: 'The council wants to ban fireworks.' },
    }),
    verb('beloven', 'to promise', {
      example: { dutch: 'Ik kan niets beloven, maar ik doe mijn best.', english: "I can't promise anything, but I'll do my best." },
    }),
    verb('waarschuwen', 'to warn', {
      example: { dutch: 'Ik wil je waarschuwen: die hond bijt.', english: 'I want to warn you: that dog bites.' },
    }),
    verb('bedanken', 'to thank', {
      example: { dutch: 'Ik wil je bedanken voor je hulp.', english: 'I want to thank you for your help.' },
    }),
    verb('feliciteren', 'to congratulate', {
      note: 'feliciteren met: to congratulate on',
      example: { dutch: 'We gaan de buurman feliciteren met zijn verjaardag.', english: "We're going to congratulate the neighbour on his birthday." },
    }),
    verb('klagen', 'to complain', {
      example: { dutch: 'Ik ga bij de huisbaas klagen over de verwarming.', english: "I'm going to complain to the landlord about the heating." },
    }),
    verb('schreeuwen', 'to yell, to scream', {
      near: ['roepen'],
      example: { dutch: 'Je hoeft niet zo te schreeuwen, ik hoor je wel.', english: "You don't have to yell like that, I can hear you." },
    }),
    verb('roepen', 'to call (out)', {
      example: { dutch: 'Ik hoorde iemand in de verte mijn naam roepen.', english: 'I heard someone calling my name in the distance.' },
    }),
    verb('reageren', 'to react, to respond', {
      note: 'reageren op: to respond to',
      example: { dutch: 'Hoe gaat je baas op het nieuws reageren?', english: 'How is your boss going to react to the news?' },
    }),
    verb('ruiken', 'to smell', {
      example: { dutch: 'Ik kan niets ruiken; mijn neus zit dicht.', english: "I can't smell anything; my nose is blocked." },
    }),
    verb('proeven', 'to taste', {
      example: { dutch: 'Kun je proeven of er genoeg zout in zit?', english: "Can you taste whether there's enough salt in it?" },
    }),
    verb('pakken', 'to grab, to take', {
      accept: ['halen'],
      note: 'also: to pack (een koffer pakken)',
      example: { dutch: 'Kun je de melk uit de koelkast pakken?', english: 'Can you grab the milk from the fridge?' },
    }),
    verb('gooien', 'to throw', {
      example: { dutch: 'Je mag geen afval op straat gooien.', english: "You're not allowed to throw litter in the street." },
    }),
    verb('bouwen', 'to build', {
      example: { dutch: 'Ze gaan hier honderd nieuwe huizen bouwen.', english: "They're going to build a hundred new houses here." },
    }),
    verb('vullen', 'to fill', {
      example: { dutch: 'Kun je de fles met water vullen?', english: 'Can you fill the bottle with water?' },
    }),
    verb('openen', 'to open', {
      note: 'a door or window: usually opendoen',
      example: { dutch: 'Ik wil graag een bankrekening openen.', english: "I'd like to open a bank account." },
    }),
    verb('springen', 'to jump', {
      example: { dutch: 'De kinderen willen op de trampoline springen.', english: 'The children want to jump on the trampoline.' },
    }),
    verb('groeien', 'to grow', {
      example: { dutch: 'Planten hebben licht nodig om te groeien.', english: 'Plants need light to grow.' },
    }),
    verb('bewegen', 'to move', {
      note: 'moving house: verhuizen',
      example: { dutch: 'Mijn rug doet pijn, ik kan me bijna niet bewegen.', english: 'My back hurts, I can hardly move.' },
    }),
    verb('dromen', 'to dream', {
      example: { dutch: 'Ze blijft dromen van een huis aan zee.', english: 'She keeps dreaming of a house by the sea.' },
    }),
    verb('hangen', 'to hang', {
      example: { dutch: 'Je kunt je jas aan de kapstok hangen.', english: 'You can hang your coat on the coat rack.' },
    }),
    verb('stellen', 'to pose (a question), to set', {
      note: 'een vraag stellen: to ask a question; to put a thing down: zetten, leggen',
      example: { dutch: 'Mag ik u een vraag stellen?', english: 'May I ask you a question?' },
    }),
    verb('passen', 'to fit; to try on', {
      example: { dutch: 'Deze schoenen passen niet, ze zijn te klein.', english: "These shoes don't fit, they're too small." },
    }),
    verb('lukken', 'to work out', {
      note: "het lukt me niet: I can't manage it",
      example: { dutch: 'Ik heb geen tijd, het gaat me vandaag niet lukken.', english: "I don't have time, I won't manage it today." },
    }),
    verb('mislukken', 'to fail, to go wrong', {
      example: { dutch: 'Het kan mislukken, maar we proberen het toch.', english: "It might fail, but we'll try anyway." },
    }),
    verb('slagen', 'to pass (an exam)', {
      note: 'also: to succeed; failing an exam: zakken',
      example: { dutch: 'Succes met je examen! Je gaat vast slagen.', english: "Good luck with your exam! I'm sure you'll pass." },
    }),
    verb('oefenen', 'to practise', {
      example: { dutch: 'Ik wil mijn Nederlands met de buren oefenen.', english: 'I want to practise my Dutch with the neighbours.' },
    }),
    verb('onderzoeken', 'to examine, to investigate', {
      example: { dutch: 'De politie gaat het ongeluk onderzoeken.', english: 'The police are going to investigate the accident.' },
    }),
    verb('ontdekken', 'to discover', {
      example: { dutch: 'Mijn zoon wil later nieuwe planeten ontdekken.', english: 'My son wants to discover new planets when he grows up.' },
    }),
    verb('verbeteren', 'to improve', {
      note: 'also: to correct (mistakes)',
      example: { dutch: 'Hoe kunnen we de sfeer op het werk verbeteren?', english: 'How can we improve the atmosphere at work?' },
    }),
    verb('tellen', 'to count', {
      example: { dutch: 'Mijn zoontje kan al tot tien tellen.', english: 'My little boy can already count to ten.' },
    }),
    verb('rekenen', 'to calculate, to do sums', {
      note: 'rekenen op: to count on',
      example: { dutch: 'Zonder rekenmachine kan ik niet goed rekenen.', english: "I can't do sums well without a calculator." },
    }),
    verb('meten', 'to measure', {
      example: { dutch: 'Voor de nieuwe gordijnen moet ik het raam meten.', english: 'I need to measure the window for the new curtains.' },
    }),
    verb('wegen', 'to weigh', {
      example: { dutch: 'Je koffer mag niet meer dan twintig kilo wegen.', english: 'Your suitcase may not weigh more than twenty kilos.' },
    }),
    verb('betekenen', 'to mean (signify)', {
      note: 'what a person means: bedoelen',
      example: { dutch: 'Dat woord kan in het Engels iets anders betekenen.', english: 'That word can mean something else in English.' },
    }),
    verb('noemen', 'to name, to call (by a name)', {
      example: { dutch: 'We willen onze dochter Emma noemen.', english: 'We want to call our daughter Emma.' },
    }),
    verb('trouwen', 'to marry, to get married', {
      example: { dutch: 'Na tien jaar samen gaan ze eindelijk trouwen.', english: "After ten years together, they're finally getting married." },
    }),
    verb('sterven', 'to die', {
      accept: ['doodgaan', 'overlijden'],
      note: 'in speech often doodgaan',
      example: { dutch: 'Mijn opa wilde thuis sterven, niet in het ziekenhuis.', english: 'My grandpa wanted to die at home, not in hospital.' },
    }),
    // "geboren worden" never stands whole in a natural sentence, so the word is the participle.
    other('geboren', 'born', {
      note: 'geboren worden: to be born; ik ben geboren: I was born',
      example: { dutch: 'Ik ben in Lagos geboren en opgegroeid.', english: 'I was born and raised in Lagos.' },
    }),
    verb('opruimen', 'to tidy up', {
      note: 'ik ruim op, ik heb opgeruimd',
      example: { dutch: 'Wat een rommel! Je moet je kamer opruimen.', english: 'What a mess! You have to tidy your room.' },
    }),
    verb('schoonmaken', 'to clean', {
      note: 'ik maak schoon, ik heb schoongemaakt',
      example: { dutch: 'De badkamer is vies, ik moet hem schoonmaken.', english: 'The bathroom is dirty, I need to clean it.' },
    }),
    verb('bakken', 'to bake; to fry', {
      example: { dutch: 'De bakker moet elke nacht brood bakken.', english: 'The baker has to bake bread every night.' },
    }),
    verb('snijden', 'to cut (with a knife)', {
      example: { dutch: 'Kun je de tomaten in stukjes snijden?', english: 'Can you cut the tomatoes into pieces?' },
    }),
    verb('breken', 'to break', {
      accept: ['kapotgaan'],
      example: { dutch: 'Voorzichtig met die borden, ze kunnen breken.', english: 'Careful with those plates, they can break.' },
    }),
    verb('laten', 'to let', {
      note: 'also: to have something done (iets laten repareren)',
      example: { dutch: 'Kun je me laten weten of je komt?', english: "Can you let me know if you're coming?" },
    }),
    verb('snappen', 'to get (understand)', {
      accept: ['begrijpen'],
      note: 'informal for begrijpen',
      example: { dutch: 'Ik kan niet snappen waarom hij zo boos is.', english: "I can't understand why he's so angry." },
    }),
    verb('merken', 'to notice', {
      example: { dutch: 'Ik denk niet dat de buren het gaan merken.', english: "I don't think the neighbours will notice." },
    }),
    verb('opletten', 'to pay attention', {
      note: 'ik let op, ik heb opgelet',
      example: { dutch: 'Je moet opletten dat de kat niet naar buiten gaat.', english: "You have to watch that the cat doesn't get out." },
    }),
    verb('nadenken', 'to think about, to consider', {
      note: 'ik denk na, ik heb nagedacht',
      example: { dutch: 'Ik moet er even over nadenken.', english: 'I need to think about it for a moment.' },
    }),
    verb('verdwijnen', 'to disappear', {
      example: { dutch: 'Hoe kan mijn sleutel zomaar verdwijnen?', english: 'How can my key just disappear?' },
    }),
    verb('verschijnen', 'to appear (come into view)', {
      example: { dutch: 'Als het donker wordt, verschijnen de eerste sterren.', english: 'When it gets dark, the first stars appear.' },
    }),
    verb('volgen', 'to follow', {
      note: 'een cursus volgen: to take a course',
      example: { dutch: 'Je kunt mij volgen, ik weet de weg.', english: 'You can follow me, I know the way.' },
    }),
    verb('bereiken', 'to reach', {
      example: { dutch: 'U kunt ons van negen tot vijf telefonisch bereiken.', english: 'You can reach us by phone from nine to five.' },
    }),
  ],
};
