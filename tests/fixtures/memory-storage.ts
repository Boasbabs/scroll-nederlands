import type { StorageAreaLike } from '../../src/storage/store';

/** In-memory stand-in for chrome.storage.local (values are deep-copied like the real API). */
export function createMemoryArea(): StorageAreaLike & { dump(): Record<string, unknown> } {
  const data = new Map<string, string>();
  return {
    async get(keys) {
      return Object.fromEntries(keys.filter((key) => data.has(key)).map((key) => [key, JSON.parse(data.get(key)!)]));
    },
    async set(items) {
      for (const [key, value] of Object.entries(items)) data.set(key, JSON.stringify(value));
    },
    async remove(keys) {
      for (const key of keys) data.delete(key);
    },
    dump() {
      return Object.fromEntries([...data].map(([key, value]) => [key, JSON.parse(value)]));
    },
  };
}
