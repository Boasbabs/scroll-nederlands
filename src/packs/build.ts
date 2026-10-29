// Shorthand for pack items: noun('het loket', 'the counter'), phrase('wat-meenemen', 'Wat moet ik meenemen?', …).
// Keys are permanent: they make the item id `sc-<pack>-<scene>/<key>`.
import { withoutArticle } from '../articles/assemble';
import type { ItemKind, LearningItemDraft } from '../curriculum/types';
import { keyFor } from '../words/build';

type Extra = Partial<Pick<LearningItemDraft, 'key' | 'accept' | 'note' | 'plural'>>;

/** A noun with its article and "the" in English. Typed without the article it still counts: the de/het drill asks that apart. */
export function noun(dutch: string, english: string, { accept = [], ...extra }: Extra = {}): LearningItemDraft {
  return { key: keyFor(dutch), dutch, english, kind: 'word', accept: [withoutArticle(dutch), ...accept], ...extra };
}

/** A single word that is not a noun: a verb, an adjective, a set phrase used as one word ("bezwaar maken"). */
export function word(dutch: string, english: string, extra: Extra = {}): LearningItemDraft {
  return { key: keyFor(dutch), dutch, english, kind: 'word', ...extra };
}

function chunk(kind: ItemKind) {
  return (key: string, dutch: string, english: string, extra: Omit<Extra, 'key'> = {}): LearningItemDraft => ({ key, dutch, english, kind, ...extra });
}

/** A reusable sentence: "Wat moet ik meenemen?" */
export const phrase = chunk('phrase');
/** A sentence frame worth reusing with other words: "Ik wil me inschrijven op dit adres." */
export const pattern = chunk('pattern');
