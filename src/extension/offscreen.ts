// The background worker's side of clip playback for the in-page card. Host pages
// can block extension media with their CSP, so clips play in an offscreen document.
import type { ClipReply, ExtensionMessage } from './messages';

export type OffscreenDeps = {
  /** An offscreen document is open (Chrome closes it after 30 s without audio). */
  hasDocument: () => Promise<boolean>;
  createDocument: () => Promise<void>;
  send: (message: ExtensionMessage) => Promise<unknown>;
  wait?: (ms: number) => Promise<void>;
};

const RETRIES = 3;

export function createOffscreenRelay(deps: OffscreenDeps) {
  const wait = deps.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let creating: Promise<void> | undefined;

  async function ensureDocument() {
    if (await deps.hasDocument()) return;
    // Two clips asked for at once must not open two documents (Chrome allows one).
    creating ??= deps.createDocument().finally(() => {
      creating = undefined;
    });
    await creating;
  }

  async function play(path: string, rate: number): Promise<ClipReply> {
    try {
      await ensureDocument();
      for (let attempt = 0; ; attempt++) {
        try {
          const reply = await deps.send({ type: 'tn:offscreen-play', path, rate });
          return (reply as ClipReply | undefined) ?? { ok: false, error: 'No reply from the offscreen document' };
        } catch (error) {
          // A new document may not be listening yet.
          if (attempt >= RETRIES) throw error;
          await wait(50 * (attempt + 1));
        }
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async function stop() {
    if (await deps.hasDocument()) await deps.send({ type: 'tn:offscreen-stop' }).catch(() => undefined);
  }

  return { play, stop };
}
