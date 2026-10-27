import { useEffect, useRef, useState } from 'react';

/** A progress bar that springs forward and glints when it advances. */
export function ProgressBar({ value, max, label, thin = false }: { value: number; max: number; label: string; thin?: boolean }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const previous = useRef(value);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (value > previous.current) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 700);
      previous.current = value;
      return () => clearTimeout(timer);
    }
    previous.current = value;
    return undefined;
  }, [value]);

  return (
    <div
      className={`tn-progress${thin ? ' tn-progress--thin' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="tn-progress__fill" data-bump={bump} style={{ width: `${percent}%` }} />
    </div>
  );
}
