// Teaching steps (not graded): the learn card, key phrases, the model
// dialogue, the speaking step, and the review recall card.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LearningItem, Lesson } from '../../curriculum/types';
import { normalizeAnswer } from '../../engine/answers';
import { AudioButton, useSpeech } from '../components/AudioButton';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useEnv } from '../env';
import { formatDuration } from '../format';
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
  const main = lesson.items[0];
  const breakdown = lesson.wordBreakdown ?? [];
  const meanings = new Map(breakdown.map((entry) => [normalizeAnswer(entry.dutch), entry.english]));
  const targets = lesson.items.map((item) => item.dutch);
  const examples = (lesson.examples ?? []).slice(0, compact ? 1 : 2);
  return (
    <>
      <StepBody label="Learn">
        <span className="tn-label">{KIND_LABEL[main?.kind ?? 'phrase']}</span>
        <h2 className="tn-phrase" lang="nl">
          {lesson.targetPhrase.split(/(\s+)/).map((token, i) => {
            const meaning = meanings.get(normalizeAnswer(token));
            return meaning && breakdown.length > 1 ? <WordHint key={i} word={token} meaning={meaning} /> : token;
          })}
        </h2>
        <AudioHeader text={lesson.targetPhrase} autoPlay={prefs.autoplayAudio} />
        <p className="tn-translation">{lesson.meaningEn}</p>
        {!compact && breakdown.length > 1 ? (
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
                  <span className="tn-example__english">{example.english}</span>
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
                <span className="tn-chunk__english">
                  {item.english}
                  {item.note ? <span className="tn-chunk__note"> · {item.note}</span> : null}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </StepBody>
      <ActionZone>
        <Button block onClick={onContinue} data-primary>
          Continue
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

/** Review recall: think of the Dutch, reveal it, then say honestly whether you knew it. */
export function RecallCard({ item, onResult }: { item: LearningItem; onResult: (remembered: boolean) => void }) {
  const [revealed, setRevealed] = useState(false);
  const { prefs } = useEnv();
  return (
    <>
      <StepBody label="Recall">
        <Instruction>How do you say this in Dutch?</Instruction>
        <button
          type="button"
          className="tn-recall"
          aria-expanded={revealed}
          onClick={() => setRevealed(true)}
          disabled={revealed}
        >
          <span className="tn-recall__english">{item.english}</span>
          {revealed ? null : <span className="tn-muted">Tap to reveal</span>}
        </button>
        {revealed ? (
          <div className="tn-recall__answer tn-rise-in">
            <p className="tn-phrase tn-phrase--md" lang="nl">
              {item.dutch}
            </p>
            <AudioHeader text={item.dutch} autoPlay={prefs.autoplayAudio} />
            {item.note ? <p className="tn-muted">{item.note}</p> : null}
          </div>
        ) : null}
      </StepBody>
      <ActionZone>
        {revealed ? (
          <>
            <p className="tn-zone-question">Did you remember it?</p>
            <div className="tn-zone-pair">
              <Button variant="secondary" onClick={() => onResult(false)}>
                No
              </Button>
              <Button onClick={() => onResult(true)}>Yes</Button>
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
