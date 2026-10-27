// Today, Review and Progress tabs.
import { useState } from 'react';
import { DAY } from '../../engine/schedule';
import { REVIEW_BATCH } from '../../engine/selection';
import { itemsByStrength } from '../../engine/summary';
import type { Snapshot } from '../../learning/actions';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { useEnv } from '../env';
import { formatIn, plural } from '../format';
import type { StartSession } from './PanelApp';

type ScreenProps = { snap: Snapshot; start: StartSession };

function CaughtUp({ snap, onContinue }: { snap: Snapshot; onContinue?: () => void }) {
  const { now } = useEnv();
  const next = snap.summary.nextReview;
  return (
    <section className="tn-caught-up tn-settle-in">
      <span className="tn-caught-up__tick">
        <Icon name="check" size={26} />
      </span>
      <h2 className="tn-caught-up__title">All caught up</h2>
      {next ? (
        <p className="tn-muted">
          Next review {formatIn(next.at, now())} · {plural(next.count, 'item')}
        </p>
      ) : (
        <p className="tn-muted">Finish a lesson to start your reviews.</p>
      )}
      {onContinue ? (
        <Button variant="secondary" onClick={onContinue}>
          Continue course
        </Button>
      ) : null}
    </section>
  );
}

export function TodayScreen({ snap, start }: ScreenProps) {
  const { learning, course } = useEnv();
  const { summary, progress } = snap;
  const current = summary.current && course.lesson(summary.current.lessonId);
  const stage = current && course.curriculum.stages.find((entry) => entry.id === current.stageId);
  const module = current && stage?.modules.find((entry) => entry.id === current.moduleId);
  const moduleCount = current ? summary.modules[current.moduleId] : undefined;
  const started = current ? Boolean(progress.lessons[current.id]?.startedAt) : false;

  return (
    <div className="tn-screen">
      {summary.dueNow > 0 ? (
        <section className="tn-review-card tn-settle-in">
          <p className="tn-review-card__count tn-display">{plural(summary.dueNow, 'review')} due</p>
          <p>Short practice keeps what you learned.</p>
          <Button variant="ink" onClick={() => void start(() => learning.startReview('focused'))}>
            Review now
          </Button>
        </section>
      ) : (
        <CaughtUp snap={snap} />
      )}

      {current && stage && module ? (
        <section className="tn-continue tn-settle-in" style={{ '--i': 1 } as React.CSSProperties}>
          <p className="tn-continue__context">
            {stage.title.split(' · ')[0]} · {module.title}
          </p>
          <h2 className="tn-continue__title">
            {current.kind === 'checkpoint' && !/check/i.test(current.title) ? `Checkpoint: ${current.title}` : current.title}
          </h2>
          {moduleCount ? <ProgressBar value={moduleCount.completed} max={moduleCount.total} label={`${module.title} progress`} thin /> : null}
          <Button block onClick={() => void start(() => learning.startLesson(current.id, 'focused'))}>
            {started ? 'Continue' : 'Start'}
          </Button>
        </section>
      ) : (
        <section className="tn-continue">
          <h2 className="tn-continue__title">You finished the course</h2>
          <p className="tn-muted">Keep your Dutch fresh with reviews and practice.</p>
        </section>
      )}

      <Button
        block
        variant="secondary"
        onClick={() => void start(async () => (await learning.startNext('micro')) ?? learning.startPractice('micro'))}
      >
        <Icon name="bolt" size={20} />
        Quick practice · 2 min
      </Button>

      <dl className="tn-stats">
        <div>
          <dt>Lessons</dt>
          <dd>
            {summary.lessons.completed}/{summary.lessons.total}
          </dd>
        </div>
        <div>
          <dt>Strong words</dt>
          <dd>{summary.items.strong}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ReviewScreen({ snap, start, onCourse }: ScreenProps & { onCourse: () => void }) {
  const { learning } = useEnv();
  const due = snap.summary.dueNow;
  const hasItems = Object.keys(snap.progress.items).length > 0;
  return (
    <div className="tn-screen">
      {due > 0 ? (
        <section className="tn-review-tab tn-settle-in">
          <p className="tn-review-tab__count tn-display">{due}</p>
          <p className="tn-muted">{due === 1 ? 'review due' : 'reviews due'}</p>
          {/* The count is what this session holds: reviews come in batches. */}
          <Button block onClick={() => void start(() => learning.startReview('focused'))}>
            Start review ({Math.min(due, REVIEW_BATCH.focused)})
          </Button>
        </section>
      ) : (
        <CaughtUp snap={snap} onContinue={onCourse} />
      )}
      {hasItems ? (
        <Button block variant="secondary" onClick={() => void start(() => learning.startPractice('focused'))}>
          Practice anyway
        </Button>
      ) : null}
    </div>
  );
}

// Quizlet's progress rings: grey for new, orange for still learning, green for mastered.
const STATES = [
  { key: 'new', label: 'New', colour: 'var(--ink-soft)' },
  { key: 'learning', label: 'Learning', colour: 'var(--now)' },
  { key: 'strong', label: 'Strong', colour: 'var(--correct)' },
] as const;

function Ring({ share, colour }: { share: number; colour: string }) {
  const r = 14;
  const length = 2 * Math.PI * r;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--track)" strokeWidth="5" />
      {/* No arc at zero: a round cap on an empty arc would still draw a dot. */}
      {share > 0 ? (
        <circle cx="18" cy="18" r={r} fill="none" stroke={colour} strokeWidth="5" strokeDasharray={`${share * length} ${length}`} transform="rotate(-90 18 18)" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

const SHOWN_ITEMS = 60;

export function ProgressScreen({ snap }: { snap: Snapshot }) {
  const { course, now } = useEnv();
  const { summary } = snap;
  const [open, setOpen] = useState<(typeof STATES)[number]['key']>();
  const groups = open ? itemsByStrength(course, snap.progress) : undefined;
  const today = now();

  return (
    <div className="tn-screen">
      <section className="tn-panel-card">
        <h2 className="tn-label">This week</h2>
        <ol className="tn-week">
          {summary.week.map((studied, i) => {
            const day = new Date(today - (6 - i) * DAY);
            return (
              <li key={i} data-studied={studied} aria-label={`${day.toLocaleDateString('en-GB', { weekday: 'long' })}: ${studied ? 'practised' : 'no practice'}`}>
                <span className="tn-week__circle">{studied ? <Icon name="check" size={16} /> : null}</span>
                <span className="tn-week__day">{day.toLocaleDateString('en-GB', { weekday: 'narrow' })}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="tn-panel-card">
        <h2 className="tn-label">Words and phrases</h2>
        {STATES.map((state) => (
          <div key={state.key}>
            <button type="button" className="tn-state-row" aria-expanded={open === state.key} onClick={() => setOpen(open === state.key ? undefined : state.key)}>
              <Ring share={summary.items.total ? summary.items[state.key] / summary.items.total : 0} colour={state.colour} />
              <span className="tn-state-row__count tn-display">{summary.items[state.key]}</span>
              <span className="tn-state-row__label">{state.label}</span>
              <Icon name="chevron" size={20} />
            </button>
            {open === state.key && groups ? (
              <ul className="tn-item-list tn-rise-in">
                {groups[state.key].slice(0, SHOWN_ITEMS).map((item) => (
                  <li key={item.id}>
                    <span lang="nl">{item.dutch}</span>
                    <span className="tn-muted">{item.english}</span>
                  </li>
                ))}
                {groups[state.key].length > SHOWN_ITEMS ? <li className="tn-muted">+ {groups[state.key].length - SHOWN_ITEMS} more</li> : null}
                {groups[state.key].length === 0 ? <li className="tn-muted">None yet</li> : null}
              </ul>
            ) : null}
          </div>
        ))}
      </section>

      <section className="tn-panel-card">
        <h2 className="tn-label">Lessons</h2>
        <p className="tn-progress-line">
          <strong className="tn-display">{summary.lessons.completed}</strong> of {summary.lessons.total}
        </p>
        <ProgressBar value={summary.lessons.completed} max={summary.lessons.total} label="Lessons completed" thin />
        <ul className="tn-stage-bars">
          {summary.stages.map((stage) => (
            <li key={stage.id}>
              <span>{stage.title}</span>
              <span className="tn-muted">
                {stage.completed}/{stage.total}
              </span>
              <ProgressBar value={stage.completed} max={stage.total} label={`${stage.title} lessons`} thin />
            </li>
          ))}
        </ul>
      </section>

      <section className="tn-panel-card">
        <h2 className="tn-label">Upcoming reviews</h2>
        <dl className="tn-tiles">
          {(
            [
              ['Today', summary.upcoming.today],
              ['Tomorrow', summary.upcoming.tomorrow],
              ['This week', summary.upcoming.thisWeek],
              ['Later', summary.upcoming.later],
            ] as const
          ).map(([label, count]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className="tn-display">{count}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
