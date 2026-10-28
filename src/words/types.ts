// The basic-word track: 625 everyday words learned beside the course
// (docs/fluent-forever-plan.md). Pure data: no React, no browser APIs.

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'other';

/** A word the course does not teach. Nouns carry their article: "de vork", "het mes". */
export type NewWord = {
  /** Unique within its theme, kebab-case. With the theme it forms the permanent id `w-<theme>/<key>`. */
  key: string;
  dutch: string;
  english: string;
  pos: PartOfSpeech;
  /** A noun used in the plural (always de), e.g. "de hersenen". */
  plural?: boolean;
  /** Other correct Dutch forms accepted when typed. */
  accept?: Array<string>;
  /** One short usage note shown with the word. */
  note?: string;
};

/** A basic word the course already teaches, found by its Dutch text ("de keuken"). */
export type CourseWord = { ref: string };

export type WordEntry = NewWord | CourseWord;

export type WordTheme = {
  /** kebab-case, e.g. "kitchen". */
  id: string;
  title: string;
  /** Most useful first: introduction follows this order within the theme. */
  words: Array<WordEntry>;
};
