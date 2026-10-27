import type { CurriculumLevel } from './types';

export type ModulePlan = {
  id: string;
  title: string;
  description: string;
};

export type StagePlan = {
  id: string;
  level: CurriculumLevel;
  title: string;
  objective: string;
  modules: Array<ModulePlan>;
};

/**
 * Stage and module order. Lesson content lives in content/<stage>/<module>.ts
 * and is attached by id in index.ts.
 */
export const curriculumStructure: Array<StagePlan> = [
  {
    id: 's0',
    level: 'pre-a1',
    title: 'Stage 0 · Foundations',
    objective:
      'Recognise Dutch sounds and spelling and start talking with essential everyday expressions.',
    modules: [
      { id: 's0-sounds', title: 'Sounds and spelling', description: 'The alphabet, long and short vowels, vowel pairs and the sounds English speakers find hard.' },
      { id: 's0-greet', title: 'Greetings and politeness', description: 'Hello, goodbye, please, thank you, sorry, and when to say je or u.' },
      { id: 's0-intro', title: 'Introducing yourself', description: 'Your name, where you are from, where you live and which languages you speak.' },
      { id: 's0-pron', title: 'Pronouns, zijn and hebben', description: 'Who is who, and the two verbs you will use most: to be and to have.' },
      { id: 's0-questions', title: 'Question words', description: 'What, who, where, when, how, why, how much and which.' },
      { id: 's0-numbers', title: 'Numbers, days and time', description: 'Counting to 100, days, months, dates and telling the time.' },
      { id: 's0-class', title: 'Clarification phrases', description: 'Asking someone to repeat, slow down or explain a word.' },
      { id: 's0-check', title: 'Stage 0 checkpoint', description: 'Cumulative practice of everything in the foundations stage.' },
    ],
  },
  {
    id: 's1',
    level: 'a1',
    title: 'Stage 1 · Everyday A1',
    objective:
      'Understand and produce short expressions about familiar topics and handle predictable everyday interactions.',
    modules: [
      { id: 's1-me', title: 'Family and personal details', description: 'Family, relationships, age, possessives and filling in your details.' },
      { id: 's1-countries', title: 'Countries and languages', description: 'Nationalities, languages and how long you have lived somewhere.' },
      { id: 's1-verbs', title: 'Present tense', description: 'Regular and common irregular verbs in the present tense.' },
      { id: 's1-order', title: 'Word order and questions', description: 'Verb in second place, yes/no questions and question-word questions.' },
      { id: 's1-articles', title: 'De, het, een and plurals', description: 'Articles, plurals, and this/that.' },
      { id: 's1-home', title: 'Home and everyday objects', description: 'Rooms, objects, er is / er zijn and where things are.' },
      { id: 's1-food', title: 'Food, drinks and cafés', description: 'Ordering, asking for the bill and talking about meals.' },
      { id: 's1-shop', title: 'Shopping and payment', description: 'Prices, quantities, finding items and paying.' },
      { id: 's1-neg', title: 'Saying no: niet and geen', description: 'The two ways to make a sentence negative.' },
      { id: 's1-time', title: 'Time and appointments', description: 'Clock times, parts of the day, opening hours and appointments.' },
      { id: 's1-routine', title: 'Daily routine', description: 'What you do each day, how often and where you go.' },
      { id: 's1-work', title: 'Work and occupations', description: 'Jobs, workplaces and colleagues.' },
      { id: 's1-transport', title: 'Transport and directions', description: 'Getting around by bike, train and bus, and asking the way.' },
      { id: 's1-weather', title: 'Weather and descriptions', description: 'Weather talk and describing people and places with adjectives.' },
      { id: 's1-free', title: 'Hobbies and free time', description: 'What you like doing and how often.' },
      { id: 's1-modals', title: 'Want, can, must, may', description: 'willen, kunnen, moeten and mogen with an infinitive at the end.' },
      { id: 's1-requests', title: 'Requests and questions', description: 'Polite requests and common questions to strangers.' },
      { id: 's1-connect', title: 'Joining ideas', description: 'en, maar, of and want.' },
      { id: 's1-texts', title: 'Short texts and messages', description: 'Reading text messages and signs, listening to short messages, writing a quick message.' },
      { id: 's1-check', title: 'A1 checkpoints', description: 'Cumulative checks across the A1 topics and grammar.' },
    ],
  },
  {
    id: 's2',
    level: 'a1-a2',
    title: 'Stage 2 · Towards A2',
    objective:
      'Move beyond fixed expressions into more flexible communication about familiar situations.',
    modules: [
      { id: 's2-plans', title: 'Plans and the future', description: 'gaan + infinitive, zullen we, and finding a time that suits.' },
      { id: 's2-invite', title: 'Invitations', description: 'Inviting, accepting, declining and congratulating.' },
      { id: 's2-separable', title: 'Separable verbs', description: 'opstaan, opbellen, afspreken and friends.' },
      { id: 's2-perfect', title: 'The perfect tense', description: 'Talking about what you did with hebben or zijn and a past participle.' },
      { id: 's2-simplepast', title: 'Common past forms', description: 'was, waren, had, ging and other high-frequency past forms.' },
      { id: 's2-work', title: 'Work schedules', description: 'Hours, meetings, responsibilities and days off.' },
      { id: 's2-home', title: 'Home and neighbourhood', description: 'Your area, what is nearby and reporting a problem at home.' },
      { id: 's2-travel', title: 'Travel problems', description: 'Delays, missed connections and lost items.' },
      { id: 's2-health', title: 'Health and help', description: 'Feeling ill, the GP, the pharmacy and emergencies.' },
      { id: 's2-shopissues', title: 'Shopping problems', description: 'Sizes, exchanges and returns.' },
      { id: 's2-pref', title: 'Preferences and reasons', description: 'liever, het liefst, opinions with vinden, and omdat.' },
      { id: 's2-compare', title: 'Comparing', description: 'Comparatives, superlatives and even ... als.' },
      { id: 's2-connect', title: 'Connected sentences', description: 'dat, als, and putting events in order.' },
      { id: 's2-info', title: 'Asking for information', description: 'Indirect questions and polite information requests.' },
      { id: 's2-notices', title: 'Notices and instructions', description: 'Imperatives and the signs you see every day.' },
      { id: 's2-write', title: 'Messages and emails', description: 'Informal messages and simple formal emails.' },
      { id: 's2-check', title: 'Stage 2 checkpoints', description: 'Cumulative checks on past, plans, problems and connected language.' },
    ],
  },
  {
    id: 's3',
    level: 'a2',
    title: 'Stage 3 · A2 communication',
    objective:
      'Handle routine everyday communication using frequent expressions and simple connected language.',
    modules: [
      { id: 's3-listen', title: 'Announcements and conversations', description: 'Station and shop announcements, phone calls and overheard conversations.' },
      { id: 's3-read', title: 'Everyday texts', description: 'Timetables, adverts, notices and messages.' },
      { id: 's3-describe', title: 'Describing in more detail', description: 'People, places and routines in connected sentences.' },
      { id: 's3-experience', title: 'Experiences and plans', description: 'What you have done, what happened and what you plan to do.' },
      { id: 's3-service', title: 'Service situations', description: 'The gemeente, post office, phone appointments, reservations and the doctor.' },
      { id: 's3-problems', title: 'Problems and requests', description: 'Explaining what is wrong, complaining politely and asking for help.' },
      { id: 's3-opinion', title: 'Opinions and reasons', description: 'Giving an opinion, agreeing, disagreeing and explaining why.' },
      { id: 's3-work', title: 'Work and social life', description: 'Small talk, meetings, calling in sick and drinks with colleagues.' },
      { id: 's3-write', title: 'Practical writing', description: 'Notes, emails and replies that explain, sequence and give reasons.' },
      { id: 's3-convo', title: 'Conversation strategies', description: 'Checking understanding, repairing gaps and role plays with less support.' },
      { id: 's3-check', title: 'A2 checkpoints', description: 'Listening, reading, writing, conversation and a final cumulative check.' },
    ],
  },
];
