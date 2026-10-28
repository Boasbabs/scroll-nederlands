// Runs a SessionPlan: top bar, one step at a time, feedback, then the end
// screen. Results go to learning.finish, so both surfaces share one schedule.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SessionPlan, SessionStep } from '../../engine/plan';
import type { ExerciseResult } from '../../engine/types';
import type { SessionOutcome } from '../../learning/actions';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { useEnv } from '../env';
import { useExit } from '../exit';
import { useHotkeys, type KeyHandlers } from '../hotkeys';
import { PlayerContext } from './context';
import { ExerciseStep } from './ExerciseStep';
import { SessionComplete, type CompleteAction, type SessionStats } from './SessionComplete';
import { ChunksCard, ContrastCard, DialogueCard, LearnCard, SpeakCard, WordCard } from './steps';

type Entry = { key: string; step: SessionStep; review: boolean };

type Finished = { outcome: SessionOutcome; stats: SessionStats };

type SessionPlayerProps = {
  plan: SessionPlan;
  /** Quit (confirmed) or closed. */
  onExit: () => void;
  onAction: (action: CompleteAction, outcome: SessionOutcome) => void;
};

function entryKey(step: SessionStep, index: number): string {
  return step.type === 'exercise' ? step.planned.key : `${step.type}:${index}`;
}

const SHORTCUTS: Array<[string, string]> = [
  ['Enter', 'Check, then continue'],
  ['1 – 9', 'Pick an answer'],
  ['Backspace', 'Remove the last word tile'],
  ['Esc', 'Close, or quit the lesson'],
  ['?', 'Show these shortcuts'],
];

