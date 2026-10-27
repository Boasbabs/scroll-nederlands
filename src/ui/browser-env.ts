import { browser } from 'wxt/browser';
import { speaker } from '../audio';
import { createLearningActions } from '../learning/actions';
import { SITES, type SiteId } from '../sites';
import { createLearningStore, STORAGE_KEYS } from '../storage/store';
import type { LearningEnv, SiteAccess } from './env';

const watchedKeys: Array<string> = [STORAGE_KEYS.progress, STORAGE_KEYS.preferences];

function subscribe(listener: () => void): () => void {
  const handler = (changes: Record<string, unknown>, area: string) => {
    if (area === 'local' && watchedKeys.some((key) => key in changes)) listener();
  };
  browser.storage.onChanged.addListener(handler);
  return () => browser.storage.onChanged.removeListener(handler);
}

function originsFor(site: SiteId): Array<string> {
  return [...SITES.find((s) => s.id === site)!.origins];
}

const sites: SiteAccess = {
  async status() {
    const entries = await Promise.all(
      SITES.map(async (site) => [site.id, await browser.permissions.contains({ origins: [...site.origins] })] as const),
    );
    return Object.fromEntries(entries) as Record<SiteId, boolean>;
  },
  // Must run from a click handler: Chrome only shows the permission prompt on a user gesture.
  request: (site) => browser.permissions.request({ origins: originsFor(site) }).catch(() => false),
  revoke: (site) => browser.permissions.remove({ origins: originsFor(site) }).catch(() => false),
};

export function createBrowserEnv(extra: Partial<LearningEnv> = {}): LearningEnv {
  const store = createLearningStore(browser.storage.local);
  return {
    store,
    actions: createLearningActions(store),
    speaker,
    subscribe,
    now: () => Date.now(),
    sites,
    ...extra,
  };
}
