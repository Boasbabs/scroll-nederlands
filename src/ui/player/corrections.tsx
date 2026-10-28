// The corrections loop (docs/fluent-forever-plan.md, Phase 6): writing goes to
// a tutor or a Dutch friend, and each change in the corrected version comes
// back as practice.
import { useState, type FormEvent } from 'react';
import type { Correction, Draft } from '../../corrections/types';
import type { DraftInput } from '../../learning/actions';
import { Button } from '../components/Button';
import { useEnv } from '../env';
import { plural } from '../format';

/** What goes to the clipboard: a one-line request, then the learner's text. */
export function correctionRequest(text: string): string {
  return `Kun je mijn Nederlands verbeteren? (Could you correct my Dutch? I'm learning.)\n\n${text.trim()}`;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(correctionRequest(text));
    return true;
  } catch {
    return false;
  }
}

/** When the clipboard says no: the request in a box, selected, to copy by hand. */
function CopyByHand({ text }: { text: string }) {
  return (
    <label className="tn-correction-form__label">
      <span>Copy it from here (⌘C or Ctrl+C)</span>
      <textarea className="tn-input tn-input--area tn-copy-box" rows={4} readOnly value={correctionRequest(text)} autoFocus onFocus={(event) => event.currentTarget.select()} />
    </label>
  );
}

function addedLine(added: ReadonlyArray<Correction>): string {
  return added.length > 0 ? `${plural(added.length, 'correction')} added to your reviews.` : 'No changes: it was right as you wrote it.';
}

/** Pasting the corrected version of a draft. */
export function CorrectionForm({ draftId, onDone, onCancel }: { draftId: string; onDone: (added: Array<Correction>) => void; onCancel: () => void }) {
  const { learning } = useEnv();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      onDone(await learning.correctDraft(draftId, text));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="tn-correction-form tn-rise-in" onSubmit={(event) => void submit(event)}>
      <label className="tn-correction-form__label">
        <span>Paste the corrected version</span>
        <textarea
          className="tn-input tn-input--area"
          rows={3}
          lang="nl"
          value={text}
          spellCheck={false}
          autoFocus
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <div className="tn-correction-form__actions">
        <Button size="sm" type="submit" disabled={!text.trim() || busy}>
          Save correction
        </Button>
        <button type="button" className="tn-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Under a writing exercise's model answer: copy the text with a request for a
 * corrector, or paste their corrected version straight away.
 */
export function GetItCorrected({ input }: { input: DraftInput }) {
  const { learning } = useEnv();
  const [draft, setDraft] = useState<Draft>();
  const [state, setState] = useState<'idle' | 'copied' | 'copy-failed' | 'adding'>('idle');
  const [result, setResult] = useState<string>();

  async function ensureDraft(): Promise<Draft> {
    if (draft) return draft;
    const saved = await learning.saveDraft(input);
    setDraft(saved);
    return saved;
  }

  if (result) {
    return (
      <p className="tn-correction tn-correction__done" role="status">
        {result}
      </p>
    );
  }
  return (
    <section className="tn-correction" aria-label="Get it corrected">
      <span className="tn-label">Get it corrected</span>
      {state === 'adding' && draft ? (
        <CorrectionForm draftId={draft.id} onDone={(added) => setResult(addedLine(added))} onCancel={() => setState('idle')} />
      ) : (
        <>
          <p className="tn-correction__text">
            {state === 'copied'
              ? 'Copied. Send it to a tutor or a Dutch friend. It waits on the Review tab until you add their correction.'
              : state === 'copy-failed'
                ? 'Send it to a tutor or a Dutch friend. It waits on the Review tab until you add their correction.'
                : 'A tutor or a Dutch friend can correct it. Each change comes back as practice.'}
          </p>
          {state === 'copy-failed' ? <CopyByHand text={input.text} /> : null}
          <div className="tn-correction__actions">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                // Copy inside the click: the clipboard wants the user's gesture.
                const copied = copy(input.text);
                void ensureDraft().then(async () => setState((await copied) ? 'copied' : 'copy-failed'));
              }}
            >
              Copy for correction
            </Button>
            <button type="button" className="tn-link" onClick={() => void ensureDraft().then(() => setState('adding'))}>
              Add the corrected version
            </button>
          </div>
        </>
      )}
    </section>
  );
}

const dateOf = (at: number) => new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** One text on the Review tab, waiting for its correction. */
function WaitingDraft({ draft, onChange, onCorrected }: { draft: Draft; onChange: () => void; onCorrected: (line: string) => void }) {
  const { learning } = useEnv();
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<string>();
  const [byHand, setByHand] = useState(false);
  return (
    <li className="tn-draft">
      <p className="tn-draft__text" lang="nl">
        {draft.text}
      </p>
      <p className="tn-muted tn-draft__meta">
        Written {dateOf(draft.at)}
        {draft.prompt ? ` · ${draft.prompt}` : ''}
      </p>
      {note ? <p className="tn-muted">{note}</p> : null}
      {byHand ? <CopyByHand text={draft.text} /> : null}
      {adding ? (
        <CorrectionForm
          draftId={draft.id}
          onDone={(added) => {
            setAdding(false);
            onCorrected(addedLine(added));
            onChange();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <div className="tn-draft__actions">
          <Button size="sm" onClick={() => setAdding(true)}>
            Add correction
          </Button>
          <button
            type="button"
            className="tn-link"
            onClick={() =>
              void copy(draft.text).then((ok) => {
                setNote(ok ? 'Copied.' : undefined);
                setByHand(!ok);
              })
            }
          >
            Copy again
          </button>
          <button type="button" className="tn-link" onClick={() => void learning.removeDraft(draft.id).then(onChange)}>
            Remove
          </button>
        </div>
      )}
    </li>
  );
}

/** The Review tab's list of writing waiting for a correction. */
export function WaitingForCorrection({ drafts, onChange }: { drafts: ReadonlyArray<Draft>; onChange: () => void }) {
  // Outlives the draft it is about: a corrected draft leaves the list.
  const [message, setMessage] = useState<string>();
  if (drafts.length === 0 && !message) return null;
  return (
    <section className="tn-panel-card tn-drafts">
      <h2 className="tn-label">Waiting for correction ({drafts.length})</h2>
      {message ? (
        <p className="tn-drafts__message" role="status">
          {message}
        </p>
      ) : null}
      {drafts.length > 0 ? (
        <ul className="tn-drafts__list">
          {drafts.map((draft) => (
            <WaitingDraft key={draft.id} draft={draft} onChange={onChange} onCorrected={setMessage} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
