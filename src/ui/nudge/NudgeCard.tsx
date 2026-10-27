// The in-page prompt: a small corner card, its ⋯ menu, and the snooze toast.
import { useEffect, useRef, useState } from 'react';
import type { SnoozeChoice } from '../../trigger/browsing';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { formatClock } from '../format';

/** The brand mark: a Sunset tile with the rounded T. It waves once on arrival (appeal). */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg className="tn-mark" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <rect width="20" height="20" rx="6" fill="var(--sunset)" />
      <path d="M5.5 6.5h9 M10 6.5v8" stroke="var(--navy)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export type NudgePreview = { dutch: string; english: string };

type NudgeCardProps = {
  preview?: NudgePreview;
  onLearn: () => void;
  onNotNow: () => void;
  onSnooze: (choice: SnoozeChoice) => void;
  onQuiet: () => void;
  now: number;
  /** Shown as an illustration (onboarding): not focusable, not clickable. */
  demo?: boolean;
};

export function NudgeCard({ preview, onLearn, onNotNow, onSnooze, onQuiet, now, demo = false }: NudgeCardProps) {
  const [menu, setMenu] = useState(false);
  return (
    <section className="tn-nudge tn-nudge--card tn-rise-in" aria-label="Dutch practice" inert={demo || undefined}>
      <header className="tn-nudge__head">
        <BrandMark />
        <span className="tn-nudge__meta">Dutch · 2 min</span>
        <button type="button" className="tn-icon-btn tn-icon-btn--small" aria-label="Close" onClick={onNotNow}>
          <Icon name="close" size={18} />
        </button>
      </header>
      <p className="tn-nudge__title">Ready for a 2-minute Dutch break?</p>
      {preview ? (
        <p className="tn-nudge__preview">
          <em lang="nl">{preview.dutch}</em> · {preview.english}
        </p>
      ) : null}
      <div className="tn-nudge__actions">
        <Button size="sm" onClick={onLearn}>
          Learn now
        </Button>
        <Button size="sm" variant="ghost" onClick={onNotNow}>
          Not now
        </Button>
        <span className="tn-nudge__spacer" />
        <div className="tn-menu-anchor">
          <button
            type="button"
            className="tn-icon-btn"
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((open) => !open)}
          >
            <Icon name="more" />
          </button>
          {menu ? (
            <NudgeMenu
              now={now}
              onClose={() => setMenu(false)}
              onSnooze={(choice) => {
                setMenu(false);
                onSnooze(choice);
              }}
              onQuiet={() => {
                setMenu(false);
                onQuiet();
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function NudgeMenu({ now, onClose, onSnooze, onQuiet }: { now: number; onClose: () => void; onSnooze: (choice: SnoozeChoice) => void; onQuiet: () => void }) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    const at = items.indexOf(event.target as HTMLButtonElement);
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(at + step + items.length) % items.length]?.focus();
    }
  }

  return (
    <div ref={list} className="tn-menu tn-rise-in" role="menu" aria-label="Prompt options" onKeyDown={onKeyDown}>
      <button type="button" role="menuitem" onClick={() => onSnooze('30m')}>
        Snooze 30 min <span className="tn-menu__hint">· until {formatClock(now + 30 * 60_000)}</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onSnooze('1h')}>
        Snooze 1 hour
      </button>
      <button type="button" role="menuitem" onClick={() => onSnooze('tomorrow')}>
        Snooze until tomorrow
      </button>
      <hr className="tn-menu__divider" />
      <button type="button" role="menuitem" onClick={onQuiet}>
        <Icon name="moon" size={18} />
        Quiet mode
      </button>
    </div>
  );
}

export const TOAST_MS = 6000;

/** One-line confirmation with Undo; leaves by itself after a few seconds. */
export function SnoozeToast({ message, onUndo, onClose }: { message: string; onUndo: () => void; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_MS);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="tn-nudge tn-toast tn-rise-in" role="status">
      <span className="tn-toast__timer" style={{ animationDuration: `${TOAST_MS}ms` }} aria-hidden="true" />
      <span className="tn-toast__text">{message}</span>
      <Button size="sm" variant="ghost" onClick={onUndo}>
        Undo
      </Button>
      <button type="button" className="tn-icon-btn tn-icon-btn--small" aria-label="Close" onClick={onClose}>
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
