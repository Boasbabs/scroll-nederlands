import { noun } from '../build';
import type { WordTheme } from '../types';

export const ideas: WordTheme = {
  id: 'ideas',
  title: 'Everyday ideas',
  tier: 2,
  words: [
    noun('het probleem', 'the problem', {
      example: { dutch: 'Het probleem is dat mijn fiets kapot is.', english: 'The problem is that my bike is broken.' },
    }),
    noun('de reden', 'the reason', {
      near: ['de oorzaak'],
      example: { dutch: 'Wat is de reden van uw bezoek?', english: 'What is the reason for your visit?' },
    }),
    noun('het idee', 'the idea', {
      accept: ['de idee'],
      note: 'de idee is right too',
      example: { dutch: 'Ik heb geen idee waar mijn sleutels zijn.', english: 'I have no idea where my keys are.' },
    }),
    noun('de keuze', 'the choice', {
      accept: ['de keus'],
      example: { dutch: 'Thee of koffie? De keuze is aan jou.', english: 'Tea or coffee? The choice is yours.' },
    }),
    noun('de kans', 'the chance', {
      near: ['de mogelijkheid'],
      example: { dutch: 'De kans op regen is vandaag klein.', english: 'The chance of rain is low today.' },
    }),
    noun('de fout', 'the mistake', {
      example: { dutch: 'Er zit een fout in de rekening.', english: "There's a mistake in the bill." },
    }),
    noun('de manier', 'the way', {
      example: { dutch: 'Wat is de beste manier om Nederlands te leren?', english: 'What is the best way to learn Dutch?' },
    }),
    noun('het deel', 'the part', {
      example: { dutch: 'Een deel van mijn familie woont in Utrecht.', english: 'Part of my family lives in Utrecht.' },
    }),
    noun('de regel', 'the rule', {
      example: { dutch: 'Thuis hebben we één regel: geen telefoon aan tafel.', english: 'At home we have one rule: no phones at the table.' },
    }),
    noun('de informatie', 'the information', {
      accept: ['de info'],
      example: { dutch: 'Kijk voor meer informatie op de website.', english: 'For more information, see the website.' },
    }),
    noun('de mening', 'the opinion', {
      example: { dutch: 'Ik vind het mooi. Wat is jouw mening?', english: "I think it's beautiful. What's your opinion?" },
    }),
    noun('het verschil', 'the difference', {
      example: { dutch: 'Wat is het verschil tussen deze twee jassen?', english: "What's the difference between these two coats?" },
    }),
    noun('de oplossing', 'the solution', {
      example: { dutch: 'Geen paniek, we vinden wel een oplossing.', english: "Don't panic, we'll find a solution." },
    }),
    noun('het doel', 'the goal', {
      example: { dutch: 'Mijn doel is om goed Nederlands te spreken.', english: 'My goal is to speak Dutch well.' },
    }),
    noun('de situatie', 'the situation', {
      example: { dutch: 'Wat zou jij doen in mijn situatie?', english: 'What would you do in my situation?' },
    }),
    noun('het geval', 'the case', {
      example: { dutch: 'Regent het? In dat geval blijf ik thuis.', english: "Is it raining? In that case I'll stay at home." },
    }),
    noun('de zaak', 'the business; the matter', {
      near: ['het geval'],
      example: { dutch: 'Mijn oom heeft een kleine zaak: hij is loodgieter.', english: "My uncle has a small business: he's a plumber." },
    }),
    noun('het punt', 'the point', {
      example: { dutch: 'Op dat punt heb je gelijk.', english: "You're right on that point." },
    }),
    noun('het onderwerp', 'the topic, the subject', {
      example: { dutch: 'Laten we over een ander onderwerp praten.', english: "Let's talk about a different topic." },
    }),
    noun('de toekomst', 'the future', {
      example: { dutch: 'In de toekomst wil ik in Amsterdam wonen.', english: 'In the future I want to live in Amsterdam.' },
    }),
    noun('het verleden', 'the past', {
      example: { dutch: 'Ik heb in het verleden in Spanje gewoond.', english: 'I lived in Spain in the past.' },
    }),
    noun('de wereld', 'the world', {
      example: { dutch: 'Hij wil de hele wereld zien.', english: 'He wants to see the whole world.' },
    }),
    noun('de geschiedenis', 'the history', {
      example: { dutch: 'Amsterdam heeft een lange geschiedenis.', english: 'Amsterdam has a long history.' },
    }),
    noun('de ervaring', 'the experience', {
      example: { dutch: 'Het is mijn eerste baan: ik heb nog geen ervaring.', english: "It's my first job: I don't have any experience yet." },
    }),
    noun('de kennis', 'the knowledge', {
      note: 'also: an acquaintance',
      example: { dutch: 'Het examen test je kennis van Nederland.', english: 'The exam tests your knowledge of the Netherlands.' },
    }),
    noun('de aandacht', 'the attention', {
      example: { dutch: 'Mag ik even jullie aandacht?', english: 'Could I have your attention for a moment?' },
    }),
    noun('het begin', 'the beginning', {
      example: { dutch: 'In het begin was de film een beetje saai.', english: 'At the beginning, the film was a bit boring.' },
    }),
    noun('het einde', 'the end', {
      accept: ['het eind'],
      example: { dutch: 'Ik blijf tot het einde van het feest.', english: "I'm staying until the end of the party." },
    }),
    noun('het resultaat', 'the result', {
      example: { dutch: 'De nieuwe keuken is klaar. Wat een mooi resultaat!', english: 'The new kitchen is finished. What a great result!' },
    }),
    noun('het gevolg', 'the consequence', {
      near: ['het resultaat'],
      example: { dutch: 'Als gevolg van de storm rijden er geen treinen.', english: 'As a result of the storm, no trains are running.' },
    }),
    noun('de oorzaak', 'the cause', {
      example: { dutch: 'Wat is de oorzaak van de file?', english: 'What is the cause of the traffic jam?' },
    }),
    noun('het voordeel', 'the advantage', {
      example: { dutch: 'Een voordeel van de stad: alles is dichtbij.', english: 'One advantage of the city: everything is close by.' },
    }),
    noun('de mogelijkheid', 'the possibility', {
      accept: ['de optie'],
      example: { dutch: 'Op mijn werk is thuiswerken ook een mogelijkheid.', english: 'At my work, working from home is also a possibility.' },
    }),
    noun('de waarheid', 'the truth', {
      example: { dutch: 'Is dat echt zo? Vertel me de waarheid.', english: 'Is that really true? Tell me the truth.' },
    }),
    noun('de leugen', 'the lie', {
      example: { dutch: 'Dat is niet waar, dat is een leugen.', english: "That's not true, that's a lie." },
    }),
    noun('het geheim', 'the secret', {
      example: { dutch: 'Kun je een geheim bewaren? Niet aan papa vertellen!', english: "Can you keep a secret? Don't tell Dad!" },
    }),
    noun('het gevaar', 'the danger', {
      example: { dutch: 'Kleine kinderen zien het gevaar van het verkeer niet.', english: "Young children don't see the danger of traffic." },
    }),
    noun('de steun', 'the support', {
      example: { dutch: 'Ik heb veel steun aan mijn familie.', english: 'I get a lot of support from my family.' },
    }),
    noun('het verhaal', 'the story', {
      example: { dutch: 'Opa vertelt een verhaal over vroeger.', english: 'Grandpa tells a story about the old days.' },
    }),
    noun('de gedachte', 'the thought', {
      example: { dutch: 'De gedachte aan vakantie maakt me blij.', english: 'The thought of a holiday makes me happy.' },
    }),
    noun('de droom', 'the dream', {
      example: { dutch: 'Vannacht had ik een gekke droom.', english: 'Last night I had a crazy dream.' },
    }),
    noun('de hoop', 'the hope', {
      note: 'een hoop: a lot',
      example: { dutch: 'We hebben goede hoop dat het lukt.', english: 'We have high hopes that it will work out.' },
    }),
    noun('de angst', 'the fear', {
      example: { dutch: 'Veel mensen hebben angst voor de tandarts.', english: 'Many people have a fear of the dentist.' },
    }),
    noun('de liefde', 'the love', {
      example: { dutch: 'Voor mij was het liefde op het eerste gezicht.', english: 'For me it was love at first sight.' },
    }),
    noun('de vriendschap', 'the friendship', {
      example: { dutch: 'Onze vriendschap begon op de basisschool.', english: 'Our friendship began at primary school.' },
    }),
    noun('het vertrouwen', 'the trust', {
      example: { dutch: 'Ik heb veel vertrouwen in mijn huisarts.', english: 'I have a lot of trust in my GP.' },
    }),
    noun('de verantwoordelijkheid', 'the responsibility', {
      example: { dutch: 'Een hond is een grote verantwoordelijkheid.', english: 'A dog is a big responsibility.' },
    }),
    noun('de ruimte', 'the space', {
      accept: ['de plek', 'de plaats'],
      example: { dutch: 'De koelkast is vol: er is geen ruimte meer.', english: "The fridge is full: there's no space left." },
    }),
    noun('de rust', 'the peace and quiet', {
      note: 'rust nemen: to rest',
      example: { dutch: 'In het bos vind ik altijd rust.', english: 'In the woods I always find peace and quiet.' },
    }),
    noun('het moment', 'the moment', {
      example: { dutch: 'Op dit moment ben ik niet thuis.', english: "I'm not at home at the moment." },
    }),
    noun('het aantal', 'the number (how many)', {
      example: { dutch: 'Het aantal fietsen in Amsterdam is enorm.', english: 'The number of bikes in Amsterdam is huge.' },
    }),
    noun('de helft', 'the half', {
      example: { dutch: 'We betalen ieder de helft van de rekening.', english: 'We each pay half of the bill.' },
    }),
    noun('de rest', 'the rest', {
      example: { dutch: 'Ik neem één stuk, de rest is voor jou.', english: "I'll take one piece; the rest is for you." },
    }),
    noun('het geluk', 'the luck; the happiness', {
      example: { dutch: 'Ik had geluk: de trein was ook te laat.', english: 'I was lucky: the train was late too.' },
    }),
    noun('het risico', 'the risk', {
      accept: ['de risico', "de risico's"],
      note: 'de risico is right too',
      example: { dutch: 'Ik neem geen risico: de paraplu gaat mee.', english: "I'm not taking any risks: the umbrella is coming with me." },
    }),
    noun('de controle', 'the check', {
      note: 'onder controle: under control',
      example: { dutch: 'Bij een controle laat je je kaartje zien.', english: "When there's a check, you show your ticket." },
    }),
    noun('de rol', 'the role', {
      example: { dutch: 'In Nederland speelt het weer een grote rol.', english: 'In the Netherlands, the weather plays a big role.' },
    }),
    noun('de taak', 'the task', {
      example: { dutch: 'Iedereen heeft thuis een taak: ik doe de afwas.', english: 'Everyone has a task at home: I do the washing-up.' },
    }),
    noun('de opdracht', 'the assignment', {
      near: ['de taak'],
      example: { dutch: 'De opdracht is: schrijf een brief aan je buren.', english: 'The assignment is: write a letter to your neighbours.' },
    }),
    noun('het gesprek', 'the conversation', {
      example: { dutch: 'Ik had een lang gesprek met de dokter.', english: 'I had a long conversation with the doctor.' },
    }),
    noun('de ruzie', 'the argument, the fight', {
      example: { dutch: 'Mijn broer en ik hadden ruzie over geld.', english: 'My brother and I had an argument about money.' },
    }),
    noun('de beslissing', 'the decision', {
      example: { dutch: 'Ik heb een beslissing genomen: ik ga verhuizen.', english: "I've made a decision: I'm moving house." },
    }),
    noun('de verandering', 'the change', {
      example: { dutch: 'Het is droog vandaag, voor de verandering.', english: "It's dry today, for a change." },
    }),
    noun('het voorbeeld', 'the example', {
      example: { dutch: 'Ik begrijp het niet. Heb je een voorbeeld?', english: "I don't understand. Do you have an example?" },
    }),
    noun('het gevoel', 'the feeling', {
      example: { dutch: 'Ik heb een goed gevoel over de toets.', english: 'I have a good feeling about the test.' },
    }),
    noun('de indruk', 'the impression', {
      example: { dutch: 'De eerste indruk is heel belangrijk.', english: 'First impressions are very important.' },
    }),
    noun('de bedoeling', 'the intention', {
      example: { dutch: 'Sorry, dat was niet de bedoeling!', english: "Sorry, that wasn't the intention!" },
    }),
    noun('de moeite', 'the effort, the trouble', {
      example: { dutch: 'Het museum is echt de moeite waard.', english: 'The museum is really worth the effort.' },
    }),
    noun('de kracht', 'the strength', {
      example: { dutch: 'Hij is sterk: hij heeft veel kracht in zijn armen.', english: "He's strong: he has a lot of strength in his arms." },
    }),
    noun('het geluid', 'the sound', {
      example: { dutch: 'De wasmachine maakt een raar geluid.', english: 'The washing machine is making a strange sound.' },
    }),
    noun('de vrijheid', 'the freedom', {
      example: { dutch: 'Mijn kinderen hebben veel vrijheid: ze fietsen alleen naar school.', english: 'My children have a lot of freedom: they cycle to school on their own.' },
    }),
    noun('de cultuur', 'the culture', {
      example: { dutch: 'Fietsen hoort bij de Nederlandse cultuur.', english: 'Cycling is part of Dutch culture.' },
    }),
    noun('het leven', 'the life', {
      example: { dutch: 'Ik woon al mijn hele leven in Utrecht.', english: "I've lived in Utrecht all my life." },
    }),
    noun('de dood', 'the death', {
      example: { dutch: 'Na de dood van onze kat waren we verdrietig.', english: 'After the death of our cat we were sad.' },
    }),
    noun('de gezondheid', 'the health', {
      note: 'after a sneeze: Gezondheid! (bless you)',
      example: { dutch: 'Mijn gezondheid is goed: ik ben bijna nooit ziek.', english: "My health is good: I'm hardly ever ill." },
    }),
  ],
};
