import { noun } from '../build';
import type { WordTheme } from '../types';

export const jobs: WordTheme = {
  id: 'jobs',
  title: 'Jobs',
  tier: 2,
  words: [
    noun('de schoonmaker', 'the cleaner', {
      note: 'a woman: de schoonmaakster',
      accept: ['de schoonmaakster'],
      example: { dutch: "De schoonmaker maakt 's avonds het kantoor schoon.", english: 'The cleaner cleans the office in the evening.' },
    }),
    noun('de chauffeur', 'the driver', {
      example: { dutch: 'De chauffeur stopt bij elke halte.', english: 'The driver stops at every stop.' },
    }),
    noun('de magazijnmedewerker', 'the warehouse worker', {
      example: { dutch: 'De magazijnmedewerker zet de bestellingen klaar.', english: 'The warehouse worker gets the orders ready.' },
    }),
    noun('de zorgmedewerker', 'the care worker', {
      example: { dutch: 'De zorgmedewerker helpt opa elke ochtend met douchen.', english: 'The care worker helps Grandpa shower every morning.' },
    }),
    noun('de kassamedewerker', 'the cashier', {
      note: 'a woman: often de caissière',
      accept: ['de caissière'],
      example: { dutch: 'De kassamedewerker scant de boodschappen.', english: 'The cashier scans the shopping.' },
    }),
    noun('de verkoper', 'the salesperson', {
      note: 'a woman: de verkoopster',
      accept: ['de verkoopster'],
      example: { dutch: 'Mijn broer werkt als verkoper in een fietsenwinkel.', english: 'My brother works as a salesperson in a bike shop.' },
    }),
    noun('de timmerman', 'the carpenter', {
      example: { dutch: 'De timmerman maakt een kast van hout.', english: 'The carpenter makes a cupboard out of wood.' },
    }),
    noun('de advocaat', 'the lawyer', {
      example: { dutch: 'Mijn advocaat leest het contract goed door.', english: 'My lawyer reads the contract carefully.' },
    }),
    noun('de apotheker', 'the pharmacist', {
      example: { dutch: 'De apotheker legt uit hoe je de pillen inneemt.', english: 'The pharmacist explains how to take the pills.' },
    }),
    noun('de schilder', 'the painter', {
      example: { dutch: 'De schilder verft onze voordeur groen.', english: 'The painter is painting our front door green.' },
    }),
    noun('de tuinman', 'the gardener', {
      example: { dutch: 'De tuinman maait elke week het gras.', english: 'The gardener mows the grass every week.' },
    }),
    noun('de postbode', 'the postman', {
      example: { dutch: 'De postbode doet een brief in de brievenbus.', english: 'The postman puts a letter in the letterbox.' },
    }),
    noun('de koerier', 'the courier', {
      example: { dutch: 'De koerier bezorgt het pakket tussen tien en twaalf.', english: 'The courier delivers the parcel between ten and twelve.' },
    }),
    noun('de vrachtwagenchauffeur', 'the lorry driver', {
      example: { dutch: 'Mijn oom is vrachtwagenchauffeur en rijdt vaak naar Italië.', english: 'My uncle is a lorry driver and often drives to Italy.' },
    }),
    noun('de beveiliger', 'the security guard', {
      example: { dutch: 'De beveiliger controleert de tassen bij de ingang.', english: 'The security guard checks the bags at the entrance.' },
    }),
    noun('de receptionist', 'the receptionist', {
      note: 'a woman: de receptioniste',
      accept: ['de receptioniste'],
      example: { dutch: 'De receptionist neemt de telefoon op.', english: 'The receptionist answers the phone.' },
    }),
    noun('de boekhouder', 'the bookkeeper', {
      note: 'a woman: de boekhoudster',
      accept: ['de boekhoudster'],
      example: { dutch: 'Mijn boekhouder doet elk jaar mijn belastingaangifte.', english: 'My bookkeeper does my tax return every year.' },
    }),
    noun('de manager', 'the manager', {
      example: { dutch: 'De manager maakt het rooster voor volgende week.', english: 'The manager makes the rota for next week.' },
    }),
    noun('de ondernemer', 'the entrepreneur', {
      note: 'a woman: de onderneemster',
      accept: ['de onderneemster'],
      example: { dutch: 'Mijn buurman is ondernemer en heeft drie winkels.', english: 'My neighbour is an entrepreneur and owns three shops.' },
    }),
    noun('de eigenaar', 'the owner', {
      example: { dutch: 'De eigenaar van het café zoekt nieuw personeel.', english: 'The owner of the café is looking for new staff.' },
    }),
    noun('de ingenieur', 'the engineer', {
      example: { dutch: 'De ingenieur rekent uit of de brug sterk genoeg is.', english: 'The engineer works out whether the bridge is strong enough.' },
    }),
    noun('de programmeur', 'the programmer', {
      example: { dutch: 'De programmeur schrijft code voor een nieuwe app.', english: 'The programmer writes code for a new app.' },
    }),
    noun('de journalist', 'the journalist', {
      example: { dutch: 'Een journalist van de krant wil mij interviewen.', english: 'A journalist from the newspaper wants to interview me.' },
    }),
    noun('de fotograaf', 'the photographer', {
      example: { dutch: "De fotograaf maakt foto's op de bruiloft.", english: 'The photographer takes photos at the wedding.' },
    }),
    noun('de kunstenaar', 'the artist', {
      note: 'a woman: de kunstenares',
      accept: ['de kunstenares'],
      example: { dutch: 'Deze kunstenaar maakt kunst van oude fietsen.', english: 'This artist makes art from old bikes.' },
    }),
    noun('de muzikant', 'the musician', {
      example: { dutch: 'De muzikant speelt gitaar op straat.', english: 'The musician plays guitar in the street.' },
    }),
    noun('de agent', 'the police officer', {
      note: 'short for de politieagent',
      accept: ['de politieagent'],
      example: { dutch: 'De agent vraagt om mijn rijbewijs.', english: 'The police officer asks for my driving licence.' },
    }),
    noun('de piloot', 'the pilot', {
      example: { dutch: 'De piloot zegt dat we over tien minuten landen.', english: 'The pilot says we will land in ten minutes.' },
    }),
    noun('de bouwvakker', 'the construction worker', {
      example: { dutch: 'Een bouwvakker draagt altijd een helm.', english: 'A construction worker always wears a helmet.' },
    }),
    noun('de docent', 'the teacher, the lecturer', {
      note: 'teaches at secondary school and up, or on a course',
      example: { dutch: 'Mijn docent Nederlands geeft ons veel huiswerk.', english: 'My Dutch teacher gives us a lot of homework.' },
    }),
    noun('de onderzoeker', 'the researcher', {
      example: { dutch: 'De onderzoeker werkt in een lab van de universiteit.', english: 'The researcher works in a university lab.' },
    }),
    noun('de dierenarts', 'the vet', {
      example: { dutch: 'Onze hond moet morgen naar de dierenarts.', english: 'Our dog has to go to the vet tomorrow.' },
    }),
    noun('de vrijwilliger', 'the volunteer', {
      example: { dutch: 'Als vrijwilliger help ik elke zaterdag bij de voedselbank.', english: 'As a volunteer, I help at the food bank every Saturday.' },
    }),
    noun('de werknemer', 'the employee', {
      note: 'werk + nemen: the one who takes the work',
      example: { dutch: 'Een werknemer krijgt meestal in mei vakantiegeld.', english: 'An employee usually gets their holiday allowance in May.' },
    }),
    noun('de werkgever', 'the employer', {
      note: 'werk + geven: the one who gives the work',
      example: { dutch: 'Mijn werkgever betaalt mijn reiskosten.', english: 'My employer pays my travel costs.' },
    }),
    noun("de zzp'er", 'the freelancer', {
      key: 'zzper',
      note: 'said zet-zet-PAY-er; zelfstandige zonder personeel: self-employed, no staff',
      example: { dutch: "Mijn zus is zzp'er en werkt voor zichzelf.", english: 'My sister is a freelancer and works for herself.' },
    }),
    noun('de uitzendkracht', 'the temp worker', {
      note: 'works through an uitzendbureau',
      example: { dutch: 'Als uitzendkracht werk ik elke week ergens anders.', english: 'As a temp worker, I work somewhere different every week.' },
    }),
    noun('de stagiair', 'the intern', {
      note: 'a woman: de stagiaire',
      accept: ['de stagiaire'],
      example: { dutch: 'De stagiair loopt drie maanden stage bij ons.', english: 'The intern is doing a three-month internship with us.' },
    }),
    noun('het bedrijf', 'the company', {
      example: { dutch: 'Mijn man werkt bij een groot bedrijf in Rotterdam.', english: 'My husband works for a big company in Rotterdam.' },
    }),
    noun('de afdeling', 'the department', {
      example: { dutch: 'De afdeling marketing zit op de derde verdieping.', english: 'The marketing department is on the third floor.' },
    }),
  ],
};
