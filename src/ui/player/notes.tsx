// "Make it yours" (docs/fluent-forever-plan.md, Phase 4): one line about the
// learner's own life with the word. Reviews show it as a cue, and blank the
// word out when the line uses it.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { LearningItem } from '../../curriculum/types';
import { NOTE_MAX } from '../../storage/store';
import { Button } from '../components/Button';
import { useEnv } from '../env';

/** The learner's note on an item: undefined while loading, null when there is none. */
function useNote(itemId: string): [string | null | undefined, (text: string) => Promise<void>] {
  const { learning } = useEnv();
  const [note, setNote] = useState<string | null>();
  useEffect(() => {
    let live = true;
    learning.readNotes().then(
      (notes) => live && setNote(notes[itemId]?.text ?? null),
      () => live && setNote(null),
    );
    return () => {
      live = false;
    };
  }, [learning, itemId]);
  async function save(text: string) {
    const notes = await learning.saveNote(itemId, text);
    setNote(notes[itemId]?.text ?? null);
  }
  return [note, save];
}

function NoteForm({ item, initial = '', onSave, onCancel }: { item: LearningItem; initial?: string; onSave: (text: string) => Promise<void>; onCancel: () => void }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => field.current?.focus({ preventScroll: true }), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || (!text.trim() && !initial)) return;
    setBusy(true);
    try {
      await onSave(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="tn-note-form tn-rise-in" onSubmit={(event) => void submit(event)}>
      <label className="tn-note-form__label">
        <span>
          One line about your own life with “<span lang="nl">{item.dutch}</span>”
        </span>
        <input
          ref={field}
          className="tn-input"
          value={text}
          maxLength={NOTE_MAX}
          placeholder="In Dutch if you can"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <p className="tn-note-form__helper">Use the word itself, and reviews will ask you to fill it in.</p>
      <div className="tn-note-form__actions">
        <Button size="sm" type="submit" disabled={busy || (!text.trim() && !initial)}>
          {text.trim() || !initial ? 'Save' : 'Remove note'}
        </Button>
        <button type="button" className="tn-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** On a learn or word card: the learner's note, or a link to write one. Optional. */
export function MakeItYours({ item }: { item: LearningItem }) {
  const [note, save] = useNote(item.id);
  const [open, setOpen] = useState(false);
  if (note === undefined) return null;
  if (open) {
    return (
      <NoteForm
        item={item}
        initial={note ?? ''}
        onSave={async (text) => {
          await save(text);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    );
  }
  if (note) {
    return (
      <p className="tn-note">
        <span className="tn-label">Your note</span>
        <span className="tn-note__text">{note}</span>
        <button type="button" className="tn-link" onClick={() => setOpen(true)}>
          Edit
        </button>
      </p>
    );
  }
  return (
    <button type="button" className="tn-link tn-make-yours" onClick={() => setOpen(true)}>
      Make it yours
    </button>
  );
}

/** The learner's note shown as a cue in a review. */
export function NoteCue({ text }: { text: string }) {
  return (
    <p className="tn-note tn-note--cue">
      <span className="tn-label">Your note</span>
      <span className="tn-note__text">{text}</span>
    </p>
  );
}

/**
 * After a miss on an item that keeps slipping (leechCheck): the offer to
 * write a note. It is made once per item, so showing it is remembered.
 */
export function LeechPrompt({ item }: { item: LearningItem }) {
  const { learning } = useEnv();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    void learning.offerLeech(item.id).catch(() => undefined);
  }, [learning, item.id]);

  if (saved) {
    return (
      <p className="tn-leech" role="status">
        Saved. Your note comes back with this word.
      </p>
    );
  }
  return (
    <div className="tn-leech" role="group" aria-label="This one keeps slipping">
      <p className="tn-leech__text">
        <strong>This one keeps slipping.</strong> Make it yours: tie it to something in your own life.
      </p>
      {open ? (
        <NoteForm
          item={item}
          onSave={async (text) => {
            await learning.saveNote(item.id, text);
            setSaved(true);
          }}
          onCancel={() => setOpen(false)}
        />
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Make it yours
        </Button>
      )}
    </div>
  );
}
