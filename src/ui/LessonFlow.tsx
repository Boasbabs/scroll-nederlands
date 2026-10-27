import { useRef, useState } from 'react';
import type { Exercise, Lesson } from '../curriculum/types';
import { type AnswerCheck, checkAnswer } from '../engine/answers';
import { CHECKPOINT_PASS_SCORE } from '../engine/progress';
import { getInitialExercises } from '../engine/selection';
import type { LearningItemProgress, LearningMode } from '../engine/types';
import { getLesson } from '../curriculum';
import { AudioButtons } from './AudioButtons';
import { useEnv } from './env';
import { ExerciseView } from './ExerciseView';
import { CheckIcon, CrossIcon } from './icons';

export type FlowAction = { label: string; onClick(): void };

function TopBar({ step, total, onExit }: { step: number; total: number; onExit?: () => void }) {
  return (
    <div className="tn-topbar">
      {onExit && (
        <button type="button" className="tn-icon-btn" onClick={onExit} aria-label="Close lesson" title="Close (progress is saved)">
          <CrossIcon />
        </button>
      )}
      <div className="tn-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
        <span style={{ width: `${Math.round((step / Math.max(1, total)) * 100)}%` }} />
      </div>
    </div>
  );
}

export function LearnCard({ lesson, speechRate, compact, onContinue }: {
  lesson: Lesson;
  speechRate?: number;
  compact?: boolean;
  onContinue(): void;
}) {
  const examples = compact ? lesson.examples?.slice(0, 2) : lesson.examples;
  return (
    <div className="tn-screen">
      <div className="tn-screen-body tn-stack tn-enter">
        <div className="tn-stack-sm">
          <span className="tn-label">{lesson.kind === 'practice' ? 'Practice' : 'New'} · {lesson.title}</span>
          <p className="tn-muted" style={{ margin: 0 }}>{lesson.objective}</p>
        </div>

        <div className="tn-stack-sm">
          <div className="tn-phrase-block">
            <AudioButtons text={lesson.targetPhrase} rate={speechRate} />
            <div>
              <p className="tn-phrase" lang="nl">{lesson.targetPhrase}</p>
              <p className="tn-muted" style={{ margin: '4px 0 0', fontSize: 15 }}>{lesson.meaningEn}</p>
            </div>
          </div>
          <p className="tn-situation" style={{ margin: '12px 0 0' }}>{lesson.situation}</p>
        </div>

        {lesson.wordBreakdown && lesson.wordBreakdown.length > 0 && (
          <div>
            <h3 className="tn-h3">Word by word</h3>
            <dl className="tn-breakdown">
              {lesson.wordBreakdown.map((entry) => (
                <div key={entry.dutch} style={{ display: 'contents' }}>
                  <dt lang="nl">{entry.dutch}</dt>
                  <dd>{entry.english}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {lesson.patternExplanation && (
          <div>
            <h3 className="tn-h3">How it works</h3>
            <p style={{ margin: 0 }}>{lesson.patternExplanation}</p>
          </div>
        )}

        {examples && examples.length > 0 && (
          <div className="tn-stack-sm">
            <h3 className="tn-h3">Examples</h3>
            {examples.map((example) => (
              <div className="tn-example" key={example.dutch}>
                <AudioButtons text={example.dutch} rate={speechRate} slow={false} label={`Play: ${example.dutch}`} />
                <div>
                  <p className="tn-dutch" lang="nl">{example.dutch}</p>
                  <p className="tn-muted">{example.english}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {lesson.dialogue && lesson.dialogue.length > 0 && (
          <div>
            <div className="tn-row" style={{ marginBottom: 8 }}>
              <h3 className="tn-h3" style={{ margin: 0 }}>Dialogue</h3>
              <AudioButtons text={lesson.dialogue.map((line) => line.dutch).join(' ')} rate={speechRate} label="Play the dialogue" />
            </div>
            <ul className="tn-dialogue">
              {lesson.dialogue.map((line, index) => (
                <li key={index}>
                  <span className="tn-speaker">{line.speaker}</span>
                  <span lang="nl">{line.dutch}</span>
                  <span />
                  <span className="tn-muted">{line.english}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lesson.pronunciationTip && (
          <div className="tn-tip">
            <strong>Say it</strong>
            <p>{lesson.pronunciationTip}</p>
          </div>
        )}

        {lesson.speakingPrompt && (
          <div className="tn-notice">
            <strong>Out loud:</strong> {lesson.speakingPrompt}
          </div>
        )}
      </div>
      <div className="tn-screen-footer">
        <button type="button" className="tn-btn tn-btn-primary tn-btn-block" onClick={onContinue} autoFocus>
          Practise it
        </button>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function CompleteScreen({ title, subtitle, stats, missed, primary, secondary, speechRate }: {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string }>;
  missed: Array<Lesson>;
  primary: FlowAction;
  secondary?: FlowAction;
  speechRate?: number;
}) {
  return (
    <div className="tn-screen">
      <div className="tn-screen-body tn-stack tn-enter" style={{ textAlign: 'center' }}>
        <div className="tn-stack-sm" style={{ display: 'grid', justifyItems: 'center' }}>
          <span className="tn-success-mark"><CheckIcon size={26} /></span>
          <h2 className="tn-title">{title}</h2>
          <p className="tn-muted" style={{ margin: 0 }}>{subtitle}</p>
        </div>
        <div className="tn-tiles-row">
          {stats.map((stat) => (
            <div className="tn-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span className="tn-muted">{stat.label}</span>
            </div>
          ))}
        </div>
        {missed.length > 0 && (
          <div className="tn-stack-sm" style={{ textAlign: 'left' }}>
            <h3 className="tn-h3">Coming back soon for review</h3>
            {missed.map((lesson) => (
              <div className="tn-example" key={lesson.id}>
                <AudioButtons text={lesson.targetPhrase} rate={speechRate} slow={false} />
                <div>
                  <p className="tn-dutch" lang="nl">{lesson.targetPhrase}</p>
                  <p className="tn-muted">{lesson.meaningEn}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tn-screen-footer tn-stack-sm">
        <button type="button" className="tn-btn tn-btn-primary tn-btn-block" onClick={primary.onClick} autoFocus>
          {primary.label}
        </button>
        {secondary && (
          <button type="button" className="tn-btn tn-btn-ghost tn-btn-block" onClick={secondary.onClick}>
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}

type FlowProps = {
  mode: LearningMode;
  speechRate?: number;
  onExit?: () => void;
  primary: FlowAction;
  secondary?: FlowAction;
};

/** New lesson: learn card, then immediate practice, then a short summary. */
export function LessonFlow({ lesson, mode, speechRate, onExit, primary, secondary }: FlowProps & { lesson: Lesson }) {
  const { actions, now } = useEnv();
  const [exercises] = useState(() => getInitialExercises(lesson, mode));
  const [step, setStep] = useState(0); // 0 = learn card, 1..n = exercises, n+1 = done
  const results = useRef<Array<boolean>>([]);
  const startedAt = useRef(now());
  const total = exercises.length + 1;

  async function finishExercise(check: AnswerCheck) {
    results.current.push(check.correct);
    if (step === exercises.length) await actions.completeLesson(lesson.id, now());
    setStep(step + 1);
  }

  if (step > exercises.length) {
    const correct = results.current.filter(Boolean).length;
    const allCorrect = correct === results.current.length;
    return (
      <CompleteScreen
        title="Lesson complete!"
        subtitle={allCorrect ? 'First review is tomorrow.' : 'You will see this again shortly, with a bit more help.'}
        stats={[
          { label: 'Correct', value: `${correct}/${results.current.length}` },
          { label: 'New phrase', value: '1' },
          { label: 'Time', value: formatDuration(now() - startedAt.current) },
        ]}
        missed={allCorrect ? [] : [lesson]}
        primary={primary}
        secondary={secondary}
        speechRate={speechRate}
      />
    );
  }

  return (
    <div className="tn-screen">
      <TopBar step={step} total={total} onExit={onExit} />
      {step === 0 ? (
        <LearnCard lesson={lesson} speechRate={speechRate} compact={mode === 'micro'} onContinue={() => setStep(1)} />
      ) : (
        <ExerciseView
          key={exercises[step - 1]!.id}
          exercise={exercises[step - 1]!}
          seed={lesson.id}
          speechRate={speechRate}
          meaning={exercises[step - 1]!.kind === 'choice' ? undefined : lesson.meaningEn}
          onAnswer={(response) =>
            actions.answer({ lesson, exercise: exercises[step - 1]!, response, mode, now: now() })
          }
          onContinue={(check) => void finishExercise(check)}
        />
      )}
    </div>
  );
}

/** One due review exercise for an item, at the stage its level calls for. */
export function ReviewFlow({ lesson, exercise, item, mode, speechRate, onExit, onDone, reviewsLeft }: {
  lesson: Lesson;
  exercise: Exercise;
  item: LearningItemProgress;
  mode: LearningMode;
  speechRate?: number;
  onExit?: () => void;
  onDone(check: AnswerCheck): void;
  reviewsLeft?: number;
}) {
  const { actions, now } = useEnv();
  return (
    <div className="tn-screen">
      <TopBar step={1} total={2} onExit={onExit} />
      <ExerciseView
        exercise={exercise}
        seed={`${lesson.id}:${item.history.length}`}
        speechRate={speechRate}
        label={`Review · ${lesson.title}${reviewsLeft && reviewsLeft > 1 ? ` · ${reviewsLeft} due` : ''}`}
        meaning={exercise.kind === 'choice' ? undefined : lesson.meaningEn}
        onAnswer={(response) => actions.answer({ lesson, exercise, response, mode, now: now() })}
        onContinue={onDone}
      />
    </div>
  );
}

/** Cumulative checkpoint: formative feedback per item, scored at the end. */
export function CheckpointFlow({ lesson, speechRate, onExit, primary, secondary }: Omit<FlowProps, 'mode'> & { lesson: Lesson }) {
  const { actions, now } = useEnv();
  const [index, setIndex] = useState(-1); // -1 = intro
  const answers = useRef<Array<{ exercise: Exercise; correct: boolean }>>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean; lessonsToReview: Array<string> } | null>(null);
  const total = lesson.exercises.length;

  async function next(check: AnswerCheck) {
    answers.current.push({ exercise: lesson.exercises[index]!, correct: check.correct });
    if (index + 1 < total) {
      setIndex(index + 1);
      return;
    }
    const outcome = await actions.submitCheckpoint(lesson, answers.current, now());
    setResult(outcome);
  }

  if (result) {
    const correct = answers.current.filter((answer) => answer.correct).length;
    const missed = result.lessonsToReview.map((id) => getLesson(id)).filter((l): l is Lesson => l !== undefined);
    return (
      <CompleteScreen
        title={result.passed ? 'Checkpoint passed' : 'Checkpoint done'}
        subtitle={
          result.passed
            ? 'Practice feedback, not an official test result.'
            : `Aim for ${Math.round(CHECKPOINT_PASS_SCORE * 100)}%. The phrases below are back in your reviews; retake it any time.`
        }
        stats={[
          { label: 'Score', value: `${Math.round(result.score * 100)}%` },
          { label: 'Correct', value: `${correct}/${total}` },
          { label: 'To review', value: String(missed.length) },
        ]}
        missed={missed}
        primary={primary}
        secondary={secondary}
        speechRate={speechRate}
      />
    );
  }

  if (index === -1) {
    return (
      <div className="tn-screen">
        <TopBar step={0} total={total} onExit={onExit} />
        <div className="tn-screen-body tn-stack tn-enter">
          <span className="tn-label">Checkpoint</span>
          <h2 className="tn-title">{lesson.title}</h2>
          <p>{lesson.objective}</p>
          <p className="tn-muted">
            {total} mixed exercises using what you have learned. Each answer gets feedback; anything you miss goes back into your
            reviews. This is practice feedback, not a certificate.
          </p>
        </div>
        <div className="tn-screen-footer">
          <button type="button" className="tn-btn tn-btn-primary tn-btn-block" onClick={() => setIndex(0)} autoFocus>
            Start checkpoint
          </button>
        </div>
      </div>
    );
  }

  const exercise = lesson.exercises[index]!;
  return (
    <div className="tn-screen">
      <TopBar step={index} total={total} onExit={onExit} />
      <ExerciseView
        key={exercise.id}
        exercise={exercise}
        seed={lesson.id}
        speechRate={speechRate}
        label={`Checkpoint · ${index + 1} of ${total}`}
        onAnswer={async (response) => checkAnswer(exercise, response)}
        onContinue={(check) => void next(check)}
      />
    </div>
  );
}
