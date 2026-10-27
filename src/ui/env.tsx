import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Speaker } from '../audio/speech';
import type { LearnerPreferences, LearnerProgress } from '../engine/types';
import type { LearningActions } from '../learning/actions';
import type { SiteId } from '../sites';
import type { LearningStore } from '../storage/store';

export type SiteAccess = {
  status(): Promise<Record<SiteId, boolean>>;
  request(site: SiteId): Promise<boolean>;
  revoke(site: SiteId): Promise<boolean>;
};

/** Everything the UI needs from the outside world, so components can be tested without Chrome APIs. */
export type LearningEnv = {
  store: LearningStore;
  actions: LearningActions;
  speaker: Pick<Speaker, 'speak' | 'describeVoice' | 'stop'>;
  /** Calls the listener whenever stored progress or preferences change (in any extension context). */
  subscribe(listener: () => void): () => void;
  now(): number;
  sites?: SiteAccess;
  openPractice?: () => void;
};

const EnvContext = createContext<LearningEnv | null>(null);

export function EnvProvider({ env, children }: { env: LearningEnv; children: ReactNode }) {
  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}

export function useEnv(): LearningEnv {
  const env = useContext(EnvContext);
  if (!env) throw new Error('useEnv needs an EnvProvider');
  return env;
}

export type LearnerData = {
  progress: LearnerProgress;
  preferences: LearnerPreferences;
};

/** Live view of stored progress and preferences, shared by every open extension view. */
export function useLearnerData(): LearnerData | null {
  const { store, subscribe } = useEnv();
  const [data, setData] = useState<LearnerData | null>(null);

  const load = useCallback(async () => {
    const [progress, preferences] = await Promise.all([store.getProgress(), store.getPreferences()]);
    setData({ progress, preferences });
  }, [store]);

  useEffect(() => {
    void load();
    return subscribe(() => void load());
  }, [load, subscribe]);

  return data;
}
