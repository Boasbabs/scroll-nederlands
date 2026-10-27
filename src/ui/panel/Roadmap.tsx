import { useEffect, useRef, useState } from 'react';
import { allLessons, curriculum } from '../../curriculum';
import type { Lesson } from '../../curriculum/types';
import { getNextLesson, isLessonCompleted, isLessonUnlocked } from '../../engine/selection';
import { isItemStrong, LEVEL_LABELS, moduleCompletion } from '../../engine/summary';
import type { LearnerProgress } from '../../engine/types';
import { useEnv } from '../env';
import { CheckIcon, ChevronIcon, LockIcon } from '../icons';

const LEVEL_TAGS = { 'pre-a1': 'Pre-A1', a1: 'A1', 'a1-a2': 'A1→A2', a2: 'A2' } as const;

function reviewLabel(dueAt: number, now: number): string {
  if (dueAt <= now) return 'Review due';
  const days = Math.round((dueAt - now) / 86_400_000);
  return days < 1 ? 'Review today' : `Review in ${days} day${days === 1 ? '' : 's'}`;
}

function LessonRow({ lesson, progress, isCurrent, onOpen }: {
  lesson: Lesson;
  progress: LearnerProgress;
  isCurrent: boolean;
  onOpen(lessonId: string): void;
}) {
  const { now } = useEnv();
  const done = isLessonCompleted(progress, lesson.id);
  const unlocked = isLessonUnlocked(curriculum, progress, lesson);
  const item = progress.items[lesson.id];
  const checkpoint = progress.checkpoints[lesson.id];
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isCurrent) ref.current?.scrollIntoView({ block: 'center' });
  }, [isCurrent]);

  const marker = done ? (
    <span className="tn-step is-done"><CheckIcon size={14} /></span>
  ) : unlocked ? (
    <span className={`tn-step${isCurrent ? ' is-current' : ''}`} />
  ) : (
    <span className="tn-step is-locked"><LockIcon size={12} /></span>
  );

  return (
    <li ref={ref} className="tn-step-row">
      {marker}
      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          type="button"
          className="tn-step-title"
          disabled={!unlocked}
          onClick={() => onOpen(lesson.id)}
          title={unlocked ? undefined : 'Finish the previous stage checkpoints first'}
        >
          {lesson.title}
        </button>
        <div className="tn-row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {lesson.kind !== 'core' && <span className="tn-badge">{lesson.kind === 'practice' ? 'Practice' : 'Checkpoint'}</span>}
          {item && done && <span className={`tn-badge${isItemStrong(item) ? ' is-strong' : ''}`}>{LEVEL_LABELS[item.level]}</span>}
          {item && done && <span className="tn-muted" style={{ fontSize: 12 }}>{reviewLabel(item.dueAt, now())}</span>}
          {checkpoint && (
            <span className={`tn-badge${checkpoint.passedAt ? ' is-strong' : ''}`}>
              Best {Math.round(checkpoint.bestScore * 100)}%{checkpoint.passedAt ? ' · passed' : ''}
            </span>
          )}
        </div>
      </div>
      {isCurrent && (
        <button type="button" className="tn-btn tn-btn-primary" onClick={() => onOpen(lesson.id)}>Start</button>
      )}
    </li>
  );
}

export function Roadmap({ progress, onOpen }: { progress: LearnerProgress; onOpen(lessonId: string): void }) {
  const next = getNextLesson(curriculum, allLessons, progress);
  const [openModule, setOpenModule] = useState<string | null>(next?.moduleId ?? null);

  return (
    <div className="tn-screen-body tn-stack tn-enter">
      {curriculum.stages.map((stage) => {
        const lessons = stage.modules.flatMap((module) => module.lessons);
        const done = lessons.filter((lesson) => isLessonCompleted(progress, lesson.id)).length;
        return (
          <section key={stage.id} className="tn-card tn-stack-sm" aria-label={stage.title}>
            <div className="tn-row">
              <h2 className="tn-h3" style={{ margin: 0 }}>{stage.title}</h2>
              <span className="tn-spacer" />
              <span className="tn-badge">{LEVEL_TAGS[stage.level]}</span>
            </div>
            <p className="tn-muted" style={{ margin: 0, fontSize: 13 }}>{stage.objective}</p>
            <div className="tn-progress" aria-label={`${done} of ${lessons.length} lessons`}>
              <span style={{ width: `${(done / Math.max(1, lessons.length)) * 100}%` }} />
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {stage.modules.map((module) => {
                const completion = moduleCompletion(module, progress);
                const expanded = openModule === module.id;
                return (
                  <li key={module.id} style={{ borderTop: '1px solid var(--tn-border)' }}>
                    <button
                      type="button"
                      className="tn-module-btn"
                      aria-expanded={expanded}
                      onClick={() => setOpenModule(expanded ? null : module.id)}
                    >
                      <ChevronIcon open={expanded} size={16} />
                      <span style={{ flex: 1, textAlign: 'left' }}>{module.title}</span>
                      <span className="tn-muted" style={{ fontSize: 12 }}>{completion.done}/{completion.total}</span>
                    </button>
                    {expanded && (
                      <div className="tn-enter">
                        <p className="tn-muted" style={{ margin: '0 0 8px 26px', fontSize: 13 }}>{module.description}</p>
                        <ol className="tn-stepper">
                          {module.lessons.map((lesson) => (
                            <LessonRow key={lesson.id} lesson={lesson} progress={progress} isCurrent={lesson.id === next?.id} onOpen={onOpen} />
                          ))}
                        </ol>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
