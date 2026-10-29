// Small panel controls: switches, chip groups, the confirm dialog, the streak chip.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { IconTile } from '../components/IconTile';
import { useExit } from '../exit';

/** The small soft tile in front of a Settings row (Finch puts a small glyph before each row). */
export function RowTile({ icon }: { icon: IconName }) {
  return <IconTile icon={icon} kind="soft" size={32} />;
}

export function Toggle({
  label,
  checked,
  onChange,
  helper,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helper?: string;
  icon?: IconName;
}) {
  return (
    <div className="tn-row">
      {icon ? <RowTile icon={icon} /> : null}
      <div className="tn-row__text">
        <span className="tn-row__label">{label}</span>
        {helper ? <span className="tn-row__helper">{helper}</span> : null}
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} className="tn-switch" onClick={() => onChange(!checked)}>
        <span className="tn-switch__thumb" />
      </button>
    </div>
  );
}

export function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <div className="tn-chips" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="tn-choice-chip"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** A confirmation where the safe choice is the primary button. `danger` (red) is for choices that destroy something. */
export function ConfirmDialog({
  title,
  body,
  keep,
  confirm,
  onKeep,
  onConfirm,
  danger = true,
}: {
  title: string;
  body: string;
  keep: string;
  confirm: string;
  onKeep: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  const first = useRef<HTMLButtonElement>(null);
  // Keeping plays the dialog's exit first; confirming goes at once, as the reset happens.
  const exit = useExit<HTMLDivElement>();
  const keepLatest = useRef(onKeep);
  keepLatest.current = onKeep;
  const leave = exit.leave;
  useEffect(() => first.current?.focus({ preventScroll: true }), []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') leave(() => keepLatest.current());
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leave]);
  const keepNow = () => leave(() => keepLatest.current());
  return (
    <div ref={exit.ref} className="tn-overlay tn-overlay--center" role="dialog" aria-modal="true" aria-labelledby="tn-dialog-title" data-leaving={exit.leaving || undefined}>
      {/* Finch's dialog: a white card, a round grey × at the top left (the safe way out), a centred title. */}
      <div className="tn-dialog-card tn-dialog-in">
        <button type="button" className="tn-round-btn" aria-label="Close" onClick={keepNow}>
          <Icon name="close" size={18} />
        </button>
        <h2 id="tn-dialog-title" className="tn-dialog-card__title">
          {title}
        </h2>
        <p className="tn-muted">{body}</p>
        <Button ref={first} block onClick={keepNow}>
          {keep}
        </Button>
        <Button block variant="ghost" className={danger ? 'tn-dialog__danger' : undefined} onClick={onConfirm}>
          {confirm}
        </Button>
      </div>
    </div>
  );
}

/** The last streak a chip showed on this page: the shell remounts after a session, so growth is judged against it. */
let shownStreak: number | undefined;

export function StreakChip({ days }: { days: number }) {
  return <Streak key={days} days={days} />;
}

function Streak({ days }: { days: number }) {
  // When the streak grows, the chip bumps and its flame wobbles once (secondary action).
  const [grew] = useState(() => shownStreak !== undefined && days > shownStreak);
  useEffect(() => {
    shownStreak = days;
  }, [days]);
  return (
    <span className="tn-streak" aria-label={`${days}-day streak`} data-grew={grew || undefined}>
      <Icon name="flame" size={18} filled />
      {days}
    </span>
  );
}

/**
 * Finch's soft tile behind the selected tab. The tile slides; on each move its inner blob dips, hops
 * over the slide and lands (tn-tab-hop), but not when the panel first shows.
 */
export function TabTile({ index, hidden }: { index: number; hidden: boolean }) {
  const last = useRef(index);
  const moved = useRef(false);
  if (last.current !== index) {
    last.current = index;
    moved.current = true;
  }
  return (
    <span className="tn-tabbar__tile" aria-hidden="true" data-hidden={hidden || undefined} style={{ '--tab': index } as CSSProperties}>
      <span key={index} className="tn-tabbar__blob" data-hop={moved.current || undefined} />
    </span>
  );
}

/** The 3-segment onboarding progress. */
export function Segments({ count, current }: { count: number; current: number }) {
  return (
    <div className="tn-segments" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={count} aria-valuenow={current + 1}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} data-done={i <= current} />
      ))}
    </div>
  );
}

/** Grouped settings card with a caps label. */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tn-group">
      <h2 className="tn-label">{title}</h2>
      <div className="tn-group__card">{children}</div>
    </section>
  );
}

/** Signal bars for the level rows: how much Dutch, at a glance. */
export function SignalBars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <svg className="tn-signal" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={4 + i * 6} y={16 - i * 5} width="4" height={4 + i * 5} rx="1.5" fill={i < level ? 'var(--primary)' : 'var(--line-strong)'} />
      ))}
    </svg>
  );
}
