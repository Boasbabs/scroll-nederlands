// The in-page prompt's states: card → (menu → toast) or → micro-lesson → done.
import { useCallback, useState } from 'react';
import type { SessionPlan } from '../../engine/plan';
import type { SessionOutcome } from '../../learning/actions';
import { snoozeEnd, type SnoozeChoice } from '../../trigger/browsing';
import { Button } from '../components/Button';
import { useEnv } from '../env';
import { formatClock } from '../format';
import type { CompleteAction } from '../player/SessionComplete';
import { SessionPlayer } from '../player/SessionPlayer';
import { NudgeCard, SnoozeToast, type NudgePreview } from './NudgeCard';

/** What the page around the card does: the browsing trigger's side of things. */
export type NudgeController = {
  /** The prompt is finished with (dismissed, done or snoozed): browsing time restarts. */
  release: () => void;
  /** Items failed here are not offered again in this browsing session. */
  rememberFailed: (itemIds: ReadonlyArray<string>) => void;
  excludeItemIds: () => ReadonlySet<string>;
  /** Removes the card from the page. */
  close: () => void;
};

type State =
  | { name: 'card' }
  | { name: 'loading' }
  | { name: 'session'; plan: SessionPlan }
  | { name: 'empty' }
  | { name: 'toast'; message: string; undo: () => Promise<void> };

export function NudgeApp({ preview, controller }: { preview?: NudgePreview; controller: NudgeController }) {
  const { learning, prefs, setPrefs, now, openSidePanel } = useEnv();
  const [state, setState] = useState<State>({ name: 'card' });

  const finish = useCallback(() => {
    controller.release();
    controller.close();
  }, [controller]);

  async function learnNow() {
    setState({ name: 'loading' });
    const exclude = controller.excludeItemIds();
    const plan = (await learning.startNext('micro', exclude)) ?? (await learning.startPractice('micro'));
    setState(plan ? { name: 'session', plan } : { name: 'empty' });
  }

  async function snooze(choice: SnoozeChoice) {
    const previous = prefs.snoozeUntil;
    const until = snoozeEnd(choice, now());
    await setPrefs({ snoozeUntil: until });
    const label = choice === 'tomorrow' ? 'Snoozed until tomorrow' : `Snoozed until ${formatClock(until)}`;
    setState({ name: 'toast', message: label, undo: () => setPrefs({ snoozeUntil: previous }) });
  }

  async function quiet() {
    await setPrefs({ quietMode: true });
    setState({ name: 'toast', message: 'Quiet mode is on', undo: () => setPrefs({ quietMode: false }) });
  }

  function onAction(action: CompleteAction, outcome: SessionOutcome) {
    controller.rememberFailed(outcome.missedItemIds);
    if (action === 'panel') openSidePanel?.();
    finish();
  }

  switch (state.name) {
    case 'card':
      return <NudgeCard preview={preview} now={now()} onLearn={() => void learnNow()} onNotNow={finish} onSnooze={(choice) => void snooze(choice)} onQuiet={() => void quiet()} />;
    case 'toast':
      return (
        <SnoozeToast
          message={state.message}
          onUndo={() => void state.undo().then(() => setState({ name: 'card' }))}
          onClose={finish}
        />
      );
    case 'loading':
      return (
        <section className="tn-nudge tn-nudge--card" aria-busy="true" aria-label="Dutch practice">
          <p className="tn-muted">Getting your lesson…</p>
        </section>
      );
    case 'empty':
      return (
        <section className="tn-nudge tn-nudge--card" aria-label="Dutch practice">
          <p className="tn-nudge__title">All caught up</p>
          <p className="tn-nudge__preview">Nothing to practise right now. The next lesson is in the side panel.</p>
          <div className="tn-nudge__actions">
            <Button size="sm" onClick={finish}>
              Done
            </Button>
            {openSidePanel ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  openSidePanel();
                  finish();
                }}
              >
                Open side panel
              </Button>
            ) : null}
          </div>
        </section>
      );
    case 'session':
      return (
        <section className="tn-nudge tn-nudge--session" aria-label="Dutch practice">
          <SessionPlayer plan={state.plan} onExit={finish} onAction={onAction} />
        </section>
      );
  }
}
