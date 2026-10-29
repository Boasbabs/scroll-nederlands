// End of a session: lesson complete, words, ear training, review and checkpoint results, each on
// Finch's celebration field, in the side panel and inside the in-page card.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { SessionPlan } from '../../engine/plan';
import { CHECKPOINT_PASS } from '../../engine/progress';
import { isLessonDone, packOfScene, stageCheckpointId } from '../../engine/selection';
import type { SessionOutcome, Snapshot } from '../../learning/actions';
import { contrastLabel } from '../../sounds/assemble';
import { AudioButton } from '../components/AudioButton';
import { Button } from '../components/Button';
import { Confetti } from '../components/Decor';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { useEnv } from '../env';
import { formatDuration, formatIn, packTerms, plural } from '../format';

/**
 * What the learner chose on the end screen; the surface decides what it means.
 * After a pack scene: `scene` plays the pack's next scene, `pack` opens the pack's page.
 */
export type CompleteAction = 'next' | 'course' | 'done' | 'again' | 'mistakes' | 'panel' | 'scene' | 'pack';

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
    <section className="tn-complete__missed tn-settle-in" style={{ '--i': 4 } as CSSProperties}>
      <h3 className="tn-complete__section">Review these</h3>
      <ul className="tn-chunks tn-complete__card">
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

type Pill = { label?: string; value: string; mark?: 'correct' | 'wrong' | 'now' };
const MARKS = { correct: 'check', wrong: 'cross', now: 'refresh' } as const;
type Bar = { from: number; to: number; max: number; label: string };
type FieldProps = {
  cap: 'star' | 'check' | 'flag';
  celebrate?: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bar?: Bar;
  pills: ReadonlyArray<Pill>;
};

/**
 * Finch's celebration field, in Warm Blue: confetti, the bar filling to its new value with the
 * badge as its cap, the title, then the stats as translucent pills. A missed checkpoint gets the
 * same field without the confetti.
 */
function Field({ cap, celebrate = true, eyebrow, title, subtitle, bar, pills }: FieldProps) {
  // The bar shows where it was, then fills to where it is now once the field has arrived.
  const [shown, setShown] = useState(bar?.from ?? 0);
  useEffect(() => {
    if (!bar) return undefined;
    setShown(bar.from);
    const timer = setTimeout(() => setShown(bar.to), 320);
    return () => clearTimeout(timer);
  }, [bar?.from, bar?.to]);
  const badge = (
    <span className="tn-field__cap tn-land" data-cap={cap}>
      <Icon name={cap} size={cap === 'star' ? 24 : 22} />
    </span>
  );
  return (
    <header className="tn-field">
      {celebrate ? <Confetti /> : null}
      {eyebrow ? <span className="tn-field__eyebrow">{eyebrow}</span> : null}
      {bar ? (
        <div className="tn-field__meter">
          <ProgressBar value={shown} max={bar.max} label={bar.label} count />
          {badge}
        </div>
      ) : (
        badge
      )}
      <h2 className="tn-title tn-field__title">{title}</h2>
      {subtitle ? <p className="tn-field__subtitle">{subtitle}</p> : null}
      <ul className="tn-field__pills">
        {pills.map((pill, i) => (
          <li key={pill.label ?? pill.value} className="tn-field__pill tn-settle-in" style={{ '--i': i + 2 } as CSSProperties}>
            {pill.mark ? (
              <span className="tn-field__mark" data-mark={pill.mark}>
                <Icon name={MARKS[pill.mark]} size={12} />
              </span>
            ) : null}
            <span>
              {pill.label ? <span className="tn-field__pill-label">{pill.label} </span> : null}
              <strong>{pill.value}</strong>
            </span>
          </li>
        ))}
      </ul>
    </header>
  );
}

/** Where this session moved the learner, for the bar on the field: read once the session is saved. */
function useSnapshot() {
  const { learning } = useEnv();
  const [snap, setSnap] = useState<Snapshot>();
  useEffect(() => {
    let live = true;
    void learning.snapshot('focused').then((next) => live && setSnap(next));
    return () => {
      live = false;
    };
  }, [learning]);
  return snap;
}

