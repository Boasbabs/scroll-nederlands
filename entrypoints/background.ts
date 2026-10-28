// The background worker: opens the side panel, keeps the in-page script registered
// for the granted sites, plays clips for the in-page card in an offscreen document,
// and hands the card its pictures as data URLs.
import type { PublicPath } from 'wxt/browser';
import { isExtensionMessage } from '../src/extension/messages';
import { createOffscreenRelay } from '../src/extension/offscreen';
import { CONTENT_SCRIPT_FILE, CONTENT_SCRIPT_ID, createRegistrationSync } from '../src/extension/registration';
import { createIndexedDbPictures } from '../src/images/own';
import { answerPicture } from '../src/images/pictures';

const OFFSCREEN_PATH = '/offscreen.html';

export default defineBackground(() => {
  void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);

  const registration = createRegistrationSync({
    grantedOrigins: async () => (await browser.permissions.getAll()).origins ?? [],
    registered: async () => (await browser.scripting.getRegisteredContentScripts({ ids: [CONTENT_SCRIPT_ID] }))[0],
    register: (script) => browser.scripting.registerContentScripts([script]),
    update: (matches) => browser.scripting.updateContentScripts([{ id: CONTENT_SCRIPT_ID, matches, js: [CONTENT_SCRIPT_FILE] }]),
    unregister: () => browser.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] }),
    tabsMatching: async (origins) =>
      (await browser.tabs.query({ url: origins })).map((tab) => tab.id).filter((id): id is number => id !== undefined),
    inject: (tabId) => browser.scripting.executeScript({ target: { tabId }, files: [`/${CONTENT_SCRIPT_FILE}`] }),
  });
  browser.runtime.onInstalled.addListener(({ reason }) => {
    // After an update the old script in open tabs has stopped, so start the new one there.
    void registration.run(reason === 'install' || reason === 'update' ? 'all' : 'none');
  });
  browser.runtime.onStartup.addListener(() => void registration.run());
  browser.permissions.onAdded.addListener(({ origins }) => void registration.run(origins ?? []));
  browser.permissions.onRemoved.addListener(() => void registration.run());

  const audio = createOffscreenRelay({
    hasDocument: async () =>
      (
        await browser.runtime.getContexts({
          contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
          documentUrls: [browser.runtime.getURL(OFFSCREEN_PATH)],
        })
      ).length > 0,
    createDocument: () =>
      browser.offscreen.createDocument({
        url: OFFSCREEN_PATH,
        reasons: [browser.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'Plays the Dutch audio clips for the practice card on the sites the learner picked.',
      }),
    send: (message) => browser.runtime.sendMessage(message),
  });

  const ownPictures = createIndexedDbPictures(indexedDB);
  const readImage = async (file: string) => (await fetch(browser.runtime.getURL(`/images/${file}` as PublicPath))).blob();

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isExtensionMessage(message)) return;
    if (message.type === 'tn:picture') {
      void answerPicture(ownPictures, readImage, message.itemId, message.file).then(sendResponse);
      return true;
    }
    if (message.type === 'tn:open-side-panel') {
      const tabId = sender.tab?.id;
      if (tabId === undefined) return;
      // No await before open(): the click in the card is the user gesture Chrome requires
      // (as in Chrome's cookbook.sidepanel-open sample).
      browser.sidePanel.open({ tabId }).catch(() => browser.tabs.create({ url: browser.runtime.getURL('/sidepanel.html') }));
      return;
    }
    if (message.type === 'tn:play-clip') {
      void audio.play(message.path, message.rate).then(sendResponse);
      return true;
    }
    if (message.type === 'tn:stop-clip') void audio.stop();
  });
});
