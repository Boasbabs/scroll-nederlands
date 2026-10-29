// The basic-word track: the 1,000 most useful everyday words beside the
// course, 625 in tier 1 (docs/fluent-forever-plan.md) and 375 in tier 2
// (docs/topics-and-scenario-packs-plan.md, Phase T6). Pure data: no React,
// no browser APIs.

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
  /** Other correct Dutch forms accepted when typed. A noun that takes de or het lists itself with the other article, so it gets no de/het item. */
  accept?: Array<string>;
  /** One short usage note shown with the word. */
  note?: string;
  /**
   * A sentence that uses the word as written (a noun with or without its
   * article), learned with the word and blanked out in its drills: Wyner's
   * way in for words a picture cannot show. Every tier-2 word has one.
   */
  example?: { dutch: string; english: string };
  /** Near-synonyms (their Dutch) never shown as this word's wrong options, nor it as theirs. */
  near?: Array<string>;
};

/** A basic word the course already teaches, found by its Dutch text ("de keuken"). */
export type CourseWord = { ref: string };

export type WordEntry = NewWord | CourseWord;

export type WordTheme = {
  /** kebab-case, e.g. "kitchen". */
  id: string;
  title: string;
  /**
   * 1: the 625 basic words (when left out). 2: words 626–1,000, which the
   * mixed list starts once most of tier 1 is met (TIER_TWO_AFTER).
   */
  tier?: 1 | 2;
  /** Most useful first: introduction follows this order within the theme. */
  words: Array<WordEntry>;
};
