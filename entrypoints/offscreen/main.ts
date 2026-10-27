// Offscreen document: plays clips for the in-page card, as the background worker asks.
import { createClipPlayer } from '../../src/extension/clip-player';
import { isExtensionMessage, type ClipReply } from '../../src/extension/messages';
import type { PublicPath } from 'wxt/browser';

const player = createClipPlayer((path) => browser.runtime.getURL(`/${path}` as PublicPath));

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) return;
  if (message.type === 'tn:offscreen-play') {
    player.play(message.path, message.rate).then(
      () => sendResponse({ ok: true } satisfies ClipReply),
      (error: unknown) => sendResponse({ ok: false, error: String(error) } satisfies ClipReply),
    );
    return true;
  }
  if (message.type === 'tn:offscreen-stop') player.stop();
});
