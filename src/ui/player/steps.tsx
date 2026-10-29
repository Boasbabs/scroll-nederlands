// Teaching steps (not graded): the learn card, key phrases, the model
// dialogue, the speaking step, and the review recall card.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LearningItem, Lesson } from '../../curriculum/types';
import { normalizeAnswer } from '../../engine/answers';
import type { PairWord, SoundContrast } from '../../sounds/types';
import { bareWord } from '../../words/assemble';
import { AudioButton, useSpeech } from '../components/AudioButton';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { PictureFrame, usePicture } from '../components/Picture';
import { useEnv } from '../env';
import { formatDuration } from '../format';
import { HetIntro } from './het';
import { LeechPrompt, MakeItYours, NoteCue } from './notes';
import { AudioHeader, Bubble, Highlighted, Instruction, voicesFor } from './parts';

/** The scrolling content of a step. */
export function StepBody({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="tn-player__body" aria-label={label}>
      <div className="tn-player__content tn-step-in">{children}</div>
    </div>
  );
}

/** The pinned bottom zone that holds the one primary action. */
export function ActionZone({ children }: { children: ReactNode }) {
  return <div className="tn-player__zone">{children}</div>;
}

const KIND_LABEL: Record<LearningItem['kind'], string> = {
  phrase: 'New phrase',
  word: 'New word',
  pattern: 'New pattern',
  sound: 'New sound',
};

/**
 * Dutch first: whether the card's English is showing. With Show translations
 * off (the default), it waits behind a "Show meaning" link.
 */
function useMeaning(): [boolean, () => void] {
  const { prefs } = useEnv();
  const [shown, setShown] = useState(prefs.showTranslations);
  return [shown, () => setShown(true)];
}

function ShowMeaning({ onShow, label = 'Show meaning' }: { onShow: () => void; label?: string }) {
  return (
    <button type="button" className="tn-link tn-show-meaning" onClick={onShow}>
      {label}
    </button>
  );
}

/** A word of the phrase with a dotted underline; tapping or hovering shows its meaning. */
function WordHint({ word, meaning }: { word: string; meaning: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" className="tn-word" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      {word}
      <span className="tn-word__hint" role="tooltip">
        {meaning}
      </span>
    </button>
  );
}

