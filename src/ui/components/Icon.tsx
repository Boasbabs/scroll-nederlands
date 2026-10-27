// Rounded line icons on a 24px grid, drawn to match the brand's soft shapes.
const PATHS = {
  speaker: 'M4 9.5h3.2L12 5.5v13l-4.8-4H4z M15.5 9a4 4 0 0 1 0 6 M18 6.5a7.5 7.5 0 0 1 0 11',
  turtle:
    'M5 15.5c0-4 3-7 7-7s7 3 7 7z M3 15.5h18 M8 15.5l-1 3 M16 15.5l1 3 M19 12.5l2-1.5 M9.5 12l2.5-2 2.5 2 M12 10v5.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M6.5 6.5l11 11 M17.5 6.5l-11 11',
  close: 'M7 7l10 10 M17 7L7 17',
  chevron: 'M9.5 6l6 6-6 6',
  back: 'M14.5 6l-6 6 6 6',
  lock: 'M7 11V8.5a5 5 0 0 1 10 0V11 M5.5 11h13v9h-13z M12 14.5v2',
  star: 'M12 4l2.4 5 5.4.6-4 3.8 1.1 5.4L12 16.1 7.1 18.8l1.1-5.4-4-3.8 5.4-.6z',
  mic: 'M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3z M6 11.5a6 6 0 0 0 12 0 M12 17.5V20',
  play: 'M8 5.5v13l10.5-6.5z',
  stop: 'M7 7h10v10H7z',
  more: 'M6 12h.01 M12 12h.01 M18 12h.01',
  moon: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z',
  home: 'M4.5 11L12 4.5l7.5 6.5 M6.5 9.5V19.5h11V9.5',
  path: 'M6 19.5c0-4 12-3 12-7.5S6 8 6 4.5 M6 4.5h.01 M18 12h.01 M6 19.5h.01',
  chart: 'M5 19.5V11 M10 19.5V5 M15 19.5v-6 M20 19.5V9',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M12 3.5v2.2 M12 18.3v2.2 M3.5 12h2.2 M18.3 12h2.2 M6 6l1.6 1.6 M16.4 16.4L18 18 M6 18l1.6-1.6 M16.4 7.6L18 6',
  flag: 'M6 20.5V4.5 M6 5h11l-2 3.5 2 3.5H6',
  refresh: 'M19 8a7.5 7.5 0 1 0 .5 6 M19.5 4v4.5H15',
  book: 'M4.5 5.5c3-1 5.5-.5 7.5 1 2-1.5 4.5-2 7.5-1v13c-3-1-5.5-.5-7.5 1-2-1.5-4.5-2-7.5-1z M12 6.5v13',
  bolt: 'M13 3.5L6 13.5h5.5l-1 7 7-10H12z',
  flame: 'M12 3.5c.6 3.2 5 5 5 9.8a5 5 0 0 1-10 0c0-2.3 1.1-3.8 2.3-4.8.2 1.8 1 3 2.2 3.4-.3-3.2.1-5.6.5-8.4z',
  bulb: 'M9.5 17.5h5 M10.5 20.5h3 M12 3.5a5.5 5.5 0 0 0-3.3 9.9c.5.5.8 1.2.8 2.1h5c0-.9.3-1.6.8-2.1A5.5 5.5 0 0 0 12 3.5z',
  translate: 'M4 6h9 M8.5 4.5V6 M11 6c-.6 3.3-3 6.1-6.5 7.3 M6.6 9c1 1.9 2.7 3.4 4.9 4.3 M13 20.5l4-9.5 4 9.5 M14.4 17.2h5.2',
  backspace: 'M9 5.5h11v13H9l-5.5-6.5z M12 9.5l5 5 M17 9.5l-5 5',
  arrowUp: 'M12 19V5 M6 11l6-6 6 6',
  pause: 'M8.5 5.5v13 M15.5 5.5v13',
  keyboard: 'M3.5 6.5h17v11h-17z M7 10h.01 M10.5 10h.01 M14 10h.01 M17.5 10h.01 M8 14h8',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, title }: { name: IconName; size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name].split(' M').map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}
