// The side panel: onboarding, the five tabs, Settings, and full-panel sessions.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Speaker } from '../../audio/speech';
import type { CurriculumIndex } from '../../curriculum/assemble';
import type { SessionPlan } from '../../engine/plan';
import { packOfScene } from '../../engine/selection';
import type { PictureSource } from '../../images/pictures';
import type { Learning, SessionOutcome, Snapshot } from '../../learning/actions';
import type { ProgressBackup } from '../../storage/backup';
import { SpeechProvider } from '../components/AudioButton';
import { Icon, type IconName } from '../components/Icon';
import { EnvProvider, type SitePermissions, type UiEnv } from '../env';
import type { CompleteAction } from '../player/SessionComplete';
import { SessionPlayer } from '../player/SessionPlayer';
import { createSfx } from '../sfx';
import { StreakChip, TabTile } from './controls';
import { CourseScreen } from './CourseScreen';
import { Onboarding } from './Onboarding';
import { ProgressScreen, ReviewScreen, TodayScreen } from './screens';
import { SettingsScreen } from './SettingsScreen';
import { TopicsScreen } from './TopicsScreen';

export type PanelDeps = {
  learning: Learning;
  course: CurriculumIndex;
  speaker: Speaker;
  permissions?: SitePermissions;
  /** Calls back when learner data changes elsewhere (the in-page card). Returns an unsubscribe. */
  subscribe?: (onChange: () => void) => () => void;
  now?: () => number;
  canRecord?: boolean;
  pictures?: PictureSource;
  backup?: ProgressBackup;
};

export type Tab = 'today' | 'course' | 'topics' | 'review' | 'progress';
type Screen = Tab | 'settings';

