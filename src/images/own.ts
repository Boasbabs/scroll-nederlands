// The learner's own pictures: small WebP blobs in IndexedDB, keyed by item id.
// Extension pages (side panel, background worker) share one IndexedDB; the
// in-page card asks the background worker, because a host page has its own.

export type OwnPictureBlobs = {
  get(itemId: string): Promise<Blob | undefined>;
  put(itemId: string, image: Blob): Promise<void>;
  delete(itemId: string): Promise<void>;
};

const DB_NAME = 'taalnudge';
const STORE = 'pictures';

export function createIndexedDbPictures(factory: IDBFactory): OwnPictureBlobs {
  let opened: Promise<IDBDatabase> | undefined;
  function db(): Promise<IDBDatabase> {
    opened ??= new Promise((resolve, reject) => {
      const open = factory.open(DB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(STORE);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => {
        opened = undefined;
        reject(open.error);
      };
    });
    return opened;
  }

  /** Resolves once the transaction has committed, so a saved picture survives the page closing. */
  async function transact<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const transaction = (await db()).transaction(STORE, mode);
    const request = work(transaction.objectStore(STORE));
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  return {
    async get(itemId) {
      const value: unknown = await transact('readonly', (store) => store.get(itemId));
      return value instanceof Blob ? value : undefined;
    },
    async put(itemId, image) {
      await transact('readwrite', (store) => store.put(image, itemId));
    },
    async delete(itemId) {
      await transact('readwrite', (store) => store.delete(itemId));
    },
  };
}

/** For tests, and for pages without IndexedDB. */
export function createMemoryPictures(): OwnPictureBlobs {
  const blobs = new Map<string, Blob>();
  return {
    get: async (itemId) => blobs.get(itemId),
    put: async (itemId, image) => void blobs.set(itemId, image),
    delete: async (itemId) => void blobs.delete(itemId),
  };
}
