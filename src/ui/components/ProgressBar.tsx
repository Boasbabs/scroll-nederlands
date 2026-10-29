import { useEffect, useRef, useState } from 'react';
import { count as written } from '../format';

/** How long a bar takes to fill: --t-fill in motion.css. */
const FILL_MS = 400;

/**
 * The count inside a bar ticks up with the fill (secondary action). It jumps where motion is reduced
 * or there are no animation frames (tests).
 */
function useTicker(value: number, active: boolean): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    from.current = value;
    const still = typeof requestAnimationFrame !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches !== false;
    if (start === value || still || !active) {
      setShown(value);
      return undefined;
    }
    const began = performance.now();
    let frame = requestAnimationFrame(function tick(time) {
      const t = Math.min(1, Math.max(0, (time - began) / FILL_MS));
      setShown(Math.round(start + (value - start) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, active]);
  return shown;
}

/**
 * A progress bar that springs forward and glints when it advances. With `count`, the bar is thick and
 * carries the count inside, as Finch's quest bars do: `true` shows "value / max", a string shows itself.
 * `decorative` draws it in spans with no role, for inside a button whose own text gives the count.
 */
export function ProgressBar({
  value,
  max,
  label,
  thin = false,
  count,
  decorative = false,
}: {
  value: number;
  max: number;
  label?: string;
  thin?: boolean;
  count?: boolean | string;
  decorative?: boolean;
}) {
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

  const ticked = useTicker(value, count === true);
  const text = count === true ? `${written(ticked)} / ${written(max)}` : count || null;
  const classes = ['tn-progress', thin && !text && 'tn-progress--thin', text && 'tn-progress--count'].filter(Boolean).join(' ');
  const Part = decorative ? 'span' : 'div';
  const semantics = decorative
    ? { 'aria-hidden': true }
    : { role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': value };
  return (
    <Part className={classes} {...semantics}>
      <Part className="tn-progress__fill" data-bump={bump} style={{ width: `${percent}%` }} />
      {text ? (
        <>
          <span className="tn-progress__count" aria-hidden="true">
            {text}
          </span>
          <span className="tn-progress__count tn-progress__count--fill" aria-hidden="true" style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}>
            {text}
          </span>
        </>
      ) : null}
    </Part>
  );
}
