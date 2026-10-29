// Scenario packs (docs/topics-and-scenario-packs-plan.md, Phase T2): a real-life
// situation in 3–4 scene lessons beside the course path. Pure data: no React,
// no browser APIs.
import type { LessonDraft } from '../curriculum/types';

export type Pack = {
  /** kebab-case and permanent, e.g. 'huren': scenes are `sc-<id>-<scene>`, their items `sc-<id>-<scene>/<key>`. */
  id: string;
  /** 'Renting a home'. */
  title: string;
  /** One English line for the pack screen. */
  situation: string;
  /** Course module ids this pack is best after ("Best after: Stage 2 · Home and neighbourhood"). It never locks. */
  buildsOn: Array<string>;
  /** 3–4 scenes, played by the lesson player as they are, unlocked in order. */
  scenes: Array<LessonDraft>;
  /** "Do it for real": one task in the learner's own life. Learner-led, never assessed. */
  mission: string;
  /** What a newcomer gets wrong, in at most two sentences. */
  cultureNote?: string;
};
