// End of a session: lesson complete (the one celebration), review summary,
// checkpoint result, or the compact line in the in-page card.
import type { SessionPlan } from '../../engine/plan';
import { CHECKPOINT_PASS } from '../../engine/progress';
import { stageCheckpointId } from '../../engine/selection';
import type { SessionOutcome } from '../../learning/actions';
import { AudioButton } from '../components/AudioButton';
import { Button } from '../components/Button';
import { SquigglePattern, Sparks } from '../components/Decor';
import { Icon } from '../components/Icon';
import { useEnv } from '../env';
import { formatDuration, formatIn, plural } from '../format';

/** What the learner chose on the end screen; the surface decides what it means. */
export type CompleteAction = 'next' | 'course' | 'done' | 'again' | 'mistakes' | 'panel';

export type SessionStats = {
  /** First-try answers, one per exercise. */
  correct: number;
  graded: number;
  ms: number;
};

type SessionCompleteProps = {
  plan: SessionPlan;
  outcome: SessionOutcome;
  stats: SessionStats;
  onAction: (action: CompleteAction) => void;
};

function MissedList({ itemIds }: { itemIds: ReadonlyArray<string> }) {
  const { course } = useEnv();
  const items = itemIds.flatMap((id) => course.item(id) ?? []);
  if (items.length === 0) return null;
  return (
    <section className="tn-complete__missed">
      <h3 className="tn-label">Review these</h3>
      <ul className="tn-chunks">
        {items.map((item) => (
          <li key={item.id} className="tn-chunk">
            <AudioButton text={item.dutch} size="small" />
            <span>
              <span className="tn-chunk__dutch" lang="nl">
                {item.dutch}
              </span>
              <span className="tn-chunk__english">{item.english}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Correct in blue, incorrect in Sunset, as two segments of one ring. */
function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const r = 34;
  const length = 2 * Math.PI * r;
  const share = total > 0 ? correct / total : 0;
  return (
    <svg className="tn-ring" viewBox="0 0 84 84" width="84" height="84" aria-hidden="true">
      <circle cx="42" cy="42" r={r} fill="none" stroke="var(--sunset)" strokeWidth="10" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="10"
        strokeDasharray={`${share * length} ${length}`}
        transform="rotate(-90 42 42)"
        strokeLinecap={share > 0 && share < 1 ? 'round' : 'butt'}
      />
    </svg>
  );
}

export function SessionComplete({ plan, outcome, stats, onAction }: SessionCompleteProps) {
  const { course, surface, now } = useEnv();
  const lesson = plan.lessonId ? course.lesson(plan.lessonId) : undefined;

  if (surface === 'card') {
    return (
      <div className="tn-complete tn-complete--card tn-rise-in">
        <p className="tn-complete__line">
          <span className="tn-complete__tick tn-pop">
            <Icon name="check" size={18} />
          </span>
          <span>
            <strong>Done</strong> · {stats.correct}/{stats.graded} correct
            {outcome.nextReviewAt ? ` · next review ${formatIn(outcome.nextReviewAt, now())}` : ''}
          </span>
        </p>
        <div className="tn-complete__actions">
          <Button block onClick={() => onAction('done')} data-primary>
            Done
          </Button>
          <Button block variant="secondary" onClick={() => onAction('panel')}>
            Open side panel
          </Button>
        </div>
      </div>
    );
  }

  if (plan.kind === 'checkpoint' && outcome.checkpoint && lesson) {
    const total = stats.graded;
    const needed = Math.ceil(CHECKPOINT_PASS * total);
    const stageIndex = course.curriculum.stages.findIndex((stage) => stage.id === lesson.stageId);
    const stage = course.curriculum.stages[stageIndex];
    const nextStage = course.curriculum.stages[stageIndex + 1];
    const endsStage = stageCheckpointId(course, lesson.stageId) === lesson.id;
    const short = (title?: string) => title?.split(' · ')[0] ?? '';
    return (
      <div className="tn-complete">
        <div className="tn-player__body">
          <div className="tn-player__content tn-complete__checkpoint">
            <span className="tn-label">{lesson.title}</span>
            <div className="tn-score">
              <ScoreRing correct={stats.correct} total={total} />
              <div>
                <p className="tn-score__value tn-display">
                  {stats.correct}/{total}
                </p>
                <p className="tn-muted">{Math.round(outcome.checkpoint.score * 100)}%</p>
              </div>
            </div>
            <ul className="tn-score__legend">
              <li>
                <i style={{ background: 'var(--blue)' }} /> Correct {stats.correct}
              </li>
              <li>
                <i style={{ background: 'var(--sunset)' }} /> Incorrect {total - stats.correct}
              </li>
            </ul>
            <p className="tn-complete__verdict">
              {outcome.checkpoint.passed
                ? endsStage && nextStage
                  ? `${short(stage?.title)} complete. ${short(nextStage.title)} is unlocked.`
                  : 'Checkpoint passed.'
                : `Almost. You need ${needed}/${total}.`}
            </p>
            <MissedList itemIds={outcome.missedItemIds} />
          </div>
        </div>
        <div className="tn-player__zone">
          {outcome.checkpoint.passed ? (
            <Button block onClick={() => onAction('next')} data-primary>
              Continue
            </Button>
          ) : (
            <>
              <Button block onClick={() => onAction('mistakes')} disabled={outcome.missedItemIds.length === 0} data-primary>
                Review mistakes ({total - stats.correct})
              </Button>
              <Button block variant="secondary" onClick={() => onAction('course')}>
                Retake later
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (plan.kind === 'review') {
    const missed = outcome.missedItemIds.length;
    const missedIds = new Set(outcome.missedItemIds);
    const remembered = new Set(
      plan.steps.flatMap((step) => (step.type === 'exercise' ? step.planned.itemIds : [])).filter((id) => !missedIds.has(id)),
    ).size;
    return (
      <div className="tn-complete">
        <div className="tn-player__body">
          <div className="tn-player__content tn-complete__review">
            <span className="tn-complete__tick tn-complete__tick--lg tn-pop">
              <Icon name="check" size={28} />
            </span>
            <h2 className="tn-title">Review done</h2>
            <div className="tn-pills">
              <span className="tn-pill tn-pill--blue">Remembered {remembered}</span>
              <span className="tn-pill tn-pill--mango">Still learning {missed}</span>
            </div>
            <MissedList itemIds={outcome.missedItemIds} />
          </div>
        </div>
        <div className="tn-player__zone">
          <Button block onClick={() => onAction('done')} data-primary>
            Done
          </Button>
          {missed > 0 ? (
            <Button block variant="secondary" onClick={() => onAction('again')}>
              Review {missed} again
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const newCount = outcome.newItemIds.length;
  return (
    <div className="tn-complete">
      <div className="tn-player__body">
        <header className="tn-band tn-band--hero tn-complete__hero">
          <SquigglePattern />
          <span className="tn-complete__badge tn-land">
            <Icon name="star" size={34} />
            <Sparks count={10} reach={44} />
          </span>
          <h2 className="tn-title tn-complete__title">Lesson complete!</h2>
          <p className="tn-complete__subtitle">
            {newCount > 0 ? `${plural(newCount, 'new phrase')} · ` : ''}
            {lesson?.title}
          </p>
        </header>
        <div className="tn-player__content">
          <dl className="tn-stats tn-settle-in">
            <div>
              <dt>Correct</dt>
              <dd>
                {stats.correct}/{stats.graded}
              </dd>
            </div>
            <div>
              <dt>New</dt>
              <dd>{newCount}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatDuration(stats.ms)}</dd>
            </div>
          </dl>
          <MissedList itemIds={outcome.missedItemIds} />
        </div>
      </div>
      <div className="tn-player__zone">
        <Button block onClick={() => onAction('next')} data-primary disabled={outcome.next.type === 'finished'}>
          Continue
        </Button>
        <Button block variant="secondary" onClick={() => onAction('course')}>
          Back to course
        </Button>
      </div>
    </div>
  );
}
