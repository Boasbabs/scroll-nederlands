// Scenario pack validation (docs/topics-and-scenario-packs-plan.md, Phase T2):
// ids, one home per word, articles, the pack format and the lesson rules.
// Used by tests/packs.
import { articleOf } from '../articles/assemble';
import { exerciseItemIds, type CurriculumIndex } from '../curriculum/assemble';
import { EXERCISE_STAGES } from '../curriculum/types';
import { exerciseIssues } from '../curriculum/validate';
import { normalizeAnswer } from '../engine/answers';
import { bareWord, WORDS_STAGE } from '../words/assemble';
import { isSet, packModuleId } from './assemble';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The pack format: scenes per pack, and items across them. */
export const PACK_SCENES = { min: 3, max: 4 } as const;
export const PACK_MIN_ITEMS = 20;

function blank(text: string | undefined): boolean {
  return !text || text.trim().length === 0;
}

/**
 * Every problem in the index's packs, as "location: message". An empty list
 * means they are valid. The index's course and word track are the reference
 * for "one home per word".
 */
export function validatePacks(index: CurriculumIndex): Array<string> {
  const issues: Array<string> = [];
  const taught = new Map<string, string>();
  // The course and the word track come first: a pack never teaches what they do.
  for (const item of [...index.lessons.flatMap((lesson) => lesson.items), ...index.items.filter((entry) => entry.stageId === WORDS_STAGE)]) {
    if (!taught.has(bareWord(item.dutch))) taught.set(bareWord(item.dutch), item.id);
  }
  const modules = new Set(index.curriculum.stages.flatMap((stage) => stage.modules.map((module) => module.id)));
  const courseLessons = new Set(index.lessons.map((lesson) => lesson.id));
  const themes = new Set(index.themes.map((theme) => theme.id));
  const packIds = new Set<string>();
  const sceneIds = new Set<string>();

  for (const pack of index.packs) {
    const at = pack.id;
    if (!KEBAB.test(pack.id) || packIds.has(pack.id)) issues.push(`${at}: pack id must be kebab-case and unique`);
    // The Topics tab opens a pack or a word theme by id.
    if (themes.has(pack.id)) issues.push(`${at}: pack id is also a word theme`);
    packIds.add(pack.id);
    const set = isSet(pack);
    for (const field of ['title', 'situation'] as const) {
      if (blank(pack[field])) issues.push(`${at}: empty ${field}`);
    }
    // A set may go without a mission, but not with an empty one.
    if (set ? pack.mission !== undefined && blank(pack.mission) : blank(pack.mission)) issues.push(`${at}: empty mission`);
    if (pack.cultureNote !== undefined && (blank(pack.cultureNote) || pack.cultureNote.split(/(?<=[.!?])\s+/).length > 2)) {
      issues.push(`${at}: the culture note needs one or two sentences`);
    }
    if (!set && pack.buildsOn.length === 0) issues.push(`${at}: builds on no course module`);
    for (const module of pack.buildsOn) {
      if (!modules.has(module)) issues.push(`${at}: builds on unknown module ${module}`);
    }
    if (pack.scenes.length < PACK_SCENES.min || pack.scenes.length > PACK_SCENES.max) {
      issues.push(`${at}: needs ${PACK_SCENES.min} to ${PACK_SCENES.max} scenes`);
    }
    const exercises = pack.scenes.flatMap((scene) => scene.exercises);
    // The situation's parts. A set is a short list of words around one trap, in scenes that keep the lesson rules.
    if (!set) {
      if (pack.items.length < PACK_MIN_ITEMS) issues.push(`${at}: needs at least ${PACK_MIN_ITEMS} items (has ${pack.items.length})`);
      if (!exercises.some((exercise) => exercise.listenOnly)) issues.push(`${at}: needs a listening exercise (listenOnly)`);
      if (!exercises.some((exercise) => exercise.passage)) issues.push(`${at}: needs a real-life text (passage)`);
      if (!exercises.some((exercise) => exercise.kind === 'write')) issues.push(`${at}: needs a writing exercise`);
      if (pack.shared?.length) issues.push(`${at}: only a set lists shared words`);
    }
    const practised = new Set(exercises.flatMap((exercise) => exercise.items ?? []));
    for (const id of new Set(pack.shared)) {
      const item = index.item(id);
      if (!item || item.moduleId === packModuleId(pack.id)) issues.push(`${at}: shared word ${id} is not taught by the course, the word track or another pack`);
      else if (!practised.has(id)) issues.push(`${at}: no scene practises the shared word ${id}`);
    }
    if (pack.shared && new Set(pack.shared).size !== pack.shared.length) issues.push(`${at}: a shared word is listed twice`);

    const earlierScenes = new Set<string>();
    for (const scene of pack.scenes) {
      const where = scene.id;
      if (!KEBAB.test(scene.id) || !scene.id.startsWith(`${packModuleId(pack.id)}-`)) {
        issues.push(`${where}: scene id must be kebab-case and start with ${packModuleId(pack.id)}-`);
      }
      if (sceneIds.has(scene.id) || courseLessons.has(scene.id)) issues.push(`${where}: duplicate lesson id`);
      sceneIds.add(scene.id);
      if (scene.kind === 'checkpoint') issues.push(`${where}: a scene is a core or practice lesson`);
      for (const field of ['title', 'objective', 'situation', 'targetPhrase', 'meaningEn'] as const) {
        if (blank(scene[field])) issues.push(`${where}: empty ${field}`);
      }
      if (scene.skills.length === 0) issues.push(`${where}: no skills`);
      if (scene.items.length === 0) issues.push(`${where}: teaches no items`);
      // Scenes open in order within the pack, never by course prerequisites.
      if (scene.prerequisites?.length) issues.push(`${where}: scenes have no prerequisites`);
      for (const ref of scene.revisits ?? []) {
        if (!courseLessons.has(ref) && !earlierScenes.has(ref)) issues.push(`${where}: revisit ${ref} is not a course lesson or an earlier scene`);
      }

      const keys = new Set<string>();
      for (const item of scene.items) {
        if (!KEBAB.test(item.key) || keys.has(item.key)) issues.push(`${item.id}: item key must be kebab-case and unique in its scene`);
        keys.add(item.key);
        if (blank(item.dutch) || blank(item.english)) issues.push(`${item.id}: item needs Dutch and English`);
        if (item.dutch !== item.dutch.trim() || item.english !== item.english.trim()) issues.push(`${item.id}: stray spaces`);
        if (item.accept?.some(blank)) issues.push(`${item.id}: empty accepted answer`);
        const word = bareWord(item.dutch);
        const home = taught.get(word);
        if (home) issues.push(`${item.id}: "${item.dutch}" is already taught by ${home}`);
        else taught.set(word, item.id);
        // Nouns carry their article, and an English noun its "the": "de huurder", "the tenant".
        if (item.kind === 'word') {
          const article = articleOf(item.dutch) !== undefined;
          const noun = /^the /i.test(item.english);
          if (noun && !article) issues.push(`${item.id}: a noun needs de or het`);
          if (article && !noun) issues.push(`${item.id}: a noun's English starts with "the"`);
          if (item.plural && !normalizeAnswer(item.dutch).startsWith('de ')) issues.push(`${item.id}: plurals take de`);
        }
      }

      let lastStage = 0;
      const exerciseIds = new Set<string>();
      for (const exercise of scene.exercises) {
        if (exerciseIds.has(exercise.id)) issues.push(`${where}/${exercise.id}: duplicate exercise id`);
        exerciseIds.add(exercise.id);
        issues.push(...exerciseIssues(scene, exercise));
        const stage = EXERCISE_STAGES.indexOf(exercise.stage);
        if (stage < lastStage) issues.push(`${where}/${exercise.id}: exercises are not in stage order`);
        lastStage = Math.max(lastStage, stage);
        const itemIds = exerciseItemIds(scene, exercise);
        if (itemIds.length === 0) issues.push(`${where}/${exercise.id}: practises no learning item`);
        for (const itemId of itemIds) {
          const item = index.item(itemId);
          // Its own items, an earlier scene's, or by full id what the course, the word track or another pack teaches.
          const taughtSomewhere = item !== undefined && (item.stageId === WORDS_STAGE || index.lesson(item.lessonId) !== undefined);
          const later = item?.moduleId === scene.moduleId && item.lessonId !== scene.id && !earlierScenes.has(item.lessonId);
          if (!taughtSomewhere || later) {
            issues.push(`${where}/${exercise.id}: item ${itemId} is not taught by this scene, an earlier one, the course or the word track`);
          }
        }
      }
      for (const stage of EXERCISE_STAGES) {
        if (!scene.exercises.some((exercise) => exercise.stage === stage)) issues.push(`${where}: no ${stage} exercise`);
      }
      if (!scene.exercises.some((exercise) => !exercise.focusedOnly)) issues.push(`${where}: needs at least one exercise that fits a browsing break`);
      earlierScenes.add(scene.id);
    }
  }
  return issues;
}
