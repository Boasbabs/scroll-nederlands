// The end screens with sample results, for visual checks without playing a session through.
// ?kind=lesson|words|sounds|review|checkpoint-pass|checkpoint-fail|card
import { createRoot } from 'react-dom/client';
import '../src/ui/theme.css';
import '../src/ui/motion.css';
import '../src/ui/components.css';
import '../src/ui/player/player.css';
import '../src/ui/panel/panel.css';
import '../src/ui/nudge/nudge.css';
import { course } from '../src/curriculum';
import type { SessionPlan } from '../src/engine/plan';
import { bundledImages } from '../src/images/manifest';
import { createLearning, type SessionOutcome } from '../src/learning/actions';
import { defaultPreferences } from '../src/storage/store';
import { SpeechProvider } from '../src/ui/components/AudioButton';
import { EnvProvider, type UiEnv } from '../src/ui/env';
import { SessionComplete } from '../src/ui/player/SessionComplete';
import { silentSfx } from '../src/ui/sfx';
import { createPreviewArea, createStore, seed } from './fake-chrome';
import { previewSpeaker } from './preview-speaker';

const params = new URLSearchParams(location.search);
const kind = params.get('kind') ?? 'lesson';
// The learner from ?state=today, so the bars on the field show real counts.
const { area } = createPreviewArea();
await seed(area, 'today', Date.now());
const store = createStore(area);
const learning = createLearning({ store, course, images: bundledImages });
const env: UiEnv = {
  learning,
  course,
  prefs: defaultPreferences(),
  setPrefs: async () => {},
  sfx: silentSfx,
  surface: kind === 'card' ? 'card' : 'panel',
  now: () => Date.now(),
};

const lesson = course.lessons[8]!;
const checkpoint = course.lessons.find((entry) => entry.kind === 'checkpoint')!;
const missed = lesson.items.slice(0, 2).map((item) => item.id);
const base: SessionOutcome = { kind: 'lesson', correct: 7, total: 8, missedItemIds: missed, newItemIds: lesson.items.slice(0, 4).map((item) => item.id), next: { type: 'lesson', lessonId: course.lessons[2]!.id }, nextReviewAt: Date.now() + 86_400_000 };
const SAMPLES: Record<string, [SessionPlan, SessionOutcome]> = {
  lesson: [{ kind: 'lesson', mode: 'focused', lessonId: lesson.id, steps: [] }, base],
  words: [{ kind: 'words', mode: 'focused', steps: [] }, { ...base, kind: 'words', missedItemIds: [], newItemIds: course.words.slice(0, 5).map((item) => item.id) }],
  sounds: [{ kind: 'sounds', mode: 'focused', steps: [{ type: 'contrast', itemId: course.sounds[0]!.id }] }, { ...base, kind: 'sounds', missedItemIds: [], newItemIds: [course.sounds[0]!.id] }],
  review: [
    {
      kind: 'review',
      mode: 'focused',
      // Ten reviewed items, two of them missed.
      steps: course.items.slice(0, 10).map((item) => ({ type: 'exercise', planned: { itemIds: [item.id] } }) as unknown as SessionPlan['steps'][number]),
    },
    { ...base, kind: 'review', missedItemIds: course.items.slice(0, 2).map((item) => item.id), newItemIds: [] },
  ],
  'checkpoint-pass': [{ kind: 'checkpoint', mode: 'focused', lessonId: checkpoint.id, steps: [] }, { ...base, kind: 'checkpoint', missedItemIds: missed.slice(0, 1), checkpoint: { score: 13 / 15, passed: true, missedLessonIds: [] } }],
  'checkpoint-fail': [{ kind: 'checkpoint', mode: 'focused', lessonId: checkpoint.id, steps: [] }, { ...base, kind: 'checkpoint', checkpoint: { score: 9 / 15, passed: false, missedLessonIds: [] } }],
  card: [{ kind: 'lesson', mode: 'micro', lessonId: lesson.id, steps: [] }, base],
};
const [plan, outcome] = SAMPLES[kind] ?? SAMPLES.lesson!;
const stats = kind.startsWith('checkpoint') ? { correct: outcome.checkpoint!.passed ? 13 : 9, graded: 15, ms: 312_000 } : { correct: 7, graded: 8, ms: 192_000 };

const complete = <SessionComplete plan={plan} outcome={outcome} stats={stats} onAction={() => {}} />;
createRoot(document.getElementById('root')!).render(
  kind === 'card' ? (
    // The in-page card's end, in the card's own frame (340px, grown to its session height).
    <div style={{ display: 'grid', justifyContent: 'center', padding: 24 }}>
      <EnvProvider env={env}>
        <SpeechProvider speaker={previewSpeaker}>
          <div className="tn-root">
            <section className="tn-nudge tn-nudge--session" aria-label="Dutch practice">
              <div className="tn-player tn-player--compact">{complete}</div>
            </section>
          </div>
        </SpeechProvider>
      </EnvProvider>
    </div>
  ) : (
    <div style={{ width: Number(params.get('w') ?? 380), height: '100vh', margin: '0 auto', boxShadow: '0 0 0 1px #e2e4ea', transform: 'translateZ(0)' }}>
      <EnvProvider env={env}>
        <SpeechProvider speaker={previewSpeaker}>
          <div className="tn-root tn-panel">
            <div className="tn-player">{complete}</div>
          </div>
        </SpeechProvider>
      </EnvProvider>
    </div>
  ),
);
