import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise, OrderExercise } from '../curriculum/types';
import { type AnswerCheck, checkAnswer, type ExerciseResponse, normalizeAnswer } from '../engine/answers';
import { AudioButtons } from './AudioButtons';
import { CheckIcon, CrossIcon } from './icons';

/** Stable pseudo-random order, so options do not jump around between renders. */
export function seededShuffle<T>(items: Array<T>, seed: string): Array<T> {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Tiles are shown without sentence-final punctuation, which would give away the last word. */
function tileLabel(word: string): string {
  return word.replace(/[.?!]+$/, '');
}

function lowerFirst(word: string): string {
  // Keep acronyms such as NS or BSN.
  return word.length > 1 && word === word.toUpperCase() ? word : word.charAt(0).toLowerCase() + word.slice(1);
}

function upperFirst(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function tileBank(exercise: OrderExercise, seed: string): Array<string> {
  // The sentence's capital letter would give away the first word; the answer line adds it back.
  const [first = '', ...rest] = exercise.words;
  const tiles = [lowerFirst(first), ...rest, ...(exercise.distractors ?? []).map(lowerFirst)];
  const shuffled = seededShuffle(tiles, seed);
  // Never present the answer already in order.
  return shuffled.join(' ') === tiles.join(' ') ? [...shuffled.slice(1), shuffled[0]!] : shuffled;
}

const KIND_TITLES: Record<Exercise['kind'], string> = {
  choice: 'Choose the answer',
  cloze: 'Fill the gap',
  order: 'Put the words in order',
  type: 'Write it in Dutch',
  write: 'Write a short message',
};

type Props = {
  exercise: Exercise;
  /** Seed for option order; include the lesson id so equal ids in different lessons differ. */
  seed: string;
  speechRate?: number;
  /** Grades and saves the first attempt. */
  onAnswer(response: ExerciseResponse): Promise<AnswerCheck>;
  /** Called when the learner moves on, with the result of the first attempt. */
  onContinue(check: AnswerCheck): void;
  /** Extra context shown in feedback, e.g. the lesson meaning. */
  meaning?: string;
  continueLabel?: string;
  /** Small label above the prompt; defaults to the exercise type. */
  label?: string;
};

export function ExerciseView({ exercise, seed, speechRate, onAnswer, onContinue, meaning, continueLabel = 'Continue', label }: Props) {
  const [choice, setChoice] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<Array<number>>([]);
  const [firstCheck, setFirstCheck] = useState<AnswerCheck | null>(null);
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const options = useMemo(
    () => (exercise.kind === 'choice' ? seededShuffle(exercise.options, `${seed}:${exercise.id}`) : []),
    [exercise, seed],
  );
  const tiles = useMemo(
    () => (exercise.kind === 'order' ? tileBank(exercise, `${seed}:${exercise.id}`).map(tileLabel) : []),
    [exercise, seed],
  );
  const finalPunctuation = exercise.kind === 'order' ? (exercise.words.at(-1)?.match(/[.?!]+$/)?.[0] ?? '') : '';

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
    else rootRef.current?.focus({ preventScroll: true });
  }, [exercise]);

  const response: ExerciseResponse =
    exercise.kind === 'choice' ? (choice ?? '') : exercise.kind === 'order' ? picked.map((i) => tiles[i]!) : text;
  const hasAnswer = exercise.kind === 'order' ? picked.length > 0 : typeof response === 'string' && response.trim() !== '';
  const answered = check !== null;
  const revealText = !exercise.listenOnly || answered;

  async function submit() {
    if (!hasAnswer || answered || busy) return;
    if (firstCheck) {
      // A retry after feedback: graded locally, not saved again.
      setCheck(checkAnswer(exercise, response));
      return;
    }
    setBusy(true);
    try {
      const result = await onAnswer(response);
      setFirstCheck(result);
      setCheck(result);
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setCheck(null);
    setText('');
    setPicked([]);
    setChoice(null);
    setTimeout(() => (inputRef.current ?? rootRef.current)?.focus({ preventScroll: true }), 0);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (exercise.kind === 'write' && !answered && !(event.metaKey || event.ctrlKey)) return;
      // A focused button handles its own Enter once feedback is showing (Continue / Try again).
      if (answered && (event.target as HTMLElement).tagName === 'BUTTON') return;
      event.preventDefault();
      if (answered) onContinue(firstCheck!);
      else void submit();
      return;
    }
    if (exercise.kind === 'choice' && !answered && /^[1-5]$/.test(event.key)) {
      const option = options[Number(event.key) - 1];
      if (option) setChoice(option);
    }
  }

  return (
    <div className="tn-screen" ref={rootRef} tabIndex={-1} onKeyDown={onKeyDown} style={{ outline: 'none' }}>
      <div className="tn-screen-body tn-stack tn-enter">
        <div className="tn-stack-sm">
          <span className="tn-label">{label ?? KIND_TITLES[exercise.kind]}</span>
          <h2 className="tn-title">{exercise.prompt}</h2>
        </div>

        {(exercise.audioText || exercise.passage) && (
          <div className="tn-prompt-card tn-stack-sm">
            {exercise.audioText && (
              <div className="tn-row">
                <AudioButtons text={exercise.audioText} rate={speechRate} label="Play the Dutch" />
                {revealText ? <span className="tn-dutch">{exercise.audioText}</span> : <span className="tn-muted">Listen, then answer.</span>}
              </div>
            )}
            {exercise.passage && <p className="tn-passage" lang="nl">{exercise.passage}</p>}
          </div>
        )}

        {exercise.kind === 'choice' && (
          <ul className="tn-options" role="radiogroup" aria-label="Answer options">
            {options.map((option, index) => {
              const state = !answered
                ? choice === option ? ' is-selected' : ''
                : option === exercise.answer ? ' is-correct' : option === choice ? ' is-wrong' : '';
              return (
                <li key={option}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={choice === option}
                    className={`tn-option${state}`}
                    disabled={answered}
                    onClick={() => setChoice(option)}
                  >
                    <span className="tn-option-key">{index + 1}</span>
                    <span>{option}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {exercise.kind === 'cloze' && (
          <div className="tn-stack-sm">
            <p className="tn-cloze" lang="nl">
              {exercise.sentence.split('___')[0]}
              <input
                ref={inputRef}
                className={`tn-input${answered ? (check!.correct ? ' is-correct' : ' is-wrong') : ''}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={answered}
                aria-label="Missing word"
                autoComplete="off"
                spellCheck={false}
                lang="nl"
              />
              {exercise.sentence.split('___')[1]}
            </p>
            {exercise.english && <p className="tn-muted">{exercise.english}</p>}
            {exercise.hint && !answered && <p className="tn-hint">Hint: {exercise.hint}</p>}
          </div>
        )}

        {exercise.kind === 'order' && (
          <div className="tn-stack-sm">
            <p className="tn-muted">{exercise.english}</p>
            <div className="tn-tiles tn-answer-line" aria-label="Your sentence" lang="nl">
              {picked.map((tileIndex, position) => (
                <button
                  type="button"
                  key={`${tileIndex}-${position}`}
                  className="tn-tile"
                  disabled={answered}
                  onClick={() => setPicked(picked.filter((_, i) => i !== position))}
                >
                  {position === 0 ? upperFirst(tiles[tileIndex]!) : tiles[tileIndex]}
                </button>
              ))}
              {finalPunctuation && <span className="tn-dutch" aria-hidden="true" style={{ alignSelf: 'center' }}>{finalPunctuation}</span>}
            </div>
            <div className="tn-tiles" aria-label="Word tiles" lang="nl">
              {tiles.map((tile, index) =>
                picked.includes(index) ? (
                  <span key={index} className="tn-tile is-ghost" aria-hidden="true">{tile}</span>
                ) : (
                  <button type="button" key={index} className="tn-tile" disabled={answered} onClick={() => setPicked([...picked, index])}>
                    {tile}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {exercise.kind === 'type' && (
          <div className="tn-stack-sm">
            <input
              ref={inputRef}
              className={`tn-input${answered ? (check!.correct ? ' is-correct' : ' is-wrong') : ''}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={answered}
              placeholder="Type in Dutch"
              aria-label="Your answer in Dutch"
              autoComplete="off"
              spellCheck={false}
              lang="nl"
            />
            {exercise.hint && !answered && <p className="tn-hint">Hint: {exercise.hint}</p>}
          </div>
        )}

        {exercise.kind === 'write' && (
          <div className="tn-stack-sm">
            <textarea
              ref={inputRef}
              className="tn-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={answered}
              placeholder="Schrijf in het Nederlands…"
              aria-label="Your message in Dutch"
              spellCheck={false}
              lang="nl"
            />
            <p className="tn-hint">At least {exercise.minWords} words. Press Ctrl/⌘ + Enter to check.</p>
          </div>
        )}
      </div>

      <div className={`tn-screen-footer${answered ? ' has-feedback' : ''}`}>
        {answered ? (
          <FeedbackSheet
            exercise={exercise}
            check={check!}
            response={response}
            meaning={meaning}
            canRetry={!check!.correct && exercise.kind !== 'choice'}
            onRetry={retry}
            onContinue={() => onContinue(firstCheck!)}
            continueLabel={continueLabel}
          />
        ) : (
          <button type="button" className="tn-btn tn-btn-primary tn-btn-block" disabled={!hasAnswer || busy} onClick={() => void submit()}>
            Check
          </button>
        )}
      </div>
    </div>
  );
}

/** The expected answer with the words the learner missed in bold. */
function HighlightedAnswer({ expected, response }: { expected: string; response: string }) {
  const given = new Set(normalizeAnswer(response).split(' '));
  return (
    <span lang="nl">
      {expected.split(' ').map((word, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {given.has(normalizeAnswer(word)) ? word : <strong style={{ textDecoration: 'underline' }}>{word}</strong>}
        </span>
      ))}
    </span>
  );
}

function FeedbackSheet({ exercise, check, response, meaning, canRetry, onRetry, onContinue, continueLabel }: {
  exercise: Exercise;
  check: AnswerCheck;
  response: ExerciseResponse;
  meaning?: string;
  canRetry: boolean;
  onRetry(): void;
  onContinue(): void;
  continueLabel: string;
}) {
  const [showWhy, setShowWhy] = useState(!check.correct);
  const responseText = Array.isArray(response) ? response.join(' ') : response;
  const isWrite = exercise.kind === 'write';

  return (
    <div className={`tn-feedback ${check.correct ? 'is-correct' : 'is-wrong'}`} role="status" aria-live="polite">
      <p className="tn-feedback-title">
        <span className="tn-feedback-icon">{check.correct ? <CheckIcon size={16} /> : <CrossIcon size={16} />}</span>
        {check.correct ? 'Correct!' : check.nearMiss ? 'Almost. Check the spelling' : isWrite ? 'Not quite there yet' : 'Incorrect'}
      </p>
      {isWrite && check.missing && check.missing.length > 0 && <p>Your message still needs: {check.missing.join('; ')}</p>}
      {(!check.correct || isWrite) && (
        <p>
          {isWrite ? 'Example answer: ' : 'Correct answer: '}
          {exercise.kind === 'choice' || isWrite ? <span lang="nl" style={{ whiteSpace: 'pre-wrap' }}>{check.expected}</span> : <HighlightedAnswer expected={check.expected} response={responseText} />}
        </p>
      )}
      {!check.correct && exercise.kind !== 'choice' && responseText.trim() !== '' && !isWrite && (
        <p>You wrote: <span lang="nl">{responseText}</span></p>
      )}
      {meaning && <p>Meaning: {meaning}</p>}
      {exercise.listenOnly && exercise.audioText && <p>You heard: <span lang="nl">{exercise.audioText}</span></p>}
      {showWhy ? <p>{exercise.explanation}</p> : <button type="button" className="tn-link" onClick={() => setShowWhy(true)}>Why?</button>}
      <div className="tn-row" style={{ marginTop: 12 }}>
        {canRetry && (
          <button type="button" className="tn-btn tn-btn-outline" onClick={onRetry}>
            Try again
          </button>
        )}
        <button type="button" className={`tn-btn tn-btn-block ${check.correct ? 'tn-btn-success' : 'tn-btn-danger'}`} style={{ marginTop: 0, flex: 1 }} onClick={onContinue} autoFocus>
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
