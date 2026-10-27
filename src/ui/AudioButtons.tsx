import { useEffect, useRef, useState } from 'react';
import { useEnv } from './env';
import { SlowIcon, SpeakerIcon } from './icons';

const VOICE_HELP =
  'No Dutch voice is available, so audio is off. Install a Dutch (Netherlands) voice in your system speech settings, or use Chrome online to get "Google Nederlands".';

/** Play Dutch at normal speed, with an optional slow replay. */
export function AudioButtons({ text, rate = 0.9, slow = true, label = 'Play Dutch audio' }: {
  text: string;
  rate?: number;
  slow?: boolean;
  label?: string;
}) {
  const { speaker } = useEnv();
  const [playing, setPlaying] = useState<'normal' | 'slow' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function play(kind: 'normal' | 'slow') {
    setPlaying(kind);
    const result = await speaker.speak(text, { rate: kind === 'slow' ? Math.max(0.5, rate * 0.65) : rate });
    if (!result.ok) setNotice(result.reason === 'no-dutch-voice' ? VOICE_HELP : 'Speech is not supported in this browser.');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(null), 400 + text.length * 70);
  }

  return (
    <span className="tn-audio">
      <button type="button" className={`tn-icon-btn${playing === 'normal' ? ' is-playing' : ''}`} onClick={() => void play('normal')} aria-label={label} title={label}>
        <SpeakerIcon />
      </button>
      {slow && (
        <button type="button" className={`tn-icon-btn${playing === 'slow' ? ' is-playing' : ''}`} onClick={() => void play('slow')} aria-label="Play slowly" title="Play slowly">
          <SlowIcon />
        </button>
      )}
      {notice && (
        <span role="status" className="tn-notice" style={{ position: 'absolute', marginTop: 40, maxWidth: 300, zIndex: 3 }}>
          {notice}
        </span>
      )}
    </span>
  );
}
