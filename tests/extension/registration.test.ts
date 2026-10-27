import { CONTENT_SCRIPT_FILE, CONTENT_SCRIPT_ID, createRegistrationSync, type RegistrationApis } from '../../src/extension/registration';

const X = ['https://x.com/*', 'https://twitter.com/*'];
const LINKEDIN = ['https://www.linkedin.com/*'];

/** chrome.permissions + chrome.scripting + chrome.tabs in memory. */
function fakeChrome(granted: Array<string>, tabs: Record<number, string> = {}) {
  const state = { granted: [...granted], script: undefined as { matches: Array<string> } | undefined, injected: [] as Array<number>, calls: [] as Array<string> };
  const apis: RegistrationApis = {
    grantedOrigins: async () => [...state.granted, 'https://example.com/*'],
    registered: async () => state.script,
    async register(script) {
      state.calls.push('register');
      if (state.script) throw new Error(`Duplicate script ID '${script.id}'`);
      expect(script).toMatchObject({ id: CONTENT_SCRIPT_ID, js: [CONTENT_SCRIPT_FILE], runAt: 'document_idle' });
      state.script = { matches: script.matches };
    },
    async update(matches) {
      state.calls.push('update');
      state.script = { matches };
    },
    async unregister() {
      state.calls.push('unregister');
      state.script = undefined;
    },
    tabsMatching: async (origins) =>
      Object.entries(tabs)
        .filter(([, url]) => origins.some((origin) => url.startsWith(origin.replace('*', ''))))
        .map(([id]) => Number(id)),
    async inject(tabId) {
      if (tabs[tabId]?.includes('blocked')) throw new Error('Cannot access contents of the page');
      state.injected.push(tabId);
    },
  };
  return { apis, state };
}

describe('content script registration', () => {
  it('registers the script only for the granted site origins', async () => {
    const { apis, state } = fakeChrome(X);
    await createRegistrationSync(apis).run();
    expect(state.script?.matches).toEqual(X);
  });

  it('does nothing without a granted site, and unregisters when the last one is removed', async () => {
    const { apis, state } = fakeChrome([]);
    const sync = createRegistrationSync(apis);
    await sync.run();
    expect(state.calls).toEqual([]);

    state.granted = [...LINKEDIN];
    await sync.run(LINKEDIN);
    state.granted = [];
    await sync.run();
    expect(state.calls).toEqual(['register', 'unregister']);
    expect(state.script).toBeUndefined();
  });

  it('updates the matches when a site is added and starts the script only in tabs of the new site', async () => {
    const { apis, state } = fakeChrome(X, { 1: 'https://x.com/home', 2: 'https://www.linkedin.com/feed/', 3: 'https://example.com/' });
    const sync = createRegistrationSync(apis);
    await sync.run();
    state.granted = [...X, ...LINKEDIN];
    await sync.run(LINKEDIN);
    expect(state.script?.matches).toEqual([...X, ...LINKEDIN]);
    expect(state.calls).toEqual(['register', 'update']);
    // The X tab keeps its running script (and any card the learner is using).
    expect(state.injected).toEqual([2]);
  });

  it('after install or update starts the script in every granted tab and skips pages it cannot script', async () => {
    const { apis, state } = fakeChrome([...X, ...LINKEDIN], { 4: 'https://x.com/home', 5: 'https://www.linkedin.com/blocked', 6: 'https://twitter.com/i' });
    await createRegistrationSync(apis).run('all');
    expect(state.injected).toEqual([4, 6]);
  });

  it('leaves the registration alone when nothing changed', async () => {
    const { apis, state } = fakeChrome(X);
    const sync = createRegistrationSync(apis);
    await sync.run();
    await sync.run();
    expect(state.calls).toEqual(['register']);
  });

  it('runs overlapping events one at a time, so the script is never registered twice', async () => {
    const { apis, state } = fakeChrome(X);
    const sync = createRegistrationSync(apis);
    await Promise.all([sync.run('all'), sync.run(), sync.run(X)]);
    expect(state.calls).toEqual(['register']);
  });
});
