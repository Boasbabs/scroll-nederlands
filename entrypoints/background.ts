import { ALL_SITE_ORIGINS } from '../src/sites';

const SCRIPT_ID = 'taalnudge-prompt';
const SCRIPT_FILE = '/content-scripts/content.js' as const;

/** Register the prompt script for exactly the sites the learner has granted. */
async function syncContentScripts() {
  const granted = (await browser.permissions.getAll()).origins ?? [];
  const matches = ALL_SITE_ORIGINS.filter((origin) => granted.includes(origin));
  const existing = await browser.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (existing.length > 0) await browser.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  if (matches.length === 0) return;

  await browser.scripting.registerContentScripts([
    { id: SCRIPT_ID, matches, js: [SCRIPT_FILE.slice(1)], runAt: 'document_idle', persistAcrossSessions: true },
  ]);
  // Tabs that were already open get the script now instead of after a reload.
  for (const tab of await browser.tabs.query({ url: matches })) {
    if (tab.id === undefined) continue;
    await browser.scripting.executeScript({ target: { tabId: tab.id }, files: [SCRIPT_FILE] }).catch(() => undefined);
  }
}

export default defineBackground(() => {
  void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);

  browser.runtime.onInstalled.addListener(() => void syncContentScripts());
  browser.runtime.onStartup.addListener(() => void syncContentScripts());
  browser.permissions.onAdded.addListener(() => void syncContentScripts());
  browser.permissions.onRemoved.addListener(() => void syncContentScripts());

  browser.runtime.onMessage.addListener((message: unknown, sender) => {
    if ((message as { type?: string })?.type !== 'open-practice') return;
    const tab = sender.tab;
    // sidePanel.open needs the user gesture that sent this message, so call it right away.
    const opened = tab?.windowId !== undefined ? browser.sidePanel.open({ windowId: tab.windowId }) : Promise.reject();
    void opened.catch(() => browser.tabs.create({ url: browser.runtime.getURL('/sidepanel.html') }));
  });
});
