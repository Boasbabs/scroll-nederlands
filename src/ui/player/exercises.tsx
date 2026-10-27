// The answer area of each exercise kind. The player owns the answer and the
// Check/feedback flow; these views only show the question and collect input.
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { ChoiceExercise, ClozeExercise, MatchExercise, OrderExercise, TypeExercise, WriteExercise } from '../../curriculum/types';
import { countWords, includedGroups } from '../../engine/answers';
import { seededRandom, shuffle, type PlannedExercise } from '../../engine/exercises';
import { useSpeech } from '../components/AudioButton';
import { Icon } from '../components/Icon';
import { useEnv } from '../env';
import { useAutoFocus, useStepKeys } from './context';
import type { Answer } from './grade';

type ViewProps<E> = {
  exercise: E;
  planned: PlannedExercise;
  /** Checked: the answer can no longer change. */
  locked: boolean;
  /** Once checked, whether the answer was right. */
  judged?: boolean;
  answer: Answer | undefined;
  onAnswer: (answer: Answer | undefined) => void;
};

function stagger(i: number): CSSProperties {
  return { '--i': i } as CSSProperties;
}

export function ChoiceView({ exercise, planned, locked, judged, answer, onAnswer }: ViewProps<ChoiceExercise>) {
  // Authored options often list the answer first, so the order is shuffled (stable per exercise).
  const options = useMemo(() => shuffle(exercise.options, seededRandom(planned.key)), [exercise.options, planned.key]);
  const chosen = answer?.kind === 'choice' ? answer.option : undefined;
  useStepKeys({
    digit: (n) => {
      const option = options[n - 1];
      if (!locked && option !== undefined) onAnswer({ kind: 'choice', option });
    },
  });
  return (
    <div className="tn-options" role="radiogroup" aria-label="Answers">
      {options.map((option, i) => {
        const isChosen = option === chosen;
        const state = !locked
          ? undefined
          : isChosen
            ? judged
              ? 'correct'
              : 'wrong'
            : option === exercise.answer
              ? 'answer'
              : undefined;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isChosen}
            className={`tn-option tn-settle-in${state === 'wrong' ? ' tn-shake' : ''}`}
            style={stagger(i)}
            data-state={state}
            disabled={locked}
            onClick={() => onAnswer({ kind: 'choice', option })}
          >
            <span className="tn-option__key" aria-hidden="true">
              {state === 'correct' || state === 'answer' ? <Icon name="check" size={14} /> : state === 'wrong' ? <Icon name="cross" size={14} /> : i + 1}
            </span>
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Tap a Dutch tile and its English partner. Mismatched items count as missed. */
export function MatchView({ exercise, planned, locked, onAnswer }: ViewProps<MatchExercise>) {
  const { speaker } = useSpeech();
  const { prefs } = useEnv();
  const pairs = exercise.pairs;
  const [left, right] = useMemo(() => {
    const random = seededRandom(planned.key);
    const indexes = pairs.map((_, i) => i);
    return [shuffle(indexes, random), shuffle(indexes, random)];
  }, [pairs, planned.key]);
  const [matched, setMatched] = useState<ReadonlySet<number>>(new Set());
  const [pick, setPick] = useState<{ side: 'dutch' | 'english'; pair: number } | null>(null);
  const [miss, setMiss] = useState<{ dutch: number; english: number } | null>(null);
  const missed = useRef(new Set<string>());

  function itemsOf(pair: number): Array<string> {
    const id = planned.itemIds[pair];
    return planned.itemIds.length === pairs.length && id ? [id] : planned.itemIds;
  }

  function choose(side: 'dutch' | 'english', pair: number) {
    if (locked || matched.has(pair) || miss) return;
    if (side === 'dutch' && prefs.autoplayAudio) void speaker.speak(pairs[pair]!.dutch);
    if (!pick || pick.side === side) {
      setPick(pick?.side === side && pick.pair === pair ? null : { side, pair });
      return;
    }
    setPick(null);
    const dutch = side === 'dutch' ? pair : pick.pair;
    const english = side === 'english' ? pair : pick.pair;
    if (dutch === english) {
      const next = new Set(matched).add(pair);
      setMatched(next);
      if (next.size === pairs.length) onAnswer({ kind: 'match', missedItemIds: [...missed.current] });
      return;
    }
    for (const id of [...itemsOf(dutch), ...itemsOf(english)]) missed.current.add(id);
    setMiss({ dutch, english });
    setTimeout(() => setMiss(null), 650);
  }

  function tile(side: 'dutch' | 'english', pair: number, i: number) {
    const done = matched.has(pair);
    const wrong = miss?.[side] === pair;
    return (
      <button
        key={pair}
        type="button"
        className={`tn-tile tn-match__tile tn-settle-in${wrong ? ' tn-shake' : ''}`}
        style={stagger(i)}
        aria-pressed={pick?.side === side && pick.pair === pair}
        data-state={done ? 'correct' : wrong ? 'wrong' : undefined}
        disabled={locked || done}
        lang={side === 'dutch' ? 'nl' : undefined}
        onClick={() => choose(side, pair)}
      >
        {side === 'dutch' ? pairs[pair]!.dutch : pairs[pair]!.english}
        {done ? (
          <span className="tn-match__check tn-pop" aria-hidden="true">
            <Icon name="check" size={12} />
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="tn-match">
      <div className="tn-match__col" aria-label="Dutch">
        {left.map((pair, i) => tile('dutch', pair, i))}
      </div>
      <div className="tn-match__col" aria-label="English">
        {right.map((pair, i) => tile('english', pair, i))}
      </div>
    </div>
  );
}

export function ClozeView({ exercise, locked, answer, onAnswer }: ViewProps<ClozeExercise>) {
  const [before = '', after = ''] = exercise.sentence.split(/_{2,}/);
  const [hinted, setHinted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useAutoFocus(input, !locked);
  const text = answer?.kind === 'text' ? answer.text : '';
  const model = exercise.answers[0] ?? '';
  return (
    <div className="tn-cloze">
      <p className="tn-cloze__sentence" lang="nl">
        {before}
        <input
          ref={input}
          className="tn-gap"
          value={text}
          disabled={locked}
          size={Math.max(4, model.length + 1)}
          aria-label="The missing word"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={hinted ? `${model.slice(0, 1)}…` : ''}
          onChange={(event) => onAnswer({ kind: 'text', text: event.target.value })}
        />
        {after}
      </p>
      {exercise.english ? <p className="tn-translation">{exercise.english}</p> : null}
      {hinted ? (
        <p className="tn-hint-text tn-rise-in">
          Starts with “{model.slice(0, 1)}”.{exercise.hint ? ` ${exercise.hint}` : ''}
        </p>
      ) : (
        <button type="button" className="tn-hint" onClick={() => setHinted(true)} disabled={locked}>
          <Icon name="bulb" size={18} />
          Hint
        </button>
      )}
    </div>
  );
}

/** Moves a tile from where it was to where it is now along an arc, landing with a small squash. */
function flyArc(element: HTMLElement, from: DOMRect) {
  if (typeof element.animate !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const to = element.getBoundingClientRect();
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  const control = { x: dx / 2, y: Math.min(dy, 0) - Math.min(56, 22 + Math.abs(dx) * 0.12) };
  const frames: Array<Keyframe> = [];
  for (let step = 0; step <= 8; step++) {
    const t = step / 8;
    const x = (1 - t) * (1 - t) * dx + 2 * (1 - t) * t * control.x;
    const y = (1 - t) * (1 - t) * dy + 2 * (1 - t) * t * control.y;
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${1 + 0.08 * Math.sin(Math.PI * t)})`, offset: t * 0.84 });
  }
  frames.push({ transform: 'scale(1.06, 0.92)', offset: 0.92 }, { transform: 'none', offset: 1 });
  element.animate(frames, { duration: 440, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
}

/** Word tiles: tap to place at the end of the answer, tap a placed tile to send it back. */
export function OrderView({ exercise, planned, locked, onAnswer }: ViewProps<OrderExercise>) {
  const tiles = useMemo(
    () => shuffle([...exercise.words, ...(exercise.distractors ?? [])].map((word, id) => ({ id, word })), seededRandom(planned.key)),
    [exercise.words, exercise.distractors, planned.key],
  );
  const [placed, setPlaced] = useState<Array<number>>([]);
  const elements = useRef(new Map<number, HTMLElement>());
  const flight = useRef<{ id: number; from: DOMRect } | null>(null);

  useLayoutEffect(() => {
    const current = flight.current;
    flight.current = null;
    const element = current && elements.current.get(current.id);
    if (current && element) flyArc(element, current.from);
  });

  function move(id: number) {
    if (locked) return;
    const element = elements.current.get(id);
    if (element) flight.current = { id, from: element.getBoundingClientRect() };
    const next = placed.includes(id) ? placed.filter((other) => other !== id) : [...placed, id];
    setPlaced(next);
    onAnswer(next.length > 0 ? { kind: 'tiles', words: next.map((other) => tiles.find((tile) => tile.id === other)!.word) } : undefined);
  }

  function removeLast() {
    const last = placed.at(-1);
    if (last !== undefined) move(last);
  }
  useStepKeys({ backspace: removeLast });

  const register = (id: number) => (element: HTMLElement | null) => {
    if (element) elements.current.set(id, element);
  };

  return (
    <div className="tn-build">
      <div className="tn-build__answer" aria-label="Your sentence">
        {placed.map((id) => {
          const tile = tiles.find((candidate) => candidate.id === id)!;
          return (
            <button key={id} ref={register(id)} type="button" className="tn-tile" lang="nl" disabled={locked} onClick={() => move(id)}>
              {tile.word}
            </button>
          );
        })}
        {placed.length > 0 && !locked ? (
          <button type="button" className="tn-icon-btn tn-build__back" aria-label="Remove the last word" onClick={removeLast}>
            <Icon name="backspace" size={20} />
          </button>
        ) : null}
      </div>
      <div className="tn-build__bank" aria-label="Words">
        {tiles.map((tile, i) =>
          placed.includes(tile.id) ? (
            <span key={tile.id} className="tn-tile tn-tile--ghost" aria-hidden="true">
              {tile.word}
            </span>
          ) : (
            <button
              key={tile.id}
              ref={register(tile.id)}
              type="button"
              className="tn-tile tn-settle-in"
              style={stagger(i)}
              lang="nl"
              disabled={locked}
              onClick={() => move(tile.id)}
            >
              {tile.word}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export function TypeView({ exercise, locked, answer, onAnswer }: ViewProps<TypeExercise>) {
  const input = useRef<HTMLTextAreaElement>(null);
  useAutoFocus(input, !locked);
  const text = answer?.kind === 'text' ? answer.text : '';
  return (
    <div className="tn-type">
      <textarea
        ref={input}
        className="tn-input tn-input--area"
        rows={2}
        lang="nl"
        placeholder="Type in Dutch"
        aria-label="Your answer in Dutch"
        value={text}
        disabled={locked}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(event) => onAnswer({ kind: 'text', text: event.target.value })}
      />
      {exercise.hint ? <p className="tn-hint-text">Hint: {exercise.hint}</p> : null}
    </div>
  );
}

export function WriteView({ exercise, locked, answer, onAnswer }: ViewProps<WriteExercise>) {
  const input = useRef<HTMLTextAreaElement>(null);
  useAutoFocus(input, !locked);
  const text = answer?.kind === 'text' ? answer.text : '';
  const words = countWords(text);
  const used = includedGroups(text, exercise.mustInclude);
  return (
    <div className="tn-write">
      <textarea
        ref={input}
        className="tn-input tn-input--area"
        rows={3}
        lang="nl"
        placeholder="Write in Dutch"
        aria-label="Your message in Dutch"
        value={text}
        disabled={locked}
        spellCheck={false}
        onChange={(event) => onAnswer({ kind: 'text', text: event.target.value })}
      />
      {/* Counts up to the minimum; past it, "21/12" would read as over a limit. */}
      <p className="tn-counter" aria-live="polite">
        {words < exercise.minWords ? `${words}/${exercise.minWords} words` : `${words} words`}
      </p>
      {locked ? (
        <div className="tn-model tn-rise-in">
          <span className="tn-label">Model answer</span>
          <p lang="nl">{exercise.modelAnswer}</p>
          <ul className="tn-checklist">
            {exercise.mustInclude.map((group, i) => (
              <li key={group.join('|')} data-done={used[i]}>
                <Icon name={used[i] ? 'check' : 'cross'} size={16} />
                <span>
                  Did you use <em lang="nl">{group[0]}</em>?
                </span>
              </li>
            ))}
            <li data-done={words >= exercise.minWords}>
              <Icon name={words >= exercise.minWords ? 'check' : 'cross'} size={16} />
              <span>At least {exercise.minWords} words</span>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
