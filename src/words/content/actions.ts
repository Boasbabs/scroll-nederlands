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
      example: { dutch: 'Ik kan zijn naam nooit onthouden.', english: 'I can never remember his name.' },
    }),
    verb('herinneren', 'to remind', {
      note: 'zich herinneren: to remember (recall)',
      example: { dutch: 'Wil je me morgen aan de afspraak herinneren?', english: 'Will you remind me about the appointment tomorrow?' },
    }),
    verb('beslissen', 'to decide', {
      example: { dutch: 'Jij mag beslissen waar we vanavond eten.', english: 'You can decide where we eat tonight.' },
    }),
    verb('kiezen', 'to choose', {
      example: { dutch: 'Ik kan niet kiezen tussen pizza en pasta.', english: "I can't choose between pizza and pasta." },
    }),
    verb('besluiten', 'to make up your mind', {
      note: 'close to beslissen; ik heb besloten: I have decided',
      example: { dutch: 'Ik moet vandaag besluiten of ik die baan aanneem.', english: 'I have to make up my mind today whether to take that job.' },
    }),
    verb('regelen', 'to arrange, to sort out', {
      example: { dutch: 'Geen zorgen, ik ga het voor je regelen.', english: "Don't worry, I'll sort it out for you." },
    }),
    verb('organiseren', 'to organise', {
      example: { dutch: 'We willen een feestje voor oma organiseren.', english: 'We want to organise a party for grandma.' },
    }),
    verb('plannen', 'to plan', {
      example: { dutch: 'Ik wil mijn week beter plannen.', english: 'I want to plan my week better.' },
    }),
    verb('verdienen', 'to earn; to deserve', {
      example: { dutch: 'Ik wil meer geld verdienen.', english: 'I want to earn more money.' },
    }),
    verb('uitgeven', 'to spend (money)', {
      note: 'ik geef uit, ik heb uitgegeven',
      example: { dutch: 'Hoeveel wil je aan een nieuwe telefoon uitgeven?', english: 'How much do you want to spend on a new phone?' },
    }),
    verb('sparen', 'to save (money)', {
      note: 'also: to collect (stamps, points)',
      example: { dutch: 'Ik wil elke maand honderd euro sparen.', english: 'I want to save a hundred euros every month.' },
    }),
    verb('lenen', 'to borrow; to lend', {
      example: { dutch: 'Mag ik je fiets even lenen?', english: 'Can I borrow your bike for a bit?' },
    }),
    verb('delen', 'to share', {
      example: { dutch: 'Zullen we een taxi delen?', english: 'Shall we share a taxi?' },
    }),
    verb('ontvangen', 'to receive', {
      note: 'more formal than krijgen',
      example: { dutch: 'Binnen twee weken zult u een brief ontvangen.', english: 'You will receive a letter within two weeks.' },
    }),
    verb('verwachten', 'to expect', {
      example: { dutch: 'Wanneer kan ik het pakketje verwachten?', english: 'When can I expect the parcel?' },
    }),
    verb('hopen', 'to hope', {
      example: { dutch: 'We kunnen alleen maar hopen dat het goed gaat.', english: 'We can only hope that it goes well.' },
    }),
    verb('geloven', 'to believe', {
      example: { dutch: 'Je moet me geloven, het is echt waar!', english: "You have to believe me, it's really true!" },
    }),
    verb('uitleggen', 'to explain', {
      note: 'ik leg uit, ik heb uitgelegd',
      example: { dutch: 'Kun je dat nog een keer uitleggen?', english: 'Can you explain that once more?' },
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
      example: { dutch: 'Ik kan zijn excuses niet accepteren.', english: "I can't accept his apology." },
    }),
    verb('weigeren', 'to refuse', {
      example: { dutch: 'Je kunt de cookies op deze website weigeren.', english: 'You can refuse the cookies on this website.' },
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
    verb('schreeuwen', 'to shout, to scream', {
      example: { dutch: 'Je hoeft niet zo te schreeuwen, ik hoor je wel.', english: "You don't have to shout like that, I can hear you." },
    }),
    verb('roepen', 'to call (out)', {
      example: { dutch: 'Kun je de kinderen roepen? Het eten is klaar.', english: "Can you call the children? Dinner's ready." },
    }),
    verb('reageren', 'to react, to respond', {
      note: 'reageren op: to respond to',
      example: { dutch: 'Hoe moet ik op zijn bericht reageren?', english: 'How should I respond to his message?' },
    }),
    verb('ruiken', 'to smell', {
      example: { dutch: 'Ik kan niets ruiken, ik ben verkouden.', english: "I can't smell anything, I've got a cold." },
    }),
    verb('proeven', 'to taste', {
      example: { dutch: 'Wil je deze kaas even proeven?', english: 'Would you like to taste this cheese?' },
    }),
    verb('pakken', 'to grab, to take', {
      note: 'also: to pack (een koffer pakken)',
      example: { dutch: 'Kun je de melk uit de koelkast pakken?', english: 'Can you grab the milk from the fridge?' },
    }),
    verb('gooien', 'to throw', {
      example: { dutch: 'Glas moet je in de glasbak gooien.', english: 'You have to throw glass in the bottle bank.' },
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
      example: { dutch: 'Ik kan mijn arm bijna niet bewegen.', english: 'I can hardly move my arm.' },
    }),
    verb('dromen', 'to dream', {
      example: { dutch: 'Ze blijft dromen van een huis aan zee.', english: 'She keeps dreaming of a house by the sea.' },
    }),
    verb('hangen', 'to hang', {
      example: { dutch: 'Je kunt je jas aan de kapstok hangen.', english: 'You can hang your coat on the coat rack.' },
    }),
    verb('stellen', 'to put, to set', {
      note: 'een vraag stellen: to ask a question',
      example: { dutch: 'Mag ik u een vraag stellen?', english: 'May I ask you a question?' },
    }),
    verb('passen', 'to fit; to try on', {
      example: { dutch: 'Mag ik deze broek even passen?', english: 'Can I try on these trousers?' },
    }),
    verb('lukken', 'to work out, to succeed', {
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
      example: { dutch: 'Ik wil elke dag tien minuten Nederlands oefenen.', english: 'I want to practise Dutch for ten minutes every day.' },
    }),
    verb('onderzoeken', 'to examine, to investigate', {
      example: { dutch: 'De huisarts wil je knie even onderzoeken.', english: 'The GP wants to examine your knee.' },
    }),
    verb('ontdekken', 'to discover', {
      example: { dutch: 'Op vakantie wil ik graag nieuwe dingen ontdekken.', english: 'On holiday I like to discover new things.' },
    }),
    verb('verbeteren', 'to improve', {
      note: 'also: to correct (mistakes)',
      example: { dutch: 'Ik wil mijn uitspraak verbeteren.', english: 'I want to improve my pronunciation.' },
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
      example: { dutch: 'Ik moet mijn koffer nog wegen voor de vlucht.', english: 'I still need to weigh my suitcase for the flight.' },
    }),
    verb('betekenen', 'to mean (signify)', {
      note: 'what a person means: bedoelen',
      example: { dutch: 'Dat woord kan in het Engels iets anders betekenen.', english: 'That word can mean something else in English.' },
    }),
    verb('noemen', 'to name, to call', {
      example: { dutch: 'We willen onze dochter Emma noemen.', english: 'We want to call our daughter Emma.' },
    }),
    verb('trouwen', 'to marry, to get married', {
      example: { dutch: 'Ze gaan volgend jaar in juni trouwen.', english: "They're getting married in June next year." },
    }),
    verb('sterven', 'to die', {
      note: 'in speech often doodgaan',
      example: { dutch: 'Mijn opa wilde thuis sterven, niet in het ziekenhuis.', english: 'My grandpa wanted to die at home, not in hospital.' },
    }),
    // "geboren worden" never stands whole in a natural sentence, so the word is the participle.
    other('geboren', 'born', {
      note: 'geboren worden: to be born; ik ben geboren: I was born',
      example: { dutch: 'Ik ben in Lagos geboren.', english: 'I was born in Lagos.' },
    }),
    verb('opruimen', 'to tidy up', {
      note: 'ik ruim op, ik heb opgeruimd',
      example: { dutch: 'Na het eten gaan we samen opruimen.', english: "After dinner we'll tidy up together." },
    }),
    verb('schoonmaken', 'to clean', {
      note: 'ik maak schoon, ik heb schoongemaakt',
      example: { dutch: 'Op zaterdag gaan we het huis schoonmaken.', english: "On Saturday we're going to clean the house." },
    }),
    verb('bakken', 'to bake; to fry', {
      example: { dutch: 'Zullen we morgen een appeltaart bakken?', english: 'Shall we bake an apple pie tomorrow?' },
    }),
    verb('snijden', 'to cut (with a knife)', {
      example: { dutch: 'Kun je de tomaten in stukjes snijden?', english: 'Can you cut the tomatoes into pieces?' },
    }),
    verb('breken', 'to break', {
      example: { dutch: 'Voorzichtig met die borden, ze kunnen breken.', english: 'Careful with those plates, they can break.' },
    }),
    verb('laten', 'to let', {
      note: 'also: to have something done (iets laten repareren)',
      example: { dutch: 'Kun je me laten weten of je komt?', english: "Can you let me know if you're coming?" },
    }),
    verb('snappen', 'to get (understand)', {
      note: 'informal for begrijpen',
      example: { dutch: 'Je hoeft niet alles meteen te snappen.', english: "You don't have to get everything straight away." },
    }),
    verb('merken', 'to notice', {
      example: { dutch: 'Ik denk niet dat de buren het gaan merken.', english: "I don't think the neighbours will notice." },
    }),
    verb('opletten', 'to pay attention', {
      note: 'ik let op, ik heb opgelet',
      example: { dutch: 'Je moet goed opletten in de les.', english: 'You have to pay attention in class.' },
    }),
    verb('nadenken', 'to think about, to consider', {
      note: 'ik denk na, ik heb nagedacht',
      example: { dutch: 'Ik moet er even over nadenken.', english: 'I need to think about it for a moment.' },
    }),
    verb('verdwijnen', 'to disappear', {
      example: { dutch: 'De pijn zal na een paar dagen verdwijnen.', english: 'The pain will disappear after a few days.' },
    }),
    verb('verschijnen', 'to appear', {
      example: { dutch: 'Er moet nu een code op je scherm verschijnen.', english: 'A code should now appear on your screen.' },
    }),
    verb('volgen', 'to follow', {
      note: 'een cursus volgen: to take a course',
      example: { dutch: 'Je kunt mij volgen, ik weet de weg.', english: 'You can follow me, I know the way.' },
    }),
    verb('bereiken', 'to reach', {
      example: { dutch: 'Hoe kan ik u het beste bereiken?', english: "What's the best way to reach you?" },
    }),
  ],
};
