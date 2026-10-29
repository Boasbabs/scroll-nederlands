// Today, Review and Progress tabs.
import { useEffect, useId, useState, type ReactNode } from 'react';
import { DAY } from '../../engine/schedule';
import { getNextScene, getPackInProgress, isLessonDone, REVIEW_BATCH, WORD_BATCH } from '../../engine/selection';
import { itemsByStrength } from '../../engine/summary';
import type { Snapshot } from '../../learning/actions';
import { isSet } from '../../packs/assemble';
import { contrastLabel } from '../../sounds/assemble';
import { backupFileName } from '../../storage/backup';
import { Button } from '../components/Button';
import { WaitingForCorrection } from '../player/corrections';
import { Icon, type IconName } from '../components/Icon';
import { IconTile, type TileKind } from '../components/IconTile';
import { ProgressBar } from '../components/ProgressBar';
import { useEnv } from '../env';
import { formatDay, formatIn, packTerms, plural } from '../format';
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

type TodayRowProps = {
  /** The tile's glyph and the kind of activity that colours it, or `done` for a finished line: a tick and nothing to press. */
  icon: IconName | 'done';
  kind?: TileKind;
  title: string;
  meta: string;
  bar?: { value: number; max: number };
  onClick?: () => void;
};

/** Lines seen still open on this page, so one that has turned done since pops its tick once. */
const seenOpen = new Set<string>();

/** A line of To do today: a tile, what to do, how far along. The whole line is the button. */
function TodayRow({ icon, kind = 'soft', title, meta, bar, onClick }: TodayRowProps) {
  const metaId = useId();
  const [justDone] = useState(() => icon === 'done' && seenOpen.has(title));
  useEffect(() => {
    if (icon === 'done') seenOpen.delete(title);
    else seenOpen.add(title);
  }, [icon, title]);
  const content = (
    <>
      {icon === 'done' ? (
        <span className={`tn-today-row__tile${justDone ? ' tn-tick' : ''}`} data-done>
          <Icon name="check" size={20} />
        </span>
      ) : (
        <IconTile icon={icon} kind={kind} />
      )}
      <span className="tn-today-row__text">
        <span className="tn-today-row__title">{title}</span>
        <span className="tn-today-row__meta" id={metaId}>
          {meta}
        </span>
        {/* Spans, as a button holds only phrasing content; the meta line gives the same count in words. */}
        {bar ? <ProgressBar value={bar.value} max={bar.max} count decorative /> : null}
      </span>
      {onClick ? <Icon name="chevron" size={20} /> : null}
    </>
  );
  return (
    <li>
      {onClick ? (
        <button type="button" className="tn-today-row" aria-label={title} aria-describedby={metaId} onClick={onClick}>
          {content}
        </button>
      ) : (
        <div className="tn-today-row">{content}</div>
      )}
    </li>
  );
}

/** The basic-word track: today's batch, or a tick once it is done. */
function NewWordsRow({ snap, start }: ScreenProps) {
  const { learning } = useEnv();
  const { words } = snap.summary;
  const met = words.total - words.new;
  const batch = Math.min(WORD_BATCH.focused, snap.wordsLeftToday);
  if (words.new === 0) return <TodayRow icon="done" title="New words" meta="You have met every basic word." />;
  if (batch === 0) return <TodayRow icon="done" title="New words" meta={`Done for today · ${met} of ${words.total} met`} />;
  return (
    <TodayRow
      icon="words"
      kind="words"
      title={`Learn ${plural(batch, 'word')}`}
      meta={`Basic words · ${met} of ${words.total} met`}
      bar={{ value: met, max: words.total }}
      onClick={() => void start(() => learning.startWords('focused'))}
    />
  );
}

/** The pack (or set) the learner is in the middle of: its next scene starts from here. */
function ContinuePackRow({ snap, start }: ScreenProps) {
  const { learning, course } = useEnv();
  const pack = getPackInProgress(course, snap.progress);
  const next = pack && getNextScene(pack, snap.progress);
  if (!pack || !next) return null;
  const done = pack.scenes.filter((scene) => isLessonDone(snap.progress, scene.id)).length;
  return (
    <TodayRow
      icon={isSet(pack) ? 'translate' : 'chats'}
      kind="packs"
      title={`Continue: ${pack.title}`}
      meta={`${packTerms(pack).Step} ${pack.scenes.indexOf(next) + 1} of ${pack.scenes.length} · ${next.title}`}
      bar={{ value: done, max: pack.scenes.length }}
      onClick={() => void start(() => learning.startNextScene(pack.id))}
    />
  );
}