const TABS: Array<{ id: Tab; label: string; icon: IconName }> = [
  { id: 'today', label: 'Today', icon: 'home' },
  { id: 'course', label: 'Course', icon: 'book' },
  { id: 'topics', label: 'Topics', icon: 'topics' },
  { id: 'review', label: 'Review', icon: 'target' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
];

/** Starts sessions from any screen; null means there was nothing to start. */
export type StartSession = (start: () => Promise<SessionPlan | undefined> | SessionPlan | undefined) => Promise<void>;

export function PanelApp({ deps }: { deps: PanelDeps }) {
  const { learning, course, speaker, permissions, subscribe, canRecord, pictures, backup } = deps;
  const now = deps.now ?? Date.now;
  const [snap, setSnap] = useState<Snapshot>();
  const [screen, setScreen] = useState<Screen>('today');
  /** The Topics tab's open theme: kept through a practice session, so Done comes back to it. */
  const [openTopic, setOpenTopic] = useState<string>();
  const [session, setSession] = useState<{ id: number; plan: SessionPlan }>();
  const prefsRef = useRef(snap?.prefs);
  prefsRef.current = snap?.prefs;
  const sfx = useMemo(() => createSfx(() => prefsRef.current?.soundEffects ?? true), []);

  const refresh = useCallback(async () => setSnap(await learning.snapshot('focused')), [learning]);
  useEffect(() => {
    void refresh();
    return subscribe?.(() => void refresh());
  }, [refresh, subscribe]);

  const start: StartSession = useCallback(
    async (begin) => {
      const plan = await begin();
      if (plan) setSession((current) => ({ id: (current?.id ?? 0) + 1, plan }));
      else await refresh();
    },
    [refresh],
  );

  const env: UiEnv | undefined = useMemo(
    () =>
      snap && {
        learning,
        course,
        prefs: snap.prefs,
        setPrefs: async (patch) => {
          await learning.updatePreferences(patch);
          await refresh();
        },
        sfx,
        surface: 'panel',
        now,
        permissions,
        canRecord,
        pictures,
        backup,
      },
    [snap, learning, course, sfx, now, permissions, canRecord, pictures, backup, refresh],
  );

  function closeSession(to?: Screen) {
    setSession(undefined);
    if (to) setScreen(to);
    void refresh();
  }

  function onAction(action: CompleteAction, outcome: SessionOutcome) {
    const lessonId = session?.plan.lessonId;
    const pack = lessonId ? packOfScene(course, lessonId) : undefined;
    const following = pack?.scenes[pack.scenes.findIndex((scene) => scene.id === lessonId) + 1];
    if (action === 'scene' && following) void start(() => learning.startLesson(following.id, 'focused'));
    else if (action === 'scene' || action === 'pack') {
      // The pack's page, on the Topics tab, wherever the scene was started.
      setOpenTopic(pack?.id);
      closeSession('topics');
    } else if (action === 'next') void start(() => learning.startNext('focused'));
    else if (action === 'again' || action === 'mistakes') void start(() => learning.startPractice('focused', outcome.missedItemIds));
    else closeSession(action === 'course' ? 'course' : screen === 'topics' ? 'topics' : 'today');
  }

  let content;
  if (!env || !snap) {
    content = <div className="tn-panel__loading" aria-busy="true" />;
  } else if (session) {
    content = <SessionPlayer key={session.id} plan={session.plan} onExit={() => closeSession()} onAction={onAction} />;
  } else if (!snap.prefs.onboarded) {
    content = <Onboarding start={start} />;
  } else {
    const tab: Tab = screen === 'settings' ? 'today' : screen;
    content = (
      <div className="tn-shell" data-ground={screen}>
        <header className="tn-appbar">
          {screen === 'settings' ? (
            <button type="button" className="tn-icon-btn" aria-label="Back" onClick={() => setScreen('today')}>
              <Icon name="back" />
            </button>
          ) : null}
          <h1 className="tn-appbar__title">{screen === 'settings' ? 'Settings' : TABS.find((entry) => entry.id === screen)?.label}</h1>
          {snap.summary.streak > 0 ? <StreakChip days={snap.summary.streak} /> : null}
          {screen === 'settings' ? null : (
            <button type="button" className="tn-icon-btn" aria-label="Settings" onClick={() => setScreen('settings')}>
              <Icon name="gear" />
            </button>
          )}
        </header>
        <main className="tn-shell__main" key={screen}>
          {screen === 'today' ? <TodayScreen snap={snap} start={start} /> : null}
          {screen === 'course' ? (
            <CourseScreen
              snap={snap}
              start={start}
              // A situation's row on the path opens its page on the Topics tab.
              onOpenPack={(packId) => {
                setOpenTopic(packId);
                setScreen('topics');
              }}
            />
          ) : null}
          {screen === 'topics' ? <TopicsScreen snap={snap} start={start} openId={openTopic} onOpen={setOpenTopic} onChange={() => void refresh()} /> : null}
          {screen === 'review' ? <ReviewScreen snap={snap} start={start} onCourse={() => setScreen('course')} onChange={() => void refresh()} /> : null}
          {screen === 'progress' ? <ProgressScreen snap={snap} /> : null}
          {screen === 'settings' ? <SettingsScreen /> : null}
        </main>
        <nav className="tn-tabbar" aria-label="Sections">
          {/* Finch's soft tile behind the selected tab; it slides to the new one. None is selected on Settings. */}
          <TabTile index={TABS.findIndex((entry) => entry.id === tab)} hidden={screen === 'settings'} />
          {TABS.map((entry) => {
            const current = screen !== 'settings' && tab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                className="tn-tabbar__tab"
                aria-current={current ? 'page' : undefined}
                onClick={() => {
                  // The current Topics tab, pressed again, goes back to its list.
                  if (current && entry.id === 'topics') setOpenTopic(undefined);
                  setScreen(entry.id);
                }}
              >
                <span className="tn-tabbar__icon">
                  <Icon name={entry.icon} filled={current} />
                  {entry.id === 'review' && snap.summary.dueNow > 0 ? (
                    <span className="tn-badge" aria-label={`${snap.summary.dueNow} due`}>
                      {snap.summary.dueNow > 99 ? '99+' : snap.summary.dueNow}
                    </span>
                  ) : null}
                </span>
                {entry.label}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <SpeechProvider speaker={speaker} rate={snap?.prefs.speechRate ?? 1}>
      {env ? (
        <EnvProvider env={env}>
          <div className="tn-root tn-panel">{content}</div>
        </EnvProvider>
      ) : (
        <div className="tn-root tn-panel">{content}</div>
      )}
    </SpeechProvider>
  );
}
