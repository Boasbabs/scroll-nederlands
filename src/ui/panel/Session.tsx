import { useCallback, useEffect, useState } from 'react';
import { allLessons } from '../../curriculum';
import { getDueReviews } from '../../engine/selection';
import type { Activity } from '../../engine/types';
import { ActivityView } from '../ActivityView';
import { useEnv, useLearnerData } from '../env';
import { CheckIcon } from '../icons';

export type SessionStart = { kind: 'continue' } | { kind: 'lesson'; lessonId: string };

function formatWhen(at: number, now: number): string {
  const hours = (at - now) / 3_600_000;
  if (hours < 1) return 'within the hour';
  if (hours < 24) return `in ${Math.round(hours)} hours`;
  return `in ${Math.round(hours / 24)} days`;
}

/** Focused practice: due reviews first, then the curriculum, one activity after another. */
export function Session({ start, onExit }: { start: SessionStart; onExit(): void }) {
  const { actions, now } = useEnv();
  const data = useLearnerData();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [round, setRound] = useState(0);

  const loadNext = useCallback(async () => {
    setActivity(await actions.nextActivity('focused', now()));
    setRound((r) => r + 1);
  }, [actions, now]);

  useEffect(() => {
    if (start.kind === 'lesson') {
      const lesson = allLessons.find((l) => l.id === start.lessonId);
      if (lesson) {
        setActivity(lesson.kind === 'checkpoint' ? { kind: 'checkpoint', lesson } : { kind: 'new-lesson', lesson });
        return;
      }
    }
    void loadNext();
    // Only on mount: later activities come from loadNext.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!activity || !data) return <p className="tn-muted" style={{ padding: 16 }}>Loading…</p>;

  if (activity.kind === 'done' || activity.kind === 'focused-only') {
    const upcoming = Object.values(data.progress.items).map((item) => item.dueAt).filter((at) => at > now());
    const nextReview = upcoming.length > 0 ? Math.min(...upcoming) : null;
    return (
      <div className="tn-screen">
        <div className="tn-screen-body tn-stack tn-enter" style={{ textAlign: 'center', display: 'grid', justifyItems: 'center' }}>
          <span className="tn-success-mark"><CheckIcon size={26} /></span>
          <h2 className="tn-title">All caught up</h2>
          <p className="tn-muted">
            {allLessons.every((l) => l.id in data.progress.completedLessons)
              ? 'You have worked through the whole curriculum. Reviews keep coming back to keep it fresh.'
              : 'Nothing is due right now.'}
            {nextReview && ` Next review ${formatWhen(nextReview, now())}.`}
          </p>
        </div>
        <div className="tn-screen-footer">
          <button type="button" className="tn-btn tn-btn-primary tn-btn-block" onClick={onExit} autoFocus>Back to overview</button>
        </div>
      </div>
    );
  }

  const reviewsLeft = getDueReviews(allLessons, data.progress, now()).length;
  return (
    <ActivityView
      key={round}
      activity={activity}
      mode="focused"
      speechRate={data.preferences.speechRate}
      onExit={onExit}
      reviewsLeft={reviewsLeft}
      primary={{ label: 'Continue', onClick: () => void loadNext() }}
      secondary={{ label: 'Back to overview', onClick: onExit }}
    />
  );
}

