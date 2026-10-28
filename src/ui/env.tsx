// What every screen needs from its surroundings. The side panel and the
// in-page card provide real implementations; tests and the preview provide fakes.
import { createContext, useContext, type ReactNode } from 'react';
import type { CurriculumIndex } from '../curriculum/assemble';
import type { PictureSource } from '../images/pictures';
import type { Learning } from '../learning/actions';
import type { SiteId } from '../sites';
import type { LearnerPreferences } from '../storage/store';
import type { Sfx } from './sfx';

/** panel: the side panel. card: the in-page card on X or LinkedIn. */
export type Surface = 'panel' | 'card';

/** Site access for in-page prompts: chrome.permissions in the extension. */
export type SitePermissions = {
  /** Call it straight from a click handler: Chrome only shows its dialog for a user gesture. */
  request(sites: ReadonlyArray<SiteId>): Promise<boolean>;
  granted(): Promise<Record<SiteId, boolean>>;
  revoke(sites: ReadonlyArray<SiteId>): Promise<void>;
};

export type UiEnv = {
  learning: Learning;
  course: CurriculumIndex;
  prefs: LearnerPreferences;
  setPrefs: (patch: Partial<LearnerPreferences>) => Promise<void>;
  sfx: Sfx;
  surface: Surface;
  now: () => number;
  /** Opens the side panel from the in-page card (through the background worker). */
  openSidePanel?: () => void;
  permissions?: SitePermissions;
  /** The speaking step may record the learner (side panel only; never on host pages). */
  canRecord?: boolean;
  /** Item pictures. Saving one of the learner's own works in the side panel only. */
  pictures?: PictureSource;
};

const EnvContext = createContext<UiEnv | null>(null);

export function EnvProvider({ env, children }: { env: UiEnv; children: ReactNode }) {
  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}

export function useEnv(): UiEnv {
  const env = useContext(EnvContext);
  if (!env) throw new Error('useEnv needs an EnvProvider');
  return env;
}
