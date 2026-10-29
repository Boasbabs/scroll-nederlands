// Finding an item's picture: the learner's own, else a bundled one, else none.
// An article item (de or het) shows its noun's picture.
import { nounIdOf } from '../articles/assemble';
import type { CurriculumIndex } from '../curriculum/assemble';
import type { ExtensionMessage, PictureReply } from '../extension/messages';
import { isPictureReply } from '../extension/messages';
import type { PictureIndex } from '../storage/store';
import { imageFor, type ImageManifest } from './manifest';
import type { OwnPictureBlobs } from './own';

export type Picture = { src: string; own: boolean };

/** What the UI shows and changes pictures with (UiEnv.pictures). */
export type PictureSource = {
  pictureFor(itemId: string): Promise<Picture | undefined>;
  /** Stores the learner's own picture for an item, made small first. Side panel only. */
  save?(itemId: string, image: Blob): Promise<void>;
  remove?(itemId: string): Promise<void>;
};

/** The bundled file for an item, by its Dutch. */
export function bundledFile(course: CurriculumIndex, images: ImageManifest, itemId: string): string | undefined {
  return imageFor(images, course.item(nounIdOf(itemId))?.dutch)?.file;
}

/** Whether an item has a picture to use as a cue, for the drill generator (DrillContext.hasPicture). */
export function pictureCheck(course: CurriculumIndex, images: ImageManifest, own: PictureIndex): (itemId: string) => boolean {
  return (itemId) => nounIdOf(itemId) in own || bundledFile(course, images, itemId) !== undefined;
}

export type PictureDeps = {
  course: CurriculumIndex;
  images: ImageManifest;
  blobs: OwnPictureBlobs;
  /** Keeps the list of items with own pictures (storage), which drills are planned from. */
  record: (itemId: string, at: number | undefined) => Promise<unknown>;
  /** Makes an image small before it is stored (downscaleToWebp in the browser). */
  downscale: (image: Blob) => Promise<Blob>;
  now?: () => number;
};

/** Pictures for extension pages: own ones from IndexedDB, bundled ones from /images/. */
export function createPictureSource(deps: PictureDeps): PictureSource {
  const urls = new Map<string, string>();
  function forget(itemId: string) {
    const url = urls.get(itemId);
    if (url) URL.revokeObjectURL(url);
    urls.delete(itemId);
  }
  return {
    async pictureFor(asked) {
      const itemId = nounIdOf(asked);
      const cached = urls.get(itemId);
      if (cached) return { src: cached, own: true };
      const own = await deps.blobs.get(itemId).catch(() => undefined);
      if (own) {
        const src = URL.createObjectURL(own);
        urls.set(itemId, src);
        return { src, own: true };
      }
      const file = bundledFile(deps.course, deps.images, itemId);
      return file ? { src: `/images/${file}`, own: false } : undefined;
    },
    async save(itemId, image) {
      const small = await deps.downscale(image);
      await deps.blobs.put(itemId, small);
      forget(itemId);
      await deps.record(itemId, (deps.now ?? Date.now)());
    },
    async remove(itemId) {
      await deps.blobs.delete(itemId);
      forget(itemId);
      await deps.record(itemId, undefined);
    },
  };
}

/** Pictures for the in-page card: the background worker replies with data URLs. */
export function createRemotePictures(course: CurriculumIndex, images: ImageManifest, send: (message: ExtensionMessage) => Promise<unknown>): PictureSource {
  return {
    async pictureFor(itemId) {
      const reply = await send({ type: 'tn:picture', itemId: nounIdOf(itemId), file: bundledFile(course, images, itemId) }).catch(() => undefined);
      return isPictureReply(reply) && reply.ok ? { src: reply.src, own: reply.own } : undefined;
    },
  };
}

/** A blob as a data URL, without FileReader (the background worker has none). */
export async function toDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${blob.type || 'image/webp'};base64,${btoa(binary)}`;
}

/** A picture's data URL (a backup's) as a blob again. Only plain raster images are taken. */
export function fromDataUrl(url: string): Blob | undefined {
  const match = /^data:(image\/(?:webp|png|jpeg|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(url);
  if (!match) return undefined;
  try {
    const binary = atob(match[2]!);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: match[1] });
  } catch {
    return undefined;
  }
}

/** Only plain file names in public/images/ can be asked for. */
const BUNDLED_FILE = /^[a-z0-9-]+\.webp$/;

/** The background worker's answer to tn:picture: the learner's own picture, else the bundled file. */
export async function answerPicture(
  blobs: OwnPictureBlobs,
  readFile: (file: string) => Promise<Blob>,
  itemId: string,
  file?: string,
): Promise<PictureReply> {
  try {
    const own = await blobs.get(nounIdOf(itemId));
    if (own) return { ok: true, src: await toDataUrl(own), own: true };
    if (file && BUNDLED_FILE.test(file)) return { ok: true, src: await toDataUrl(await readFile(file)), own: false };
  } catch {
    // No picture rather than a broken card.
  }
  return { ok: false };
}
