import type { CSSProperties } from 'react';

/** Squiggles, stars and spirals, drawn tone on tone over a band (Dodger Blue on Warm Blue, Mid Blue on Dark Cerulean). */
export function SquigglePattern({ className = 'tn-band__pattern' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round">
        <path d="M-10 30c20-18 40 18 60 0s40-18 60 0" />
        <path d="M150 104c14-22 34-6 46-24s30-20 44-6" />
        <path d="M282 22c10 14 30 10 34-4s22-16 34 0" />
        <path d="M18 92c8-10 22-4 26 6" />
        <path d="M232 56c-6 14 8 26 20 20" />
      </g>
      <g fill="currentColor">
        <path d="M118 52l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" />
        <path d="M322 78l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
        <circle cx="74" cy="64" r="7" />
        <circle cx="262" cy="98" r="5" />
        <ellipse cx="200" cy="26" rx="16" ry="10" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <path d="M30 18m-9 0a9 9 0 1 0 18 0 5 5 0 1 0-10 0" />
        <path d="M352 52m-10 0a10 10 0 1 0 20 0 6 6 0 1 0-12 0" />
      </g>
    </svg>
  );
}

/** Two-tone wordmark: "Taal" in the surface's type colour, "Nudge" in Warm Blue (Golden Yellow on a band). */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="tn-wordmark" style={{ fontSize: size }} aria-label="TaalNudge">
      <span aria-hidden="true">Taal</span>
      <span aria-hidden="true">Nudge</span>
    </span>
  );
}

const SPARK_COLOURS = ['var(--golden-yellow)', 'var(--mango-orange)', 'var(--seaweed-green)', 'var(--dodger-blue)'];

/** Secondary action for a correct answer: a burst of sparks along radial arcs. */
export function Sparks({ count = 8, reach = 30 }: { count?: number; reach?: number }) {
  return (
    <span className="tn-sparks" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--angle': `${(360 / count) * i + 12}deg`,
              '--reach': `${reach + (i % 3) * 6}px`,
              '--c': SPARK_COLOURS[i % SPARK_COLOURS.length],
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

// Light palette colours and white, which all show on the Warm Blue field.
const CONFETTI_COLOURS = ['var(--golden-yellow)', 'var(--mango-orange)', 'var(--seaweed-green)', 'var(--denim-blue)', 'var(--white)'];

/**
 * Celebration confetti, as Finch scatters it over a completed goal: pieces burst from one point on
 * parabolic arcs, spinning, then fall away (straight-ahead action). The spread is fixed, not random,
 * so every celebration looks the same and screenshots are stable. Hidden under reduced motion.
 */
export function Confetti({ count = 32 }: { count?: number }) {
  return (
    <span className="tn-confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        // A golden-angle walk spreads the pieces evenly without looking regular.
        const turn = (i * 137.5) % 360;
        const side = Math.cos((turn * Math.PI) / 180);
        return (
          <i
            key={i}
            style={
              {
                '--dx': `${Math.round(side * (60 + (i % 5) * 26))}px`,
                '--rise': `${-70 - (i % 4) * 28}px`,
                '--fall': `${150 + (i % 6) * 34}px`,
                '--spin': `${(i % 2 ? 1 : -1) * (240 + (i % 3) * 160)}deg`,
                '--delay': `${(i % 4) * 30}ms`,
                '--w': `${i % 3 === 0 ? 6 : 8}px`,
                '--h': `${i % 3 === 0 ? 12 : 6}px`,
                '--c': CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
