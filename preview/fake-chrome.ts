// In-memory stand-ins for chrome.storage.local and chrome.permissions, so the
// panel and the in-page card run in a normal tab.
import { findCorrections } from '../src/corrections/diff';
import type { Correction, Draft } from '../src/corrections/types';
import { completeLesson, dayKey } from '../src/engine/progress';
import { exerciseSteps, planLesson } from '../src/engine/plan';
import { DAY } from '../src/engine/schedule';
import { emptyProgress, type ItemProgress } from '../src/engine/types';
import { course } from '../src/curriculum';
import { createStore, defaultPreferences, STORAGE_KEYS, type StorageAreaLike } from '../src/storage/store';
import type { SitePermissions } from '../src/ui/env';
import { siteRecord } from '../src/sites';

export function createPreviewArea() {
  const data = new Map<string, string>();
  const listeners = new Set<() => void>();
  const area: StorageAreaLike = {
    async get(keys) {
      return Object.fromEntries(keys.filter((key) => data.has(key)).map((key) => [key, JSON.parse(data.get(key)!)]));
    },
    async set(items) {
      for (const [key, value] of Object.entries(items)) data.set(key, JSON.stringify(value));
      for (const listener of listeners) listener();
    },
  };
  return {
    area,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Seeds a learner: `fresh` (onboarding), `today` (lessons done, reviews due),
 * `caughtup`, `streak` (as `today`, but studied yesterday, so a session today grows the streak),
 * `backup` (as `today`, with practice on two more days, so Today reminds the learner to back up),
 * `path`, `recall`, `pictures`, `articles`, `notes` or `corrections`. With `lessonId`, every lesson before it is done, so
 * it is next on the path.
 */
export async function seed(area: StorageAreaLike, state: string, now: number, lessonId?: string | null) {
  if (state === 'fresh') return;
  const target = lessonId ? course.lesson(lessonId) : undefined;
  const lessonCount = target ? target.order : state === 'path' ? 40 : 9;
  let progress = emptyProgress();
  const at = state === 'caughtup' ? now - 2 * 60 * 60_000 : state === 'streak' ? now - DAY : now - 2 * DAY;
  for (const [i, lesson] of course.lessons.slice(0, lessonCount).entries()) {
    const results = exerciseSteps(planLesson(course, lesson.id, 'focused')).map((planned, j) => ({
      exerciseId: planned.exerciseId,
      stage: planned.exercise.stage,
      itemIds: planned.itemIds,
      correct: (i + j) % 5 !== 0,
    }));
    progress = completeLesson(progress, course, lesson.id, results, 'focused', at + i * 60_000);
  }
  // `recall`: every item is due for unaided recall (its next exercise stage), so reviews show recall cards.
  if (state === 'recall') {
    for (const item of Object.values(progress.items)) Object.assign(item, { stage: 'supportedRecall', relearning: false, dueAt: now - 60_000 });
  }
  if (state === 'caughtup') {
    for (const item of Object.values(progress.items)) item.dueAt = now + 3 * 60 * 60_000 + Math.random() * DAY;
  }
  const met = (stage: ItemProgress['stage'], dueAt: number, history = 0): ItemProgress => ({
    stage, step: 1, relearning: false, dueAt, introducedAt: now - 3 * DAY, lastPracticedAt: now - 3 * DAY, correct: 2, incorrect: 0, lapses: 0,
    history: Array.from({ length: history }, () => ({ at: now - 3 * DAY, correct: true, exerciseId: 'seed', stage: 'recognition', mode: 'focused' })),
  });
  // `pictures`: the bundled kitchen pictures are due first (picture choice, picture + hint, picture recall card),
  // and every other basic word is met, so the next new words are the pictured "de appel" and "de kat".
  if (state === 'pictures') {
    for (const item of course.words) if (!progress.items[item.id]) progress.items[item.id] = met('supportedRecall', now + 5 * DAY);
    delete progress.items['w-fruit-veg/appel'];
    delete progress.items['w-animals/kat'];
    progress.items['w-kitchen/vork'] = met('introduced', now - 6 * DAY, 1);
    progress.items['w-kitchen/mes'] = met('recognition', now - 5 * DAY);
    progress.items['w-kitchen/lepel'] = met('supportedRecall', now - 4 * DAY);
  }
  // `articles`: every basic word is met but "het glas" and "de kat" (the next new words: the het image is
  // picked on the glass). De or het for the pictured knife and fork is due first; opening the panel
  // lets ten more nouns catch up.
  if (state === 'articles') {
    for (const item of course.words) if (!progress.items[item.id]) progress.items[item.id] = met('supportedRecall', now + 5 * DAY);
    delete progress.items['w-kitchen/glas'];
    delete progress.items['w-animals/kat'];
    progress.items['w-kitchen/mes#article'] = met('introduced', now - 6 * DAY);
    progress.items['w-kitchen/vork#article'] = met('recognition', now - 5 * DAY);
  }
  // `notes`: every basic word is met. Due first: the fork, missed three times before (a miss now offers
  // "Make it yours"), the spoon with a note that uses it (fill the gap in your note), and the knife with a
  // note that does not (a cue on the recall card).
  const notes: Record<string, { text: string; at: number }> = {};
  if (state === 'notes') {
    for (const item of course.words) if (!progress.items[item.id]) progress.items[item.id] = met('supportedRecall', now + 5 * DAY);
    progress.items['w-kitchen/vork'] = { ...met('introduced', now - 6 * DAY), lapses: 3 };
    progress.items['w-kitchen/lepel'] = met('recognition', now - 5 * DAY);
    progress.items['w-kitchen/mes'] = met('supportedRecall', now - 4 * DAY);
    notes['w-kitchen/lepel'] = { text: 'Ik eet elke ochtend yoghurt met een lepel.', at: now - 3 * DAY };
    notes['w-kitchen/mes'] = { text: 'The red knife from my first flat', at: now - 3 * DAY };
  }
  // `corrections`: one text waits for its correction on the Review tab, and a correction made two days
  // ago is the first review (its fill-the-gap).
  const drafts: Record<string, Draft> = {};
  const custom: Record<string, Correction> = {};
  if (state === 'corrections') {
    const draft: Draft = { id: 'd-preview', text: 'Hoi Sanne, ik ben morgen niet op de werk want ik heb een afspraak bij de tandarts.', prompt: 'Tell your colleague you will not be in tomorrow.', exerciseId: 'preview', at: now - DAY };
    drafts[draft.id] = draft;
    for (const correction of findCorrections('Ik ben gisteren tot zes uur gewerkt.', 'Ik heb gisteren tot zes uur gewerkt.', now - 2 * DAY)) {
      custom[correction.id] = correction;
      progress.items[correction.id] = { ...met('introduced', now - 3 * DAY), introducedAt: now - 2 * DAY };
    }
  }
  progress.days[new Date(now - DAY).toISOString().slice(0, 10)] = 12;
  if (state === 'backup') for (const daysAgo of [3, 4]) progress.days[dayKey(now - daysAgo * DAY)] = 8;
  await area.set({
    [STORAGE_KEYS.progress]: progress,
    [STORAGE_KEYS.prefs]: { ...defaultPreferences(), onboarded: true, sites: siteRecord(['x', 'youtube']) },
    [STORAGE_KEYS.notes]: notes,
    [STORAGE_KEYS.drafts]: drafts,
    [STORAGE_KEYS.custom]: custom,
  });
}

export function fakePermissions(): SitePermissions {
  const granted = siteRecord(['x', 'youtube']);
  return {
    async request(sites) {
      for (const site of sites) granted[site] = true;
      return true;
    },
    async granted() {
      return { ...granted };
    },
    async revoke(sites) {
      for (const site of sites) granted[site] = false;
    },
  };
}

export { createStore };
