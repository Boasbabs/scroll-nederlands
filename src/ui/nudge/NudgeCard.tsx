// The in-page prompt: a small corner card on the Today ground, its ⋯ menu, and the snooze toast.
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import type { SnoozeChoice } from '../../trigger/browsing';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { IconTile } from '../components/IconTile';
import { useExit } from '../exit';
import { formatClock } from '../format';

/** The brand mark: a Warm Blue tile with a white rounded T. It waves once on arrival (appeal). */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg className="tn-mark" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <rect width="20" height="20" rx="6" fill="var(--primary)" />
      <path d="M5.5 6.5h9 M10 6.5v8" stroke="var(--on-primary)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** A new lesson's phrase and meaning, or a count that gives nothing away (reviews, new words). */
export type NudgePreview = { dutch: string; english: string } | { text: string; kind: 'reviews' | 'words' };

/** The activity's own tile, the same as on the Today tab: lessons, reviews or new words. */
function PreviewTile({ preview }: { preview: NudgePreview }) {
  if ('dutch' in preview) return <IconTile icon="book" kind="lessons" size={36} />;
  return preview.kind === 'reviews' ? <IconTile icon="target" kind="reviews" size={36} /> : <IconTile icon="words" kind="words" size={36} />;
}

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
  const more = useRef<HTMLButtonElement>(null);
  const menuExit = useExit<HTMLDivElement>();
  function closeMenu() {
    menuExit.leave(() => {
      setMenu(false);
      more.current?.focus();
    });
  }
  return (
    <section className="tn-nudge tn-nudge--card tn-rise-in" aria-label="Dutch practice" inert={demo || undefined}>
      <header className="tn-nudge__head">
        <BrandMark />
        <span className="tn-nudge__meta">Dutch · 2 min</span>
        <button type="button" className="tn-round-btn" aria-label="Close" onClick={onNotNow}>
          <Icon name="close" size={18} />
        </button>
      </header>
      <p className="tn-nudge__title">Ready for a 2-minute Dutch break?</p>
      {preview ? (
        // What Learn now starts with, as a raised row with its activity tile (Finch lists a goal this way).
        <div className="tn-nudge__next">
          <PreviewTile preview={preview} />
          <p className="tn-nudge__preview">
            {'text' in preview ? (
              <span className="tn-nudge__count">{preview.text}</span>
            ) : (
              <>
                <em lang="nl">{preview.dutch}</em> · {preview.english}
              </>
            )}
          </p>
        </div>
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
            ref={more}
            type="button"
            className="tn-round-btn"
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => (menu ? closeMenu() : setMenu(true))}
          >
            <Icon name="more" size={20} />
          </button>
          {menu ? (
            <NudgeMenu
              box={menuExit.ref}
              leaving={menuExit.leaving}
              now={now}
              onClose={closeMenu}
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

/**
 * Finch's sheet as a white card over the prompt: a round grey × at the top left, the menu's name as a
 * centred title, and a small tile before each row, as on the Settings rows for the same choices.
 */
function NudgeMenu({
  box,
  leaving,
  now,
  onClose,
  onSnooze,
  onQuiet,
}: {
  box: RefObject<HTMLDivElement | null>;
  leaving: boolean;
  now: number;
  onClose: () => void;
  onSnooze: (choice: SnoozeChoice) => void;
  onQuiet: () => void;
}) {
  const titleId = useId();
  useEffect(() => {
    // Never scroll the host page to reach it.
    box.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    const items = [...(box.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    const at = items.indexOf(event.target as HTMLButtonElement);
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      // From the ×, down goes to the first row and up to the last.
      const from = at < 0 ? (step > 0 ? -1 : items.length) : at;
      items[(from + step + items.length) % items.length]?.focus();
    }
  }

  return (
    <div ref={box} className="tn-menu tn-dialog-in" data-leaving={leaving || undefined} onKeyDown={onKeyDown}>
      <button type="button" className="tn-round-btn" aria-label="Close" onClick={onClose}>
        <Icon name="close" size={18} />
      </button>
      <p id={titleId} className="tn-menu__title">
        Prompt options
      </p>
      <div className="tn-menu__list" role="menu" aria-labelledby={titleId}>
        <button type="button" role="menuitem" onClick={() => onSnooze('30m')}>
          <IconTile icon="alarm" kind="soft" size={30} />
          <span>
            Snooze 30 min <span className="tn-menu__hint">· until {formatClock(now + 30 * 60_000)}</span>
          </span>
        </button>
        <button type="button" role="menuitem" onClick={() => onSnooze('1h')}>
          <IconTile icon="alarm" kind="soft" size={30} />
          Snooze 1 hour
        </button>
        <button type="button" role="menuitem" onClick={() => onSnooze('tomorrow')}>
          <IconTile icon="alarm" kind="soft" size={30} />
          Snooze until tomorrow
        </button>
        <hr className="tn-menu__divider" />
        <button type="button" role="menuitem" onClick={onQuiet}>
          <IconTile icon="moon" kind="soft" size={30} />
          Quiet mode
        </button>
      </div>
    </div>
  );
}

export const TOAST_MS = 6000;

/** One-line confirmation with Undo, as Finch's dark pill toast; leaves by itself after a few seconds. */
export function SnoozeToast({ message, onUndo, onClose }: { message: string; onUndo: () => void; onClose: () => void }) {
  // It drops away before it goes (slow in), whether closed or timed out.
  const exit = useExit<HTMLDivElement>();
  const { leave } = exit;
  useEffect(() => {
    const timer = setTimeout(() => leave(onClose), TOAST_MS);
    return () => clearTimeout(timer);
  }, [leave, onClose]);
  return (
    <div ref={exit.ref} className="tn-toast" role="status" data-leaving={exit.leaving || undefined}>
      <span className="tn-toast__text">{message}</span>
      <Button size="sm" variant="ghost" onClick={onUndo}>
        Undo
      </Button>
      <button type="button" className="tn-round-btn" aria-label="Close" onClick={() => leave(onClose)}>
        <Icon name="close" size={18} />
      </button>
      <span className="tn-toast__timer" style={{ animationDuration: `${TOAST_MS}ms` }} aria-hidden="true" />
    </div>
  );
}
