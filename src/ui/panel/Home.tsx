import { useEffect, useState } from 'react';
import { allLessons, curriculum } from '../../curriculum';
import { LEVEL_LABELS, summarizeProgress } from '../../engine/summary';
import { LEARNING_LEVELS } from '../../engine/types';
import type { VoiceMatch } from '../../audio/speech';
import { useEnv, type LearnerData } from '../env';
import type { SiteId } from '../../sites';

export function Home({ data, onStart, onOpenSettings }: {
  data: LearnerData;
  onStart(kind: 'continue'): void;
  onOpenSettings(): void;
}) {
  const { now, speaker, sites, store } = useEnv();
  const summary = summarizeProgress(curriculum, allLessons, data.progress, now());
  const [voice, setVoice] = useState<VoiceMatch | null>(null);
  const [siteStatus, setSiteStatus] = useState<Record<SiteId, boolean> | null>(null);

  useEffect(() => {
    void speaker.describeVoice().then((v) => setVoice(v.hasClips ? 'nl-NL' : v.match));
    void sites?.status().then(setSiteStatus);
  }, [speaker, sites]);

  const anySite = siteStatus ? Object.values(siteStatus).some(Boolean) : true;
  const percent = Math.round((summary.completedLessons / Math.max(1, summary.totalLessons)) * 100);
  const isNew = summary.completedLessons === 0;

  return (
    <div className="tn-screen-body tn-stack tn-enter">
      <div className="tn-tiles-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="tn-card tn-stack-sm">
          <div className="tn-label">Reviews due</div>
          <strong style={{ display: 'block', fontSize: 24 }}>{summary.dueNow}</strong>
          <button
            type="button"
            className={`tn-btn ${summary.dueNow > 0 ? 'tn-btn-primary' : 'tn-btn-outline'}`}
            disabled={summary.dueNow === 0}
            onClick={() => onStart('continue')}
          >
            Review now
          </button>
        </div>
        <div className="tn-card tn-stack-sm">
          <div className="tn-label">Lessons</div>
          <strong style={{ display: 'block', fontSize: 24 }}>
            {summary.completedLessons}<span className="tn-muted" style={{ fontSize: 14 }}>/{summary.totalLessons}</span>
          </strong>
          <div className="tn-progress" aria-label={`${percent}% of lessons completed`}>
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="tn-card tn-stack-sm">
        <div className="tn-label">{summary.currentStage?.title}</div>
        {summary.nextLesson ? (
          <>
            <h2 className="tn-title">{summary.nextLesson.title}</h2>
            <p className="tn-muted" style={{ margin: 0 }}>
              {summary.currentModule?.title} · {summary.nextLesson.objective}
            </p>
          </>
        ) : (
          <h2 className="tn-title">Curriculum complete</h2>
        )}
        <button type="button" className="tn-btn tn-btn-primary tn-btn-block" onClick={() => onStart('continue')} autoFocus>
          {isNew ? 'Start your first lesson' : summary.dueNow > 0 ? `Continue · ${summary.dueNow} review${summary.dueNow === 1 ? '' : 's'} first` : 'Continue'}
        </button>
      </div>

      {voice && voice !== 'nl-NL' && (
        <p className="tn-notice" role="status">
          {voice === 'nl-other'
            ? 'Only a non-Netherlands Dutch voice was found, so some sounds may differ from standard Netherlands Dutch.'
            : 'No Dutch voice was found on this device, so audio is off. Install a Dutch (Netherlands) voice in your system speech settings.'}
        </p>
      )}

      {!anySite && (
        <div className="tn-card tn-stack-sm">
          <h3 className="tn-h3" style={{ margin: 0 }}>Learn while you browse</h3>
          <p className="tn-muted" style={{ margin: 0 }}>
            Get a gentle prompt for a 1–2 minute lesson after about {data.preferences.promptAfterMinutes} minutes on X or LinkedIn.
            TaalNudge never reads or stores posts.
          </p>
          <button type="button" className="tn-btn tn-btn-outline" onClick={onOpenSettings}>Choose sites</button>
        </div>
      )}
      {anySite && data.preferences.quietMode && (
        <p className="tn-notice">
          Quiet mode is on: no prompts while you browse.{' '}
          <button type="button" className="tn-link" onClick={() => void store.updatePreferences({ quietMode: false })}>Turn off</button>
        </p>
      )}

      {!isNew && (
        <div>
          <h3 className="tn-h3">What you can do</h3>
          <ul className="tn-stack-sm" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {LEARNING_LEVELS.map((level) => (
              <li key={level} className="tn-row">
                <span>{LEVEL_LABELS[level]}</span>
                <span className="tn-spacer" />
                <span className="tn-badge">{summary.levelCounts[level]}</span>
              </li>
            ))}
            <li className="tn-row">
              <span>Strong (recalled after a week or more)</span>
              <span className="tn-spacer" />
              <span className="tn-badge is-strong">{summary.strongItems}</span>
            </li>
          </ul>
          <p className="tn-muted" style={{ fontSize: 13 }}>
            {summary.correctAnswers} correct · {summary.incorrectAnswers} to learn from · {summary.checkpointsPassed}/{summary.totalCheckpoints} checkpoints passed
          </p>
        </div>
      )}

      <p className="tn-muted" style={{ fontSize: 12 }}>
        TaalNudge follows an original A0–A2 curriculum. It is a practice tool, not a certified course or exam result.
      </p>
    </div>
  );
}
