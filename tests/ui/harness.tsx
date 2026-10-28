// Renders UI with in-memory storage, silent audio and a controllable clock.
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createSpeaker } from '../../src/audio/speech';
import type { CurriculumIndex } from '../../src/curriculum/assemble';
import { createLearning } from '../../src/learning/actions';
import { createStore, defaultPreferences, type LearnerPreferences } from '../../src/storage/store';
import { SpeechProvider } from '../../src/ui/components/AudioButton';
import { EnvProvider, type Surface, type UiEnv } from '../../src/ui/env';
import { silentSfx } from '../../src/ui/sfx';
import { makeCourse } from '../fixtures/curriculum';
import { createMemoryArea } from '../fixtures/memory-storage';

export const T0 = new Date(2026, 9, 27, 9).getTime();

export function silentSpeaker() {
  return createSpeaker({
    synth: undefined,
    createUtterance: () => ({}) as SpeechSynthesisUtterance,
    playClip: () => Promise.reject(new Error('no audio in tests')),
    stopClip: () => {},
    manifest: { clips: {} },
  });
}

export function setupLearning(course: CurriculumIndex = makeCourse()) {
  const area = createMemoryArea();
  const store = createStore(area);
  let clock = T0;
  const learning = createLearning({ store, course, now: () => clock });
  return { area, store, course, learning, now: () => clock, advance: (ms: number) => (clock += ms) };
}

export function makeEnv(
  setup: ReturnType<typeof setupLearning>,
  overrides: Omit<Partial<UiEnv>, 'prefs'> & { prefs?: Partial<LearnerPreferences>; surface?: Surface } = {},
): UiEnv {
  const { prefs, ...rest } = overrides;
  return {
    learning: setup.learning,
    course: setup.course,
    prefs: { ...defaultPreferences(), autoplayAudio: false, ...prefs },
    setPrefs: async (patch) => {
      await setup.store.updatePreferences(patch);
    },
    sfx: silentSfx,
    surface: 'panel',
    now: setup.now,
    ...rest,
  };
}

export function renderUi(env: UiEnv, ui: ReactNode) {
  return render(
    <EnvProvider env={env}>
      <SpeechProvider speaker={silentSpeaker()}>{ui}</SpeechProvider>
    </EnvProvider>,
  );
}