export function SessionPlayer({ plan, onExit, onAction }: SessionPlayerProps) {
  const { learning, course, surface, sfx, now } = useEnv();
  const compact = surface === 'card';
  const root = useRef<HTMLDivElement>(null);
  const stepKeys = useRef<KeyHandlers>({});
  const lastUse = useRef(performance.now());
  // Grading and moving on can happen in one click (recall, writing), so the
  // queue and the tally are refs; `queue` state only re-renders.
  const queueRef = useRef<Array<Entry>>(plan.steps.map((step, i) => ({ key: entryKey(step, i), step, review: false })));
  const [queue, setQueue] = useState(queueRef.current);
  const [index, setIndex] = useState(0);
  const results = useRef<Array<ExerciseResult>>([]);
  const tally = useRef({ correct: 0, graded: 0 });
  const [combo, setCombo] = useState(0);
  const startedAt = useRef(now());
  const [skip, setSkip] = useState({ listen: false, speak: false });
  const [overlay, setOverlay] = useState<'quit' | 'help' | null>(null);
  // Sheets leave with their exit (falling back down) before they unmount.
  const exit = useExit<HTMLDivElement>();
  const closeOverlay = () => exit.leave(() => setOverlay(null));
  // A sheet starts below the panel as it rises; focusing it must not scroll the panel up to meet it.
  const sheetFirst = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (overlay) sheetFirst.current?.focus({ preventScroll: true });
  }, [overlay]);
  const [finished, setFinished] = useState<Finished | 'saving' | 'failed'>();

  const canTakeFocus = useCallback(() => surface === 'panel' || performance.now() - lastUse.current < 4000, [surface]);
  const context = useMemo(() => ({ stepKeys, canTakeFocus }), [canTakeFocus]);

  function skipped(entry: Entry, flags = skip): boolean {
    if (entry.step.type === 'speak') return flags.speak;
    return entry.step.type === 'exercise' && flags.listen && Boolean(entry.step.planned.exercise.listenOnly);
  }

  async function finish() {
    setFinished('saving');
    try {
      const outcome = await learning.finish(plan, results.current);
      sfx.play('complete');
      setFinished({ outcome, stats: { ...tally.current, ms: now() - startedAt.current } });
    } catch {
      setFinished('failed');
    }
  }

  function advance(from = index, list = queueRef.current, flags = skip) {
    let next = from + 1;
    while (next < list.length && skipped(list[next]!, flags)) next++;
    if (next >= list.length) void finish();
    else setIndex(next);
  }

  function graded(entry: Entry, correct: boolean, missedItemIds?: ReadonlyArray<string>) {
    if (entry.step.type !== 'exercise' || entry.review) return;
    const { planned } = entry.step;
    if (missedItemIds) {
      // Match pairs: one result per item, so one slip does not fail every pair.
      for (const itemId of planned.itemIds) {
        results.current.push({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: [itemId], correct: !missedItemIds.includes(itemId) });
      }
    } else {
      results.current.push({ exerciseId: planned.exerciseId, stage: planned.exercise.stage, itemIds: planned.itemIds, correct });
    }
    tally.current = { correct: tally.current.correct + (correct ? 1 : 0), graded: tally.current.graded + 1 };
    setCombo((current) => (correct ? current + 1 : 0));
    // Missed exercises come back at the end of a focused lesson, labelled Review.
    if (!correct && plan.kind === 'lesson' && plan.mode === 'focused') {
      queueRef.current = [...queueRef.current, { key: `${entry.key}:again`, step: entry.step, review: true }];
      setQueue(queueRef.current);
    }
  }

  function clickPrimary() {
    const scope = overlay ? '.tn-overlay' : '.tn-player__zone';
    root.current?.querySelector<HTMLButtonElement>(`${scope} [data-primary]:not(:disabled)`)?.click();
  }

  useHotkeys(
    {
      enter: clickPrimary,
      digit: (n) => (overlay ? undefined : stepKeys.current.digit?.(n)),
      backspace: () => (overlay ? undefined : stepKeys.current.backspace?.()),
      escape: () => (overlay ? closeOverlay() : finished ? undefined : setOverlay('quit')),
      help: () => (overlay === 'help' ? closeOverlay() : setOverlay('help')),
    },
    compact ? root : undefined,
  );

  const entry = queue[index];
  let body;
  if (finished === 'saving') {
    body = (
      <div className="tn-player__body tn-center">
        <p className="tn-muted">Saving…</p>
      </div>
    );
  } else if (finished === 'failed') {
    body = (
      <div className="tn-player__body tn-center">
        <p>Your answers could not be saved.</p>
        <Button onClick={() => void finish()} data-primary>
          Try again
        </Button>
      </div>
    );
  } else if (finished) {
    body = <SessionComplete plan={plan} outcome={finished.outcome} stats={finished.stats} onAction={(action) => onAction(action, finished.outcome)} />;
  } else if (entry) {
    const step = entry.step;
    const lesson = 'lessonId' in step ? course.lesson(step.lessonId) : undefined;
    const next = () => advance();
    if (step.type === 'learn' && lesson) body = <LearnCard key={entry.key} lesson={lesson} compact={compact} onContinue={next} />;
    else if (step.type === 'chunks') body = <ChunksCard key={entry.key} items={step.itemIds.flatMap((id) => course.item(id) ?? [])} onContinue={next} />;
    else if (step.type === 'dialogue' && lesson) body = <DialogueCard key={entry.key} lesson={lesson} onContinue={next} />;
    else if (step.type === 'word') {
      const item = course.item(step.itemId);
      if (item) body = <WordCard key={entry.key} item={item} onContinue={next} />;
    } else if (step.type === 'contrast') {
      const contrast = course.contrast(step.itemId);
      if (contrast) body = <ContrastCard key={entry.key} contrast={contrast} onContinue={next} />;
    } else if (step.type === 'speak' && lesson) {
      body = (
        <SpeakCard
          key={entry.key}
          lesson={lesson}
          onContinue={next}
          onCantSpeak={() => {
            const flags = { ...skip, speak: true };
            setSkip(flags);
            advance(index, queueRef.current, flags);
          }}
        />
      );
    } else if (step.type === 'exercise') {
      const { planned } = step;
      body = (
        <ExerciseStep
          key={entry.key}
          planned={planned}
          review={entry.review}
          recall={plan.kind === 'review' && planned.generated && planned.exercise.kind === 'type' && planned.exercise.stage === 'independentRecall'}
          onGraded={(correct, missed) => graded(entry, correct, missed)}
          onNext={next}
          onCantListen={() => {
            const flags = { ...skip, listen: true };
            setSkip(flags);
            advance(index, queueRef.current, flags);
          }}
        />
      );
    }
  }

  const reviewsLeft = plan.kind === 'review' ? queue.length - index : 0;
  const showBar = !finished || finished === 'saving';
  return (
    <PlayerContext.Provider value={context}>
      <div
        ref={root}
        className={`tn-player${compact ? ' tn-player--compact' : ''}`}
        onPointerDown={() => (lastUse.current = performance.now())}
        onKeyDown={() => (lastUse.current = performance.now())}
      >
        {showBar ? (
          <div className="tn-player__bar">
            {compact ? (
              <>
                <span className="tn-player__brand">Dutch</span>
                <span className="tn-player__count">
                  {Math.min(index + 1, queue.length)}/{queue.length}
                </span>
                <span className="tn-player__spacer" />
              </>
            ) : null}
            <button type="button" className="tn-round-btn" aria-label="Close lesson" onClick={() => setOverlay('quit')}>
              <Icon name="close" size={18} />
            </button>
            {compact ? null : <ProgressBar value={index} max={queue.length} label="Lesson progress" />}
            {combo >= 3 ? (
              <span className="tn-combo tn-pop" key={combo} aria-label={`${combo} correct in a row`}>
                <Icon name="flame" size={16} filled />
                {combo}
              </span>
            ) : null}
          </div>
        ) : null}
        {plan.kind === 'review' && showBar && !compact ? <p className="tn-player__caption">Review · {reviewsLeft} left</p> : null}
        {compact && showBar ? <ProgressBar value={index} max={queue.length} label="Lesson progress" thin /> : null}
        {body}
        {/* Finch's sheets: a round grey × at the top left (the safe way out, as Esc), a centred title. */}
        {overlay === 'quit' ? (
          <div ref={exit.ref} className="tn-overlay" role="dialog" aria-modal="true" aria-labelledby="tn-quit-title" data-leaving={exit.leaving || undefined}>
            <div className="tn-dialog-card tn-dialog-card--sheet tn-sheet-up">
              <button type="button" className="tn-round-btn" aria-label="Close" onClick={closeOverlay}>
                <Icon name="close" size={18} />
              </button>
              <h2 id="tn-quit-title" className="tn-dialog-card__title">
                Quit lesson?
              </h2>
              <p className="tn-muted">Your answers in this session won’t be saved.</p>
              <Button ref={sheetFirst} block onClick={closeOverlay} data-primary>
                Keep learning
              </Button>
              <Button block variant="ghost" className="tn-dialog__danger" onClick={onExit}>
                Quit
              </Button>
            </div>
          </div>
        ) : null}
        {overlay === 'help' ? (
          <div ref={exit.ref} className="tn-overlay" role="dialog" aria-modal="true" aria-labelledby="tn-keys-title" data-leaving={exit.leaving || undefined}>
            <div className="tn-dialog-card tn-dialog-card--sheet tn-sheet-up">
              <button type="button" className="tn-round-btn" aria-label="Close" onClick={closeOverlay}>
                <Icon name="close" size={18} />
              </button>
              <h2 id="tn-keys-title" className="tn-dialog-card__title">
                Keyboard shortcuts
              </h2>
              <dl className="tn-keys">
                {SHORTCUTS.map(([key, action]) => (
                  <div key={key}>
                    <dt>
                      <kbd>{key}</kbd>
                    </dt>
                    <dd>{action}</dd>
                  </div>
                ))}
              </dl>
              <Button ref={sheetFirst} block variant="secondary" onClick={closeOverlay} data-primary>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </PlayerContext.Provider>
  );
}
