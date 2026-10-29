// Pieces shared by the lesson steps and exercises.
import { useState, type ReactNode } from 'react';
import type { DialogueLine } from '../../curriculum/types';
import { normalizeAnswer } from '../../engine/answers';
import { AudioButton } from '../components/AudioButton';
import { Icon } from '../components/Icon';

/** The bold, left-aligned instruction above every exercise. */
export function Instruction({ children }: { children: ReactNode }) {
  return <h2 className="tn-instruction">{children}</h2>;
}

/** Big play button plus the slow (turtle) button. */
export function AudioHeader({ text, autoPlay, voice }: { text: string; autoPlay?: boolean; voice?: 'a' | 'b' }) {
  return (
    <div className="tn-audio-header">
      <span className="tn-audio-header__main">
        <AudioButton text={text} autoPlay={autoPlay} voice={voice} />
      </span>
      <AudioButton text={text} slow voice={voice} />
    </div>
  );
}

/** A notice, message or timetable to read before answering. */
export function Passage({ text }: { text: string }) {
  return (
    <figure className="tn-passage">
      <p className="tn-passage__text" lang="nl">
        {text}
      </p>
    </figure>
  );
}

/** One chat line. The learner ("You") sits on the right, everyone else on the left with an avatar. */
export function Bubble({
  line,
  voice,
  mark,
  playing,
  translated: startTranslated = false,
}: {
  line: DialogueLine;
  voice: 'a' | 'b';
  mark?: 'correct' | 'wrong';
  playing?: boolean;
  translated?: boolean;
}) {
  const [translated, setTranslated] = useState(startTranslated);
  const mine = line.speaker === 'You';
  return (
    <div className={`tn-bubble-row${mine ? ' tn-bubble-row--mine' : ''}`}>
      {!mine ? (
        <span className="tn-avatar" aria-hidden="true">
          {line.speaker.slice(0, 1)}
        </span>
      ) : null}
      <div className={`tn-bubble${mark ? ` tn-bubble--${mark}` : ''}`} data-playing={playing || undefined}>
        <span className="tn-bubble__speaker">{line.speaker}</span>
        <p className="tn-bubble__dutch" lang="nl">
          {line.dutch}
        </p>
        {translated ? <p className="tn-bubble__english">{line.english}</p> : null}
        <div className="tn-bubble__tools">
          <AudioButton text={line.dutch} voice={voice} size="small" />
          <button
            type="button"
            className="tn-icon-btn tn-icon-btn--small"
            aria-pressed={translated}
            aria-label={translated ? 'Hide translation' : 'Show translation'}
            onClick={() => setTranslated((value) => !value)}
          >
            <Icon name="translate" size={18} />
          </button>
          {mark ? (
            <span className={`tn-bubble__mark tn-pop`} aria-label={mark === 'correct' ? 'Correct' : 'Incorrect'}>
              <Icon name={mark === 'correct' ? 'check' : 'cross'} size={14} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The voice for each speaker: the second distinct speaker gets the second voice. */
export function voicesFor(lines: ReadonlyArray<DialogueLine>): (speaker: string) => 'a' | 'b' {
  const speakers = [...new Set(lines.map((line) => line.speaker))];
  return (speaker) => (speakers.indexOf(speaker) === 1 ? 'b' : 'a');
}

export function Conversation({ lines, reply }: { lines: ReadonlyArray<DialogueLine>; reply?: { text: string; mark?: 'correct' | 'wrong' } }) {
  const voice = voicesFor([...lines, { speaker: 'You', dutch: '', english: '' }]);
  return (
    <div className="tn-chat">
      {lines.map((line, i) => (
        <Bubble key={i} line={line} voice={voice(line.speaker)} />
      ))}
      {reply ? <Bubble line={{ speaker: 'You', dutch: reply.text, english: '' }} voice={voice('You')} mark={reply.mark} /> : null}
    </div>
  );
}

/**
 * Dutch text with some words emphasised: those in `targets` (bold, blue) and
 * those in `missed` (bold, Sunset underline).
 */
/** Articles are part of a noun item ("de balie") but would light up every sentence on their own. */
const UNMARKED = new Set(['de', 'het', 'een']);

export function Highlighted({ text, targets = [] }: { text: string; targets?: ReadonlyArray<string> }) {
  const wanted = new Set(targets.flatMap((target) => normalizeAnswer(target).split(' ')).filter((word) => word && !UNMARKED.has(word)));
  return (
    <>
      {text.split(/(\s+)/).map((token, i) => {
        const plain = normalizeAnswer(token);
        return plain && wanted.has(plain) ? (
          <strong key={i} className="tn-target">
            {token}
          </strong>
        ) : (
          token
        );
      })}
    </>
  );
}

/** Model answer with the words the learner missed underlined. */
export function DiffText({ tokens }: { tokens: ReadonlyArray<{ text: string; missed: boolean }> }) {
  return (
    <>
      {tokens.map((token, i) =>
        token.missed ? (
          <span key={i} className="tn-miss">
            {token.text}
          </span>
        ) : (
          token.text
        ),
      )}
    </>
  );
}