export function SessionComplete({ plan, outcome, stats, onAction }: SessionCompleteProps) {
  const { course, surface, now } = useEnv();
  const lesson = plan.lessonId ? course.lesson(plan.lessonId) : undefined;
  const pack = lesson && packOfScene(course, lesson.id);
  const snap = useSnapshot();
  const summary = snap?.summary;

  // Each kind of session builds its field and its buttons; the panel shows them as they are.
  let field: FieldProps;
  let actions: ReactNode;
  if (plan.kind === 'checkpoint' && outcome.checkpoint && lesson) {
    const total = stats.graded;
    const needed = Math.ceil(CHECKPOINT_PASS * total);
    const stageIndex = course.curriculum.stages.findIndex((stage) => stage.id === lesson.stageId);
    const stage = course.curriculum.stages[stageIndex];
    const nextStage = course.curriculum.stages[stageIndex + 1];
    const endsStage = stageCheckpointId(course, lesson.stageId) === lesson.id;
    const short = (title?: string) => title?.split(' · ')[0] ?? '';
    const { passed } = outcome.checkpoint;
    field = {
      cap: 'flag',
      celebrate: passed,
      eyebrow: lesson.title,
      title: passed ? (endsStage && nextStage ? `${short(stage?.title)} complete. ${short(nextStage.title)} is unlocked.` : 'Checkpoint passed.') : `Almost. You need ${needed}/${total}.`,
      bar: { from: 0, to: stats.correct, max: total, label: 'Score' },
      pills: [
        { label: 'Correct', value: String(stats.correct), mark: 'correct' },
        { label: 'Incorrect', value: String(total - stats.correct), mark: 'wrong' },
        { value: `${Math.round(outcome.checkpoint.score * 100)}%` },
      ],
    };
    actions = passed ? (
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
    );
  } else if (plan.kind === 'review') {
    const missed = outcome.missedItemIds.length;
    const missedIds = new Set(outcome.missedItemIds);
    const reviewed = new Set(plan.steps.flatMap((step) => (step.type === 'exercise' ? step.planned.itemIds : [])));
    const remembered = [...reviewed].filter((id) => !missedIds.has(id)).length;
    field = {
      cap: 'check',
      title: 'Review done',
      bar: reviewed.size > 0 ? { from: 0, to: remembered, max: reviewed.size, label: 'Remembered' } : undefined,
      pills: [
        { label: 'Remembered', value: String(remembered), mark: 'correct' },
        { label: 'Still learning', value: String(missed), mark: 'now' },
      ],
    };
    actions = (
      <>
        <Button block onClick={() => onAction('done')} data-primary>
          Done
        </Button>
        {missed > 0 ? (
          <Button block variant="secondary" onClick={() => onAction('again')}>
            Review {missed} again
          </Button>
        ) : null}
      </>
    );
  } else {
    const newCount = outcome.newItemIds.length;
    const words = plan.kind === 'words';
    const sounds = plan.kind === 'sounds';
    const contrastStep = plan.steps.find((step) => step.type === 'contrast');
    const contrast = contrastStep?.type === 'contrast' ? course.contrast(contrastStep.itemId) : undefined;
    let title = 'Lesson complete!';
    let subtitle = `${newCount > 0 ? `${plural(newCount, 'new phrase')} · ` : ''}${lesson?.title ?? ''}`;
    // The bar this session moved: the module's lessons, the basic words met or the sound pairs met.
    let bar: Bar | undefined;
    if (words) {
      title = 'New words learned!';
      subtitle = plural(newCount, 'new word');
      if (summary) {
        const met = summary.words.total - summary.words.new;
        bar = { from: Math.max(0, met - newCount), to: met, max: summary.words.total, label: 'Core words met' };
      }
    } else if (sounds) {
      title = 'Ear training done!';
      subtitle = contrast ? `New sound pair: ${contrastLabel(contrast)}` : '';
      if (summary) {
        const met = summary.sounds.total - summary.sounds.new;
        bar = { from: Math.max(0, met - newCount), to: met, max: summary.sounds.total, label: 'Sound pairs met' };
      }
    } else if (pack && lesson) {
      title = `${packTerms(pack).Step} complete!`;
      if (snap) {
        const done = pack.scenes.filter((scene) => isLessonDone(snap.progress, scene.id)).length;
        bar = { from: Math.max(0, done - (newCount > 0 ? 1 : 0)), to: done, max: pack.scenes.length, label: `${pack.title}: ${packTerms(pack).step}s done` };
      }
    } else if (lesson && summary?.modules[lesson.moduleId]) {
      const count = summary.modules[lesson.moduleId]!;
      // New items mean a first completion; a replayed lesson leaves the count where it was.
      bar = { from: Math.max(0, count.completed - (newCount > 0 ? 1 : 0)), to: count.completed, max: count.total, label: 'Lessons done in this module' };
    }
    field = {
      cap: 'star',
      title,
      subtitle,
      bar,
      pills: [
        { label: 'Correct', value: `${stats.correct}/${stats.graded}` },
        { label: 'New', value: String(newCount) },
        { label: 'Time', value: formatDuration(stats.ms) },
      ],
    };
    // A scene leads on to the pack's next scene, in order; the last one back to the pack and its mission.
    const following = pack && lesson ? pack.scenes[pack.scenes.indexOf(lesson) + 1] : undefined;
    const terms = pack && packTerms(pack);
    actions = terms ? (
      <>
        {following ? (
          <Button block onClick={() => onAction('scene')} data-primary>
            Next {terms.step}
          </Button>
        ) : null}
        <Button block variant={following ? 'secondary' : 'primary'} onClick={() => onAction('pack')} data-primary={following ? undefined : true}>
          Back to the {terms.whole}
        </Button>
      </>
    ) : (
      <>
        <Button block onClick={() => onAction('next')} data-primary disabled={outcome.next.type === 'finished'}>
          Continue
        </Button>
        {words || sounds ? (
          <Button block variant="secondary" onClick={() => onAction('done')}>
            Done
          </Button>
        ) : (
          <Button block variant="secondary" onClick={() => onAction('course')}>
            Back to course
          </Button>
        )}
      </>
    );
  }

  if (surface === 'card') {
    // The micro-lesson ends on the same field inside the card: the same bar and badge, with the card's own
    // line ("Done · 3/3 correct · next review tomorrow") split into the title and the pills.
    const pills: Array<Pill> = [{ value: `${stats.correct}/${stats.graded} correct`, mark: 'correct' }];
    if (outcome.nextReviewAt) pills.push({ label: 'Next review', value: formatIn(outcome.nextReviewAt, now()) });
    return (
      <div className="tn-complete tn-band tn-band--hero">
        <div className="tn-player__body">
          <Field cap={field.cap} celebrate={field.celebrate} bar={field.bar} title="Done" pills={pills} />
        </div>
        <div className="tn-player__zone">
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

  // The whole screen is the field; the buttons sit on it too.
  return (
    <div className="tn-complete tn-band tn-band--hero">
      <div className="tn-player__body">
        <Field {...field} />
        <MissedList itemIds={outcome.missedItemIds} />
      </div>
      <div className="tn-player__zone">{actions}</div>
    </div>
  );
}
