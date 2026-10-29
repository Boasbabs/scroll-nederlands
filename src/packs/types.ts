// Scenario packs (docs/topics-and-scenario-packs-plan.md, Phase T2): a real-life
// situation in 3–4 scene lessons beside the course path. Pure data: no React,
// no browser APIs.
import type { LessonDraft } from '../curriculum/types';

/**
 * A situation (renting a home) is the pack format: scenes, a text, a listening
 * task, writing and a mission. A set is a short list of words around one trap
 * (false friends) in the same scene lessons, without the situation's parts.
 */
export type PackKind = 'situation' | 'set';

export type Pack = {
  /** kebab-case and permanent, e.g. 'huren': scenes are `sc-<id>-<scene>`, their items `sc-<id>-<scene>/<key>`. */
  id: string;
  /** A situation when left out. */
  kind?: PackKind;
  /** 'Renting a home'. */
  title: string;
  /** One English line for the pack screen. */
  situation: string;
  /** Course module ids this pack is best after ("Best after: Stage 2 · Home and neighbourhood"). It never locks. A set may have none. */
  buildsOn: Array<string>;
  /** 3–4 scenes, played by the lesson player as they are, unlocked in order. */
  scenes: Array<LessonDraft>;
  /** "Do it for real": one task in the learner's own life. Learner-led, never assessed. Every situation has one; a set may not. */
  mission?: string;
  /** What a newcomer gets wrong, in at most two sentences. */
  cultureNote?: string;
  /**
   * A set's words that the course, the word track or another pack already
   * teaches, by full item id ("w-adjectives/slim"). Its scenes practise them by
   * id; its page lists and practises them with its own items.
   */
  shared?: Array<string>;
};
