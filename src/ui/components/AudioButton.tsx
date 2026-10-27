import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { SLOW_RATE, type ClipVoice, type Speaker } from '../../audio/speech';
import { Icon } from './Icon';

type SpeechSettings = { speaker: Speaker; rate: number };

const SpeechContext = createContext<SpeechSettings | null>(null);

export function SpeechProvider({ speaker, rate = 1, children }: { speaker: Speaker; rate?: number; children: ReactNode }) {
  return <SpeechContext.Provider value={{ speaker, rate }}>{children}</SpeechContext.Provider>;
}

export function useSpeech(): SpeechSettings {
  const value = useContext(SpeechContext);
  if (!value) throw new Error('useSpeech needs a SpeechProvider');
  return value;
}

type AudioButtonProps = {
  text: string;
  slow?: boolean;
  voice?: ClipVoice;
  size?: 'normal' | 'small';
  /** Play once when the text first appears (respecting the autoplay setting upstream). */
  autoPlay?: boolean;
  label?: string;
};

/** Plays Dutch. While it plays, the icon becomes bouncing bars (secondary action). */
export function AudioButton({ text, slow = false, voice, size = 'normal', autoPlay = false, label }: AudioButtonProps) {
  const { speaker, rate } = useSpeech();
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(true);

  async function play() {
    setPlaying(true);
    await speaker.speak(text, { rate: slow ? SLOW_RATE : rate, voice });
    if (mounted.current) setPlaying(false);
  }

  useEffect(() => {
    mounted.current = true;
    if (autoPlay) void play();
    return () => {
      mounted.current = false;
    };
    // Autoplay once per text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const classes = ['tn-audio', slow && 'tn-audio--slow', size === 'small' && 'tn-audio--small'].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={classes}
      onClick={() => void play()}
      aria-label={label ?? (slow ? `Play slowly: ${text}` : `Play: ${text}`)}
      data-playing={playing}
    >
      {playing ? (
        <span className="tn-audio__bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <Icon name={slow ? 'turtle' : 'speaker'} />
      )}
    </button>
  );
}
