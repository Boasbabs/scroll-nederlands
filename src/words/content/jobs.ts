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
      example: { dutch: 'De chauffeur van de bus stopt bij elke halte.', english: 'The bus driver stops at every stop.' },
    }),
    noun('de magazijnmedewerker', 'the warehouse worker', {
      example: { dutch: 'De magazijnmedewerker zet de bestellingen klaar.', english: 'The warehouse worker gets the orders ready.' },
    }),
    noun('de zorgmedewerker', 'the care worker', {
      example: { dutch: 'De verpleegkundige geeft medicijnen, de zorgmedewerker helpt met douchen.', english: 'The nurse gives the medicines; the care worker helps with showering.' },
    }),
    noun('de kassamedewerker', 'the cashier', {
      note: 'a woman: often de caissière',
      accept: ['de caissière'],
      example: { dutch: 'De kassamedewerker scant de boodschappen.', english: 'The cashier scans the shopping.' },
    }),
    noun('de verkoper', 'the salesperson', {
      note: 'a woman: de verkoopster',
      accept: ['de verkoopster'],
      example: { dutch: 'Ik werk als verkoper: ik verkoop fietsen.', english: 'I work as a salesperson: I sell bikes.' },
    }),
    noun('de timmerman', 'the carpenter', {
      example: { dutch: 'De timmerman maakt een kast van hout.', english: 'The carpenter makes a cupboard out of wood.' },
    }),
    noun('de advocaat', 'the lawyer', {
      example: { dutch: 'Mijn huisbaas wil niet betalen, dus ik neem een advocaat.', english: "My landlord won't pay, so I'm getting a lawyer." },
    }),
    noun('de apotheker', 'the pharmacist', {
      example: { dutch: 'De apotheker geeft me de pillen van de huisarts.', english: 'The pharmacist gives me the pills the GP prescribed.' },
    }),
    noun('de schilder', 'the painter', {
      example: { dutch: 'De schilder verft onze voordeur groen.', english: 'The painter is painting our front door green.' },
    }),
    noun('de tuinman', 'the gardener', {
      example: { dutch: 'De tuinman maait elke week het gras in onze tuin.', english: 'The gardener mows the grass in our garden every week.' },
    }),
    noun('de postbode', 'the postman', {
      example: { dutch: 'De postbode doet een brief in de brievenbus.', english: 'The postman puts a letter in the letterbox.' },
    }),
    noun('de koerier', 'the courier', {
      example: { dutch: 'We sturen het pakket met een koerier.', english: "We're sending the parcel by courier." },
    }),
    noun('de vrachtwagenchauffeur', 'the lorry driver', {
      accept: ['de chauffeur'],
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
      accept: ['de boekhoudster', 'de accountant'],
      example: { dutch: 'Een boekhouder doet elk jaar je belastingaangifte.', english: 'A bookkeeper does your tax return every year.' },
    }),
    noun('de manager', 'the manager', {
      example: { dutch: 'Hij is manager: hij leidt een team van tien mensen.', english: "He's a manager: he leads a team of ten people." },
    }),
    noun('de ondernemer', 'the entrepreneur', {
      note: 'a woman: de onderneemster',
      accept: ['de onderneemster'],
      example: { dutch: 'Mijn buurvrouw is een echte ondernemer: ze heeft drie winkels.', english: 'My neighbour is a real entrepreneur: she has three shops.' },
    }),
    noun('de eigenaar', 'the owner', {
      accept: ['de eigenares'],
      example: { dutch: 'Wie is de eigenaar van deze fiets?', english: 'Who is the owner of this bike?' },
    }),
    noun('de ingenieur', 'the engineer', {
      example: { dutch: 'De ingenieur rekent uit of de brug sterk genoeg is.', english: 'The engineer works out whether the bridge is strong enough.' },
    }),
    noun('de programmeur', 'the programmer', {
      accept: ['de ontwikkelaar'],
      example: { dutch: 'De programmeur schrijft code voor een nieuwe app.', english: 'The programmer writes code for a new app.' },
    }),
    noun('de journalist', 'the journalist', {
      accept: ['de journaliste'],
      example: { dutch: 'Een journalist van de krant wil mij interviewen.', english: 'A journalist from the newspaper wants to interview me.' },
    }),
    noun('de fotograaf', 'the photographer', {
      accept: ['de fotografe'],
      example: { dutch: "De fotograaf maakt foto's op de bruiloft.", english: 'The photographer takes photos at the wedding.' },
    }),
    noun('de kunstenaar', 'the artist', {
      note: 'a woman: de kunstenares',
      accept: ['de kunstenares'],
      example: { dutch: 'Deze kunstenaar maakt kunst van oude fietsen.', english: 'This artist makes art from old bikes.' },
    }),
    noun('de muzikant', 'the musician', {
      example: { dutch: 'Hij is muzikant: hij speelt piano, gitaar en drums.', english: "He's a musician: he plays piano, guitar and drums." },
    }),
    noun('de agent', 'the police officer', {
      note: 'short for de politieagent',
      accept: ['de politieagent', 'de agente'],
      example: { dutch: 'Een agent vraagt om mijn rijbewijs.', english: 'A police officer asks for my driving licence.' },
    }),
    noun('de piloot', 'the pilot', {
      example: { dutch: 'De piloot landt het vliegtuig veilig op Schiphol.', english: 'The pilot lands the plane safely at Schiphol.' },
    }),
    noun('de bouwvakker', 'the construction worker', {
      example: { dutch: 'Een bouwvakker draagt altijd een helm.', english: 'A construction worker always wears a helmet.' },
    }),
    noun('de docent', 'the teacher, the lecturer', {
      accept: ['de leraar', 'de lerares', 'de docente'],
      note: 'teaches at secondary school and up, or on a course',
      example: { dutch: 'Mijn docent Nederlands geeft ons veel huiswerk.', english: 'My Dutch teacher gives us a lot of homework.' },
    }),
    noun('de onderzoeker', 'the researcher', {
      example: { dutch: 'De onderzoeker zoekt een nieuw medicijn tegen griep.', english: 'The researcher is looking for a new flu medicine.' },
    }),
    noun('de dierenarts', 'the vet', {
      example: { dutch: 'Onze hond moet morgen naar de dierenarts.', english: 'Our dog has to go to the vet tomorrow.' },
    }),
    noun('de vrijwilliger', 'the volunteer', {
      accept: ['de vrijwilligster'],
      example: { dutch: 'Als vrijwilliger help ik elke zaterdag bij de voedselbank.', english: 'As a volunteer, I help at the food bank every Saturday.' },
    }),
    noun('de werknemer', 'the employee', {
      note: 'werk + nemen: the one who takes the work',
      example: { dutch: 'Een werknemer krijgt meestal in mei vakantiegeld.', english: 'An employee usually gets their holiday allowance in May.' },
    }),
    noun('de werkgever', 'the employer', {
      note: 'werk + geven: the one who gives the work',
      example: { dutch: 'Mijn werkgever is de gemeente Utrecht.', english: 'My employer is the City of Utrecht.' },
    }),
    noun("de zzp'er", 'the freelancer', {
      accept: ['de freelancer'],
      near: ['de ondernemer'],
      key: 'zzper',
      note: 'said zet-zet-PAY-er; zelfstandige zonder personeel: self-employed, no staff',
      example: { dutch: "Mijn zus is zzp'er: ze heeft geen personeel.", english: 'My sister is a freelancer: she has no staff.' },
    }),
    noun('de uitzendkracht', 'the temp worker', {
      note: 'works through an uitzendbureau',
      example: { dutch: 'Als uitzendkracht krijg ik mijn werk via een uitzendbureau.', english: 'As a temp worker, I get my work through an agency.' },
    }),
    noun('de stagiair', 'the intern', {
      note: 'a woman: de stagiaire',
      accept: ['de stagiaire'],
      example: { dutch: 'Een stagiair is iemand die stage loopt.', english: 'An intern is someone who does an internship.' },
    }),
    noun('het bedrijf', 'the company', {
      example: { dutch: 'Mijn man heeft een klein bedrijf: hij maakt websites.', english: 'My husband has a small company: he makes websites.' },
    }),
    noun('de afdeling', 'the department', {
      example: { dutch: 'De afdeling marketing zit op de derde verdieping.', english: 'The marketing department is on the third floor.' },
    }),
  ],
};
