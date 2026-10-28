// Messages between the in-page card, the background worker and the offscreen document.

export type ExtensionMessage =
  /** From the card: open the side panel (sent inside the click, so Chrome sees the user gesture). */
  | { type: 'tn:open-side-panel' }
  /** From the card: play a bundled clip; the reply comes when it has finished. */
  | { type: 'tn:play-clip'; path: string; rate: number }
  | { type: 'tn:stop-clip' }
  /** From the background worker to the offscreen document. */
  | { type: 'tn:offscreen-play'; path: string; rate: number }
  | { type: 'tn:offscreen-stop' }
  /**
   * From the card: an item's picture as a data URL, so no image is exposed to
   * the site. `file` is the bundled picture to fall back on (public/images/).
   */
  | { type: 'tn:picture'; itemId: string; file?: string };

export type ClipReply = { ok: true } | { ok: false; error: string };

export type PictureReply = { ok: true; src: string; own: boolean } | { ok: false };

const TYPES = new Set(['tn:open-side-panel', 'tn:play-clip', 'tn:stop-clip', 'tn:offscreen-play', 'tn:offscreen-stop', 'tn:picture']);

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  return typeof value === 'object' && value !== null && TYPES.has((value as { type?: unknown }).type as string);
}

export function isClipReply(value: unknown): value is ClipReply {
  return typeof value === 'object' && value !== null && typeof (value as { ok?: unknown }).ok === 'boolean';
}

export function isPictureReply(value: unknown): value is PictureReply {
  if (typeof value !== 'object' || value === null) return false;
  const reply = value as { ok?: unknown; src?: unknown };
  return reply.ok === false || (reply.ok === true && typeof reply.src === 'string');
}
