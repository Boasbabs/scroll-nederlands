// The answer sheet that rises in place of Check (staging): a Seaweed Green tint
// and a green button when right, a Flush Mahogany tint and a red button when not.
import { useContext, useEffect, useRef, useState } from 'react';
import { diffTokens } from '../../engine/answers';
import { Button } from '../components/Button';
import { Sparks } from '../components/Decor';
import { Icon } from '../components/Icon';
import { PlayerContext } from './context';
import { DiffText } from './parts';

export type Feedback =
  | { type: 'correct'; note?: string; meaning?: string; explanation?: string }
  /** First miss on a typed or tile answer: one more go before the answer is shown. */
  | { type: 'retry' }
  | {
      type: 'wrong';
      expected: string;
      /** A typed or built answer, shown as "Your answer:". */
      given?: string;
      /** The option picked (already marked in the list): only used to find the words that differ. */
      chosen?: string;
      meaning?: string;
      explanation?: string;
    };

type FeedbackSheetProps = {
  feedback: Feedback;
  onContinue: () => void;
  onRetry?: () => void;
  onShowAnswer?: () => void;
};

export function FeedbackSheet({ feedback, onContinue, onRetry, onShowAnswer }: FeedbackSheetProps) {
  const [why, setWhy] = useState(false);
  const primary = useRef<HTMLButtonElement>(null);
  const player = useContext(PlayerContext);

  // Keep keyboard users in the flow: the sheet's button takes over from Check.
  useEffect(() => {
    if (player?.canTakeFocus()) primary.current?.focus({ preventScroll: true });
  }, [feedback.type, player]);

  if (feedback.type === 'correct') {
    return (
      <div className="tn-sheet tn-sheet--correct" role="status">
        <p className="tn-sheet__title">
          <span className="tn-sheet__mark">
            <Icon name="check" />
            <Sparks />
          </span>
          Correct!
        </p>
        {feedback.note ? <p className="tn-sheet__line">{feedback.note}</p> : null}
        {feedback.meaning ? (
          <p className="tn-sheet__line">
            <span className="tn-sheet__key">Meaning:</span> {feedback.meaning}
          </p>
        ) : null}
        {feedback.explanation ? <p className="tn-sheet__line tn-sheet__muted">{feedback.explanation}</p> : null}
        <Button ref={primary} block variant="correct" onClick={onContinue} data-primary>
          Continue
        </Button>
      </div>
    );
  }

  if (feedback.type === 'retry') {
    return (
      <div className="tn-sheet tn-sheet--wrong" role="status">
        <p className="tn-sheet__title">
          <span className="tn-sheet__mark">
            <Icon name="cross" />
          </span>
          Not quite
        </p>
        <p className="tn-sheet__line">Have another look and try once more.</p>
        <Button ref={primary} block variant="wrong" onClick={onRetry} data-primary>
          Try again
        </Button>
        <Button block variant="ghost" className="tn-sheet__text-btn" onClick={onShowAnswer}>
          Show answer
        </Button>
      </div>
    );
  }

  return (
    <div className="tn-sheet tn-sheet--wrong" role="status">
      <p className="tn-sheet__title">
        <span className="tn-sheet__mark">
          <Icon name="cross" />
        </span>
        Not quite
      </p>
      {feedback.given ? (
        <p className="tn-sheet__line tn-sheet__muted">
          <span className="tn-sheet__key">Your answer:</span> <DiffText tokens={diffTokens(feedback.given, feedback.expected)} />
        </p>
      ) : null}
      {feedback.expected ? (
        <>
          <p className="tn-sheet__key">Correct answer:</p>
          <p className="tn-sheet__answer" lang="nl">
            <DiffText tokens={diffTokens(feedback.expected, feedback.given ?? feedback.chosen ?? '')} />
          </p>
        </>
      ) : null}
      {feedback.meaning ? (
        <p className="tn-sheet__line">
          <span className="tn-sheet__key">Meaning:</span> {feedback.meaning}
        </p>
      ) : null}
      {why && feedback.explanation ? <p className="tn-sheet__why tn-rise-in">{feedback.explanation}</p> : null}
      <div className="tn-sheet__actions">
        {feedback.explanation ? (
          <Button variant="secondary" onClick={() => setWhy((value) => !value)} aria-expanded={why}>
            Why?
          </Button>
        ) : null}
        <Button ref={primary} block variant="wrong" onClick={onContinue} data-primary>
          Got it
        </Button>
      </div>
    </div>
  );
}
