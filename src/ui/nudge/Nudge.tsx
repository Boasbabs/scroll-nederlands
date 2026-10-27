import { useEffect, useRef, useState } from 'react';
import type { Activity } from '../../engine/types';
import { type PromptResponse, snoozeOptions } from '../../trigger/browsing';
import { ActivityView } from '../ActivityView';
import { useEnv, useLearnerData } from '../env';
import { CrossIcon, MoreIcon } from '../icons';

export type NudgeProps = {
  activity: Activity;
  /** Learner answered the prompt. Resolves once saved. */
  onRespond(response: PromptResponse, snoozeUntil?: number): Promise<void>;
  /** Restore preferences after an accidental snooze or quiet mode. */
  onUndo(): Promise<void>;
  /** Remove the card from the page. */
  onClose(): void;
};

const TOAST_MS = 5000;

function PromptCard({ activity, onLearn, onNotNow, onMenu, menuOpen, onSnooze, onQuiet }: {
  activity: Activity;
  onLearn(): void;
  onNotNow(): void;
  onMenu(): void;
  menuOpen: boolean;
  onSnooze(until: number, label: string): void;
  onQuiet(): void;
}) {
  const { now, openPractice } = useEnv();
  const focusedOnly = activity.kind === 'focused-only';
  const label = activity.kind === 'review' ? 'Quick review · 1 min' : focusedOnly ? 'Checkpoint ready' : 'Dutch · 1–2 min';

  return (
    <div className="tn-nudge-card tn-nudge-in" role="dialog" aria-label="TaalNudge: a short Dutch lesson">
      <div className="tn-row" style={{ marginBottom: 6 }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--tn-accent)' }} />
        <span className="tn-label" style={{ textTransform: 'none', letterSpacing: 0 }}>TaalNudge · {label}</span>
        <span className="tn-spacer" />
        <button type="button" className="tn-icon-btn" onClick={onNotNow} aria-label="Not now" title="Not now">
          <CrossIcon size={16} />
        </button>
      </div>

      {activity.kind === 'new-lesson' && (
        <>
          <p className="tn-dutch" style={{ margin: 0, fontSize: 16 }} lang="nl">{activity.lesson.targetPhrase}</p>
          <p className="tn-muted" style={{ margin: '2px 0 0' }}>{activity.lesson.meaningEn}</p>
        </>
      )}
      {activity.kind === 'review' && (
        <p style={{ margin: 0 }}>
          Can you still use <strong>{activity.lesson.title}</strong>? One question.
        </p>
      )}
      {focusedOnly && <p style={{ margin: 0 }}>{activity.lesson.title} is a longer check, best done in the side panel.</p>}

      <div className="tn-row" style={{ marginTop: 12, position: 'relative' }}>
        <button type="button" className="tn-icon-btn" onClick={onMenu} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="More options">
          <MoreIcon />
        </button>
        {menuOpen && (
          <div className="tn-menu" role="menu">
            {snoozeOptions(now()).map((option) => (
              <button key={option.label} type="button" role="menuitem" className="tn-menu-item" onClick={() => onSnooze(option.until, option.label)}>
                {option.label}
              </button>
            ))}
            <hr />
            <button type="button" role="menuitem" className="tn-menu-item" onClick={onQuiet}>
              Quiet mode (pause all prompts)
            </button>
          </div>
        )}
        <span className="tn-spacer" />
        <button type="button" className="tn-btn tn-btn-ghost" onClick={onNotNow}>Not now</button>
        {focusedOnly ? (
          <button type="button" className="tn-btn tn-btn-primary" onClick={() => { openPractice?.(); onNotNow(); }}>Open practice</button>
        ) : (
          <button type="button" className="tn-btn tn-btn-primary" onClick={onLearn}>Learn now</button>
        )}
      </div>
    </div>
  );
}

/** The in-page micro-learning card: a prompt that can expand into a short lesson or review. */
export function Nudge({ activity, onRespond, onUndo, onClose }: NudgeProps) {
  const { openPractice } = useEnv();
  const data = useLearnerData();
  const [view, setView] = useState<'prompt' | 'lesson' | 'toast'>('prompt');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function showToast(message: string) {
    setToast(message);
    setView('toast');
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(onClose, TOAST_MS);
  }

  if (view === 'toast') {
    return (
      <div className="tn-nudge-card tn-toast tn-nudge-in" role="status">
        <div className="tn-row">
          <span style={{ flex: 1 }}>{toast}</span>
          <button
            type="button"
            className="tn-link"
            onClick={() => {
              clearTimeout(toastTimer.current);
              void onUndo().then(onClose);
            }}
          >
            Undo
          </button>
          <button type="button" className="tn-icon-btn" onClick={onClose} aria-label="Dismiss"><CrossIcon size={14} /></button>
        </div>
        <span className="tn-toast-timer" style={{ animationDuration: `${TOAST_MS}ms` }} />
      </div>
    );
  }

  if (view === 'lesson') {
    return (
      <div className="tn-nudge-card tn-nudge-lesson tn-nudge-in">
        <ActivityView
          activity={activity}
          mode="micro"
          speechRate={data?.preferences.speechRate}
          onExit={onClose}
          primary={{ label: 'Done, back to browsing', onClick: onClose }}
          secondary={openPractice ? { label: 'Keep going in the side panel', onClick: () => { openPractice(); onClose(); } } : undefined}
        />
      </div>
    );
  }

  return (
    <PromptCard
      activity={activity}
      menuOpen={menuOpen}
      onMenu={() => setMenuOpen(!menuOpen)}
      onLearn={() => {
        void onRespond('learn');
        setView('lesson');
      }}
      onNotNow={() => void onRespond('not-now').then(onClose)}
      onSnooze={(until, label) => {
        void onRespond('snooze', until);
        showToast(`${label.replace('Snooze', 'Snoozed')}`);
      }}
      onQuiet={() => {
        void onRespond('quiet');
        showToast('Quiet mode on. Turn it off in the side panel.');
      }}
    />
  );
}
