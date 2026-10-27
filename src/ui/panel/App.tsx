import { useState } from 'react';
import { useLearnerData } from '../env';
import { Home } from './Home';
import { Roadmap } from './Roadmap';
import { Session, type SessionStart } from './Session';
import { Settings } from './Settings';

type Tab = 'practice' | 'roadmap' | 'settings';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'practice', label: 'Practice' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'settings', label: 'Settings' },
];

/** Focused practice in the side panel. */
export function App() {
  const data = useLearnerData();
  const [tab, setTab] = useState<Tab>('practice');
  const [session, setSession] = useState<SessionStart | null>(null);

  if (!data) return <div className="tn-root"><p className="tn-muted" style={{ padding: 16 }}>Loading…</p></div>;

  if (session) {
    return (
      <div className="tn-root tn-app">
        <Session start={session} onExit={() => setSession(null)} />
      </div>
    );
  }

  return (
    <div className="tn-root tn-app">
      <header className="tn-row" style={{ padding: '12px 16px 0' }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--tn-accent)' }} />
        <strong>TaalNudge</strong>
        <span className="tn-muted" style={{ fontSize: 13 }}>Dutch A0 → A2</span>
      </header>
      <nav className="tn-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="tn-tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main role="tabpanel">
        {tab === 'practice' && <Home data={data} onStart={() => setSession({ kind: 'continue' })} onOpenSettings={() => setTab('settings')} />}
        {tab === 'roadmap' && <Roadmap progress={data.progress} onOpen={(lessonId) => setSession({ kind: 'lesson', lessonId })} />}
        {tab === 'settings' && <Settings preferences={data.preferences} />}
      </main>
    </div>
  );
}
