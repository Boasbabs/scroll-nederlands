// The in-page prompt script runs only on sites the learner granted (optional host
// permissions). The background worker keeps its registration in step with those
// grants and starts it in tabs that were already open.
import { ALL_SITE_ORIGINS } from '../sites';

export const CONTENT_SCRIPT_ID = 'taalnudge-prompt';
/** Relative to the extension root (the WXT build output). */
export const CONTENT_SCRIPT_FILE = 'content-scripts/content.js' as const;

type ScriptRegistration = {
  id: string;
  matches: Array<string>;
  js: Array<string>;
  runAt: 'document_idle';
  persistAcrossSessions: boolean;
};

/** The parts of chrome.permissions, chrome.scripting and chrome.tabs the sync needs. */
export type RegistrationApis = {
  grantedOrigins: () => Promise<Array<string>>;
  registered: () => Promise<{ matches?: Array<string> } | undefined>;
  register: (script: ScriptRegistration) => Promise<void>;
  update: (matches: Array<string>) => Promise<void>;
  unregister: () => Promise<void>;
  tabsMatching: (origins: Array<string>) => Promise<Array<number>>;
  inject: (tabId: number) => Promise<unknown>;
};

/** Which already-open tabs get the script now: none, every granted site (after install or update), or the newly granted origins. */
export type StartIn = 'none' | 'all' | ReadonlyArray<string>;

export function createRegistrationSync(apis: RegistrationApis) {
  let queue: Promise<unknown> = Promise.resolve();

  async function sync(): Promise<Array<string>> {
    const granted = await apis.grantedOrigins();
    const matches = ALL_SITE_ORIGINS.filter((origin) => granted.includes(origin));
    const existing = await apis.registered();
    if (matches.length === 0) {
      if (existing) await apis.unregister();
    } else if (!existing) {
      await apis.register({ id: CONTENT_SCRIPT_ID, matches, js: [CONTENT_SCRIPT_FILE], runAt: 'document_idle', persistAcrossSessions: true });
    } else if ((existing.matches ?? []).join(' ') !== matches.join(' ')) {
      await apis.update(matches);
    }
    return matches;
  }

  async function start(origins: Array<string>) {
    if (origins.length === 0) return;
    for (const tabId of await apis.tabsMatching(origins)) {
      // Pages Chrome does not let extensions script (or tabs that closed meanwhile) are skipped.
      await apis.inject(tabId).catch(() => undefined);
    }
  }

  return {
    /** Re-syncs the registration; runs one at a time, so overlapping events never register twice. */
    run(startIn: StartIn = 'none'): Promise<void> {
      const task = async () => {
        const matches = await sync();
        if (startIn === 'all') await start(matches);
        else if (startIn !== 'none') await start(matches.filter((origin) => startIn.includes(origin)));
      };
      const run = queue.then(task, task);
      queue = run.catch(() => undefined);
      return run;
    },
  };
}
