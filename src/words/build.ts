// Shorthand for the word lists: noun('de vork', 'the fork'), course('de keuken').
import { stripAccents } from '../engine/answers';
import { bareWord } from './assemble';
import type { CourseWord, NewWord, PartOfSpeech } from './types';

type Extra = Partial<Pick<NewWord, 'key' | 'plural' | 'accept' | 'note' | 'example' | 'near' | 'articleCue'>>;

/** The permanent key: the word without article, accents or spaces ("het T-shirt" → "t-shirt"). */
export function keyFor(dutch: string): string {
  return stripAccents(bareWord(dutch))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function word(pos: PartOfSpeech) {
  return (dutch: string, english: string, extra: Extra = {}): NewWord => ({ key: keyFor(dutch), dutch, english, pos, ...extra });
}

export const noun = word('noun');
export const verb = word('verb');
export const adj = word('adjective');
export const other = word('other');

/** A basic word the course already teaches, by its Dutch text. */
export function course(ref: string): CourseWord {
  return { ref };
}