export function LearnCard({ lesson, compact, onContinue }: { lesson: Lesson; compact: boolean; onContinue: () => void }) {
  const { prefs } = useEnv();
  const [meaning, showMeaning] = useMeaning();
  const main = lesson.items[0];
  const breakdown = lesson.wordBreakdown ?? [];
  const meanings = new Map(breakdown.map((entry) => [normalizeAnswer(entry.dutch), entry.english]));
  const targets = lesson.items.map((item) => item.dutch);
  const examples = (lesson.examples ?? []).slice(0, compact ? 1 : 2);
  return (
    <>
      <StepBody label="Learn">
        <span className="tn-label">{KIND_LABEL[main?.kind ?? 'phrase']}</span>
        {main ? <PictureFrame itemId={main.id} alt="" /> : null}
        <h2 className="tn-phrase" lang="nl">
          {lesson.targetPhrase.split(/(\s+)/).map((token, i) => {
            const hint = meanings.get(normalizeAnswer(token));
            return hint && breakdown.length > 1 ? <WordHint key={i} word={token} meaning={hint} /> : token;
          })}
        </h2>
        <AudioHeader text={lesson.targetPhrase} autoPlay={prefs.autoplayAudio} />
        {main ? <HetIntro itemIds={[main.id]} /> : null}
        {meaning ? <p className="tn-translation">{lesson.meaningEn}</p> : <ShowMeaning onShow={showMeaning} />}
        {meaning && !compact && breakdown.length > 1 ? (
          <table className="tn-mini-table">
            <thead>
              <tr>
                <th scope="col">Dutch</th>
                <th scope="col">English</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((entry) => (
                <tr key={entry.dutch}>
                  <td lang="nl">{entry.dutch}</td>
                  <td>{entry.english}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {examples.length > 0 ? (
          <ul className="tn-examples">
            {examples.map((example) => (
              <li key={example.dutch} className="tn-example">
                <AudioButton text={example.dutch} size="small" />
                <span>
                  <span className="tn-example__dutch" lang="nl">
                    <Highlighted text={example.dutch} targets={targets} />
                  </span>
                  {meaning ? <span className="tn-example__english">{example.english}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {!compact && lesson.patternExplanation ? (
          <p className="tn-tip">
            <strong>Tip</strong>
            {lesson.patternExplanation}
          </p>
        ) : null}
        {lesson.pronunciationTip ? (
          <p className="tn-tip">
            <strong>Pronunciation</strong>
            {lesson.pronunciationTip}
          </p>
        ) : null}
        {main && !compact ? <MakeItYours item={main} /> : null}
      </StepBody>
      <ActionZone>
        <Button block onClick={onContinue} data-primary>
          Continue
        </Button>
      </ActionZone>
    </>
  );
}

export function ChunksCard({ items, onContinue }: { items: ReadonlyArray<LearningItem>; onContinue: () => void }) {
  const [meaning, showMeaning] = useMeaning();
  return (
    <>
      <StepBody label="Key phrases">
        <span className="tn-label">Key phrases</span>
        <ul className="tn-chunks">
          {items.map((item, i) => (
            <li key={item.id} className="tn-chunk tn-settle-in" style={{ '--i': i } as React.CSSProperties}>
              <AudioButton text={item.dutch} size="small" />
              <span>
                <span className="tn-chunk__dutch" lang="nl">
                  {item.dutch}
                </span>
                {meaning ? (
                  <span className="tn-chunk__english">
                    {item.english}
                    {item.note ? <span className="tn-chunk__note"> · {item.note}</span> : null}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        {meaning ? null : <ShowMeaning onShow={showMeaning} label="Show meanings" />}
        <HetIntro itemIds={items.map((item) => item.id)} />
      </StepBody>
      <ActionZone>
        <Button block onClick={onContinue} data-primary>
          Continue
        </Button>
      </ActionZone>
    </>
  );
}

/** A Dutch Google Images search for a word, opened in a new tab to find a picture. */
export function imageSearchUrl(dutch: string): string {
  return `https://www.google.com/search?tbm=isch&hl=nl&q=${encodeURIComponent(bareWord(dutch))}`;
}

/**
 * The learner's own picture: search Google Images in Dutch, copy an image,
 * paste it into the panel (or choose a file). It is made small and kept on
 * this computer only.
 */
export function PicturePicker({ item, onSaved, onClose }: { item: LearningItem; onSaved: () => void; onClose: () => void }) {
  const { pictures } = useEnv();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const take = useRef<(image: Blob | null | undefined) => Promise<void>>(async () => undefined);
  take.current = async (image) => {
    if (!image || !image.type.startsWith('image/')) {
      setError('That was not an image. Copy the image itself (right-click it, Copy image), not its link.');
      return;
    }
    if (!pictures?.save) return;
    setBusy(true);
    setError(undefined);
    try {
      await pictures.save(item.id, image);
      onSaved();
    } catch {
      setError('That image could not be used. Try another one.');
    } finally {
      setBusy(false);
    }
  };
  // Pasting anywhere in the panel works while the picker is open.
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = [...(event.clipboardData?.items ?? [])].find((entry) => entry.type.startsWith('image/'))?.getAsFile();
      if (!file && !event.clipboardData?.types.includes('Files')) return;
      event.preventDefault();
      void take.current(file);
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  return (
    <div className="tn-picker tn-rise-in" role="group" aria-label="Choose your own picture">
      <a className="tn-btn tn-btn--secondary tn-btn--sm" href={imageSearchUrl(item.dutch)} target="_blank" rel="noopener noreferrer">
        Search pictures of “{bareWord(item.dutch)}”
      </a>
      <p className="tn-picker__drop" aria-live="polite">
        {busy ? 'Saving…' : 'Copy a picture you like, then paste it here (⌘V or Ctrl+V).'}
      </p>
      <label className="tn-link tn-picker__file">
        Or choose a file
        <input type="file" accept="image/*" className="tn-visually-hidden" onChange={(event) => void take.current(event.target.files?.[0])} />
      </label>
      {error ? (
        <p className="tn-picker__error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="button" className="tn-link" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}

/** The word card's picture and, in the side panel, the way to choose your own. */
function WordPicture({ item }: { item: LearningItem }) {
  const { pictures, surface } = useEnv();
  const [version, setVersion] = useState(0);
  const [picking, setPicking] = useState(false);
  const picture = usePicture(item.id, version);
  const canChoose = surface === 'panel' && Boolean(pictures?.save);
  return (
    <>
      {picture ? <img className="tn-picture" src={picture.src} alt="" draggable={false} /> : null}
      {canChoose && picture !== undefined ? (
        picking ? (
          <PicturePicker
            item={item}
            onSaved={() => {
              setPicking(false);
              setVersion((value) => value + 1);
            }}
            onClose={() => setPicking(false)}
          />
        ) : (
          <div className="tn-picture-tools">
            <button type="button" className="tn-link" onClick={() => setPicking(true)}>
              {picture ? 'Change picture' : 'Add a picture'}
            </button>
            {picture?.own ? (
              <button type="button" className="tn-link" onClick={() => void pictures?.remove?.(item.id).then(() => setVersion((value) => value + 1))}>
                Remove my picture
              </button>
            ) : null}
          </div>
        )
      ) : null}
    </>
  );
}

/**
 * A new basic word: the Dutch with its article, audio and meaning. A word a
 * picture cannot show (tier 2) comes with its sentence, read like a lesson
 * example; its drills blank the word out of it.
 */
export function WordCard({ item, onContinue }: { item: LearningItem; onContinue: () => void }) {
  const { prefs } = useEnv();
  const [meaning, showMeaning] = useMeaning();
  return (
    <>
      <StepBody label="New word">
        <span className="tn-label">New word</span>
        <WordPicture item={item} />
        <h2 className="tn-phrase" lang="nl">
          {item.dutch}
        </h2>
        <AudioHeader text={item.dutch} autoPlay={prefs.autoplayAudio} />
        <HetIntro itemIds={[item.id]} />
        {item.example ? (
          <ul className="tn-examples">
            <li className="tn-example">
              <AudioButton text={item.example.dutch} size="small" />
              <span>
                <span className="tn-example__dutch" lang="nl">
                  <Highlighted text={item.example.dutch} targets={[item.dutch]} />
                </span>
                {meaning ? <span className="tn-example__english">{item.example.english}</span> : null}
              </span>
            </li>
          </ul>
        ) : null}
        {meaning ? (
          <>
            <p className="tn-translation">{item.english}</p>
            {item.note ? <p className="tn-muted">{item.note}</p> : null}
          </>
        ) : (
          <ShowMeaning onShow={showMeaning} />
        )}
        <MakeItYours item={item} />
      </StepBody>
      <ActionZone>
        <Button block onClick={onContinue} data-primary>
          Continue
        </Button>
      </ActionZone>
    </>
  );
}

function PairWordButton({ word }: { word: PairWord }) {
  return (
    <span className="tn-contrast__word">
      <AudioButton text={word.dutch} size="small" />
      <span>
        <span className="tn-contrast__dutch" lang="nl">
          {word.dutch}
        </span>
        <span className="tn-contrast__english">{word.english}</span>
      </span>
    </span>
  );
}

/** A new sound contrast: the two sounds, how they differ, and word pairs to play side by side. */
export function ContrastCard({ contrast, onContinue }: { contrast: SoundContrast; onContinue: () => void }) {
  const [first, second] = contrast.sounds;
  return (
    <>
      <StepBody label="Ear training">
        <span className="tn-label">Ear training</span>
        <h2 className="tn-phrase tn-contrast__title">
          <span lang="nl">{first}</span> <span className="tn-contrast__or">or</span> <span lang="nl">{second}</span>
        </h2>
        <p className="tn-tip">
          <strong>Listen for</strong>
          {contrast.tip}
        </p>
        <ul className="tn-contrast" aria-label="Word pairs">
          {contrast.pairs.map(([a, b], i) => (
            <li key={a.dutch} className="tn-contrast__pair tn-settle-in" style={{ '--i': i } as React.CSSProperties}>
              <PairWordButton word={a} />
              <PairWordButton word={b} />
            </li>
          ))}
        </ul>
        <p className="tn-muted">Play each pair until you hear the difference. Then pick the word you hear.</p>
      </StepBody>
      <ActionZone>
        <Button block onClick={onContinue} data-primary>
          Start listening
        </Button>
      </ActionZone>
    </>
  );
}

export function DialogueCard({ lesson, onContinue }: { lesson: Lesson; onContinue: () => void }) {
  const { speaker } = useSpeech();
  const lines = lesson.dialogue ?? [];
  const voice = voicesFor(lines);
  const [current, setCurrent] = useState(-1);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      speaker.stop();
    };
  }, [speaker]);

  async function playAll() {
    await speaker.speakDialogue(lines, (index) => {
      if (mounted.current) setCurrent(index);
    });
    if (mounted.current) setCurrent(-1);
  }

  return (
    <>
      <StepBody label="Dialogue">
        <span className="tn-label">Conversation</span>
        <Instruction>{lesson.situation}</Instruction>
        <Button variant="secondary" size="sm" onClick={() => void playAll()} aria-label="Play the whole conversation">
          <Icon name={current >= 0 ? 'pause' : 'play'} size={18} />
          {current >= 0 ? 'Playing…' : 'Play all'}
        </Button>
        <div className="tn-chat">
          {lines.map((line, i) => (
            <Bubble key={i} line={line} voice={voice(line.speaker)} playing={current === i} />
          ))}
        </div>
      </StepBody>
      <ActionZone>
        <Button block onClick={onContinue} data-primary>
          Continue
        </Button>
      </ActionZone>
    </>
  );
}

type RecorderState = 'idle' | 'recording' | 'recorded' | 'unavailable';

/** Records the learner for a few seconds so they can compare. Nothing leaves the page. */
function useRecorder(maxMs = 10_000) {
  const [state, setState] = useState<RecorderState>(
    typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia ? 'unavailable' : 'idle',
  );
  const [url, setUrl] = useState<string>();
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | undefined>(undefined);

  useEffect(() => () => recorder.current?.stream.getTracks().forEach((track) => track.stop()), []);
  useEffect(() => (url ? () => URL.revokeObjectURL(url) : undefined), [url]);
  useEffect(() => {
    if (state !== 'recording') return undefined;
    const started = Date.now();
    const timer = setInterval(() => {
      const ms = Date.now() - started;
      setElapsed(ms);
      if (ms >= maxMs) recorder.current?.stop();
    }, 200);
    return () => clearInterval(timer);
  }, [state, maxMs]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      const chunks: Array<Blob> = [];
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setUrl(URL.createObjectURL(new Blob(chunks, { type: media.mimeType })));
        setState('recorded');
      };
      recorder.current = media;
      media.start();
      setElapsed(0);
      setState('recording');
    } catch {
      setState('unavailable');
    }
  }

  return { state, url, elapsed, start, stop: () => recorder.current?.stop() };
}

export function SpeakCard({
  lesson,
  onContinue,
  onCantSpeak,
}: {
  lesson: Lesson;
  onContinue: () => void;
  onCantSpeak: () => void;
}) {
  const { canRecord } = useEnv();
  const recorder = useRecorder();
  const recordable = canRecord && recorder.state !== 'unavailable';
  const showRating = !recordable || recorder.state === 'recorded';

  function playMine() {
    if (recorder.url) void new Audio(recorder.url).play().catch(() => undefined);
  }

  return (
    <>
      <StepBody label="Speak">
        <span className="tn-label">Say it aloud</span>
        <Instruction>{lesson.speakingPrompt}</Instruction>
        <div className="tn-speak-card">
          <p className="tn-phrase tn-phrase--md" lang="nl">
            {lesson.targetPhrase}
          </p>
          <AudioHeader text={lesson.targetPhrase} />
        </div>
        {recordable ? (
          <div className="tn-recorder">
            {recorder.state === 'recorded' ? (
              <div className="tn-compare">
                <div className="tn-compare__row">
                  <span>Native</span>
                  <AudioButton text={lesson.targetPhrase} size="small" label="Play the native recording" />
                </div>
                <div className="tn-compare__row">
                  <span>You</span>
                  <button type="button" className="tn-audio tn-audio--small" onClick={playMine} aria-label="Play your recording">
                    <Icon name="play" />
                  </button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void recorder.start()}>
                  <Icon name="refresh" size={18} />
                  Record again
                </Button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="tn-mic"
                  data-recording={recorder.state === 'recording' || undefined}
                  onClick={() => (recorder.state === 'recording' ? recorder.stop() : void recorder.start())}
                  aria-label={recorder.state === 'recording' ? 'Stop recording' : 'Tap to record'}
                >
                  <Icon name={recorder.state === 'recording' ? 'stop' : 'mic'} size={30} />
                </button>
                {recorder.state === 'recording' ? (
                  <span className="tn-wave" aria-live="polite">
                    <span className="tn-wave__bars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    {formatDuration(recorder.elapsed)}
                  </span>
                ) : (
                  <span className="tn-muted">Tap to record</span>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="tn-muted">Play it, say it out loud, then play it again to compare.</p>
        )}
        <button type="button" className="tn-link" onClick={onCantSpeak}>
          Can’t speak now
        </button>
      </StepBody>
      <ActionZone>
        {showRating ? (
          <>
            <p className="tn-zone-question">How close was it?</p>
            <div className="tn-zone-pair">
              <Button variant="secondary" onClick={onContinue}>
                Not yet
              </Button>
              <Button onClick={onContinue}>Sounds right</Button>
            </div>
          </>
        ) : (
          <Button block variant="secondary" onClick={onContinue} data-primary>
            Continue
          </Button>
        )}
      </ActionZone>
    </>
  );
}

type RecallCardProps = {
  item: LearningItem;
  /** The cue in place of the English: a scene (a lesson's main phrase) or the item's picture. */
  situation?: string;
  picture?: string;
  /** The learner's own line about the item, shown beside the cue. */
  note?: string;
  /** It keeps slipping: a "No" offers "Make it yours" before moving on. */
  leech?: boolean;
  onGrade: (remembered: boolean) => void;
  onNext: () => void;
};

/** Review recall: think of the Dutch, reveal it, then say honestly whether you knew it. */
export function RecallCard({ item, situation, picture, note, leech, onGrade, onNext }: RecallCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [slipped, setSlipped] = useState(false);
  const { prefs } = useEnv();
  const english = <span className="tn-recall__english">{item.english}</span>;
  return (
    <>
      <StepBody label="Recall">
        <Instruction>{picture ? 'What is this in Dutch?' : situation ? 'What do you say?' : 'How do you say this in Dutch?'}</Instruction>
        <button
          type="button"
          className="tn-recall"
          aria-expanded={revealed}
          onClick={() => setRevealed(true)}
          disabled={revealed}
        >
          {picture ? <PictureFrame itemId={picture} alt={item.english} placeholder fallback={english} /> : situation ? <span className="tn-recall__scene">{situation}</span> : english}
          {revealed ? null : <span className="tn-muted">Tap to reveal</span>}
        </button>
        {note ? <NoteCue text={note} /> : null}
        {revealed ? (
          <div className="tn-recall__answer tn-rise-in">
            <p className="tn-phrase tn-phrase--md" lang="nl">
              {item.dutch}
            </p>
            <AudioHeader text={item.dutch} autoPlay={prefs.autoplayAudio} />
            {picture || situation ? <p className="tn-translation">{item.english}</p> : null}
            {item.note ? <p className="tn-muted">{item.note}</p> : null}
          </div>
        ) : null}
        {slipped ? <LeechPrompt item={item} /> : null}
      </StepBody>
      <ActionZone>
        {slipped ? (
          <Button block onClick={onNext} data-primary>
            Continue
          </Button>
        ) : revealed ? (
          <>
            <p className="tn-zone-question">Did you remember it?</p>
            <div className="tn-zone-pair">
              <Button
                variant="secondary"
                onClick={() => {
                  onGrade(false);
                  if (leech) setSlipped(true);
                  else onNext();
                }}
              >
                No
              </Button>
              <Button
                onClick={() => {
                  onGrade(true);
                  onNext();
                }}
              >
                Yes
              </Button>
            </div>
          </>
        ) : (
          <Button block onClick={() => setRevealed(true)} data-primary>
            Show answer
          </Button>
        )}
      </ActionZone>
    </>
  );
}
