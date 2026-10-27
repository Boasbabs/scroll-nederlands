// In-memory stand-ins for chrome.storage.local and chrome.permissions, so the
// panel and the in-page card run in a normal tab.
import { completeLesson } from '../src/engine/progress';
import { exerciseSteps, planLesson } from '../src/engine/plan';
import { DAY } from '../src/engine/schedule';
import { emptyProgress } from '../src/engine/types';
import { course } from '../src/curriculum';
import { createStore, defaultPreferences, STORAGE_KEYS, type StorageAreaLike } from '../src/storage/store';
import type { SitePermissions } from '../src/ui/env';
import type { SiteId } from '../src/sites';

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
 * `caughtup`, `path` or `recall`. With `lessonId`, every lesson before it is done, so
 * it is next on the path.
 */
export async function seed(area: StorageAreaLike, state: string, now: number, lessonId?: string | null) {
  if (state === 'fresh') return;
  const target = lessonId ? course.lesson(lessonId) : undefined;
  const lessonCount = target ? target.order : state === 'path' ? 40 : 9;
  let progress = emptyProgress();
  const at = state === 'caughtup' ? now - 2 * 60 * 60_000 : now - 2 * DAY;
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
  progress.days[new Date(now - DAY).toISOString().slice(0, 10)] = 12;
  await area.set({
    [STORAGE_KEYS.progress]: progress,
    [STORAGE_KEYS.prefs]: { ...defaultPreferences(), onboarded: true, sites: { x: true, linkedin: false } },
  });
}

export function fakePermissions(): SitePermissions {
  const granted: Record<SiteId, boolean> = { x: true, linkedin: false };
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
