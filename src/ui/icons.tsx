type IconProps = { size?: number };

function Svg({ size = 18, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const SpeakerIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </Svg>
);
export const SlowIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 16c0-4 3-7 7-7s7 3 7 7H4Z" />
    <path d="M18 14h2a2 2 0 0 0 0-4h-1M6 16v2M16 16v2" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12 5 5 9-10" />
  </Svg>
);
export const CrossIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const MoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Svg>
);
export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const ChevronIcon = (p: IconProps & { open?: boolean }) => (
  <span style={{ display: 'inline-flex', transition: 'transform 200ms', transform: p.open ? 'rotate(90deg)' : 'none' }}>
    <Svg {...p}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  </span>
);
