// Phosphor icons on its 256-unit grid (paths and licence in ./phosphor.ts): the bold weight at rest,
// the fill weight for a selected tab and the streak, as learning apps do (docs/ux-research.md §11).
import { BOLD, FILL } from './phosphor';

const FILLED: Partial<Record<keyof typeof BOLD, string>> = FILL;

// Phosphor has no turtle, so the slow-audio button takes Lucide's (lucide-static 1.63.0, ISC licence:
// public/licenses/lucide.txt), drawn on its 24-unit grid and stroked at Phosphor's bold weight.
const TURTLE = [
  'm12 10 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4h4Z',
  'M4.82 7.9 8 10',
  'M15.18 7.9 12 10',
  'M16.93 10H20a2 2 0 0 1 0 4H2',
];

export type IconName = keyof typeof BOLD | 'turtle';

export function Icon({ name, size = 24, title, filled = false }: { name: IconName; size?: number; title?: string; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {name === 'turtle' ? (
        <g transform="scale(10.667)" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
          {TURTLE.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      ) : (
        <path d={(filled && FILLED[name]) || BOLD[name]} />
      )}
    </svg>
  );
}