/** Ear training: one new sound contrast per session, then practice once all are met. */
function EarTrainingRow({ snap, start }: ScreenProps) {
  const { learning, course } = useEnv();
  const { sounds } = snap.summary;
  const met = sounds.total - sounds.new;
  const next = course.sounds.find((item) => !snap.progress.items[item.id]);
  const contrast = next && course.contrast(next.id);
  return (
    <TodayRow
      icon="ear"
      kind="ear"
      title={contrast ? `Hear ${contrastLabel(contrast)}` : 'Practise the sounds'}
      meta={`Ear training · ${met} of ${sounds.total} sound pairs`}
      bar={{ value: met, max: sounds.total }}
      onClick={() => void start(() => learning.startSounds())}
    />
  );
}

/**
 * A reminder to back up, after the day's tasks (when, see backupDue). Saving
 * here says the file's name, so the learner can find it later.
 */
function BackupReminder({ snap }: { snap: Snapshot }) {
  const { backup, now } = useEnv();
  const titleId = useId();
  const [reminder, setReminder] = useState<{ lastSaved?: number }>();
  const [saved, setSaved] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void backup
      ?.reminder(snap.progress)
      .then((due) => live && setReminder(due))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [backup, snap.progress]);

  if (!backup || !(reminder || saved)) return null;

  function save() {
    setFailed(false);
    void backup?.save().then((at) => setSaved(backupFileName(at)), () => setFailed(true));
  }

  function putOff() {
    setReminder(undefined);
    void backup?.putOffReminder().catch(() => undefined);
  }

  let body: ReactNode = 'Removing TaalNudge deletes your progress. A backup file brings it back.';
  if (saved) body = <>Saved as <span className="tn-backup-reminder__file">{saved}</span>.</>;
  else if (failed) body = 'The backup couldn’t be saved. Try again.';
  else if (reminder?.lastSaved) body = `Your last backup is from ${formatDay(reminder.lastSaved, now())}.`;

  return (
    <section className="tn-panel-card tn-backup-reminder tn-settle-in" style={{ '--i': 3 } as React.CSSProperties} aria-labelledby={titleId}>
      <IconTile icon={saved ? 'check' : 'download'} kind="soft" />
      <div className="tn-backup-reminder__text">
        <h2 id={titleId} className="tn-backup-reminder__title">
          {saved ? 'Backup saved' : 'Back up your progress'}
        </h2>
        <p className="tn-backup-reminder__body" role="status">
          {body}
        </p>
        {saved ? null : (
          <div className="tn-backup-reminder__actions">
            <Button variant="secondary" size="sm" onClick={save}>
              Back up
            </Button>
            <button type="button" className="tn-link" onClick={putOff}>
              Not now
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function TodayScreen({ snap, start }: ScreenProps) {
  const { learning, course, now } = useEnv();
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
      ) : null}

      {current && stage && module ? (
        <section className="tn-continue tn-settle-in" style={{ '--i': 1 } as React.CSSProperties}>
          <p className="tn-continue__context">
            {stage.title.split(' · ')[0]} · {module.title}
          </p>
          <h2 className="tn-continue__title">
            {current.kind === 'checkpoint' && !/check/i.test(current.title) ? `Checkpoint: ${current.title}` : current.title}
          </h2>
          {moduleCount ? <ProgressBar value={moduleCount.completed} max={moduleCount.total} label={`${module.title} progress`} count /> : null}
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

      <section className="tn-section tn-settle-in" style={{ '--i': 2 } as React.CSSProperties}>
        <h2 className="tn-section__title">To do today</h2>
        <ul className="tn-panel-card tn-today-list">
          {summary.dueNow === 0 && summary.nextReview ? (
            <TodayRow
              icon="done"
              title="All caught up"
              meta={`Next review ${formatIn(summary.nextReview.at, now())} · ${plural(summary.nextReview.count, 'item')}`}
            />
          ) : null}
          {snap.prefs.newWordsPerDay > 0 && summary.words.total > 0 ? <NewWordsRow snap={snap} start={start} /> : null}
          <ContinuePackRow snap={snap} start={start} />
          {summary.sounds.total > 0 ? <EarTrainingRow snap={snap} start={start} /> : null}
          <TodayRow
            icon="bolt"
            kind="practice"
            title="Quick practice"
            meta="2 min"
            onClick={() => void start(async () => (await learning.startNext('micro')) ?? learning.startPractice('micro'))}
          />
        </ul>
      </section>

      <BackupReminder snap={snap} />

      <dl className="tn-stats tn-settle-in" style={{ '--i': 4 } as React.CSSProperties}>
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

export function ReviewScreen({ snap, start, onCourse, onChange }: ScreenProps & { onCourse: () => void; onChange: () => void }) {
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
      <WaitingForCorrection drafts={snap.drafts} onChange={onChange} />
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
      <section className="tn-section">
        <h2 className="tn-section__title">This week</h2>
        <ol className="tn-panel-card tn-week">
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

      <section className="tn-section">
        <h2 className="tn-section__title">Words and phrases</h2>
        <div className="tn-panel-card">
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
        </div>
      </section>

      {summary.words.total > 0 ? (
        <section className="tn-section">
          <h2 className="tn-section__title">Basic words</h2>
          <div className="tn-panel-card tn-meter">
            <IconTile icon="words" kind="words" />
            <div className="tn-meter__text">
              <p className="tn-progress-line">
                <strong className="tn-display">{summary.words.total - summary.words.new}</strong> of {summary.words.total} met · {summary.words.strong} strong
              </p>
              <ProgressBar value={summary.words.total - summary.words.new} max={summary.words.total} label="Basic words met" count />
            </div>
          </div>
        </section>
      ) : null}

      {summary.packs.total > 0 ? (
        <section className="tn-section">
          <h2 className="tn-section__title">Situations</h2>
          <div className="tn-panel-card tn-meter">
            <IconTile icon="chats" kind="packs" />
            <div className="tn-meter__text">
              <p className="tn-progress-line">
                <strong className="tn-display">{summary.packs.started}</strong> of {summary.packs.total} started · {summary.packs.items.total - summary.packs.items.new} of {summary.packs.items.total} phrases and words met
              </p>
              <ProgressBar value={summary.packs.items.total - summary.packs.items.new} max={summary.packs.items.total} label="Situation phrases and words met" count />
            </div>
          </div>
        </section>
      ) : null}

      {summary.sounds.total > 0 ? (
        <section className="tn-section">
          <h2 className="tn-section__title">Ear training</h2>
          <div className="tn-panel-card tn-meter">
            <IconTile icon="ear" kind="ear" />
            <div className="tn-meter__text">
              <p className="tn-progress-line">
                <strong className="tn-display">{summary.sounds.total - summary.sounds.new}</strong> of {summary.sounds.total} sound pairs · {summary.sounds.strong} strong
              </p>
              <ProgressBar value={summary.sounds.total - summary.sounds.new} max={summary.sounds.total} label="Sound pairs met" count />
            </div>
          </div>
        </section>
      ) : null}

      {summary.articles.total > 0 ? (
        <section className="tn-section">
          <h2 className="tn-section__title">Articles · de or het</h2>
          <div className="tn-panel-card tn-meter">
            <IconTile icon="tag" kind="articles" />
            <div className="tn-meter__text">
              <p className="tn-progress-line">
                <strong className="tn-display">{summary.articles.total - summary.articles.new}</strong> of {summary.articles.total} nouns · {summary.articles.strong} strong
              </p>
              <ProgressBar value={summary.articles.total - summary.articles.new} max={summary.articles.total} label="Articles met" count />
            </div>
          </div>
        </section>
      ) : null}

      <section className="tn-section">
        <h2 className="tn-section__title">Lessons</h2>
        <div className="tn-panel-card">
          <div className="tn-meter">
            <IconTile icon="book" kind="lessons" />
            <div className="tn-meter__text">
              <p className="tn-progress-line">
                <strong className="tn-display">{summary.lessons.completed}</strong> of {summary.lessons.total}
              </p>
              <ProgressBar value={summary.lessons.completed} max={summary.lessons.total} label="Lessons completed" count />
            </div>
          </div>
          <ul className="tn-stage-bars">
            {summary.stages.map((stage) => (
              <li key={stage.id}>
                <span>{stage.title}</span>
                <ProgressBar value={stage.completed} max={stage.total} label={`${stage.title} lessons`} count />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tn-section">
        <h2 className="tn-section__title">Upcoming reviews</h2>
        <dl className="tn-panel-card tn-tiles">
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
