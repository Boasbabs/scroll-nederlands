// Course path: stage cards → module accordions → a lesson stepper.
import { useEffect, useRef, useState } from 'react';
import type { CurriculumLevel, Lesson } from '../../curriculum/types';
import { isLessonDone, isLessonUnlocked } from '../../engine/selection';
import type { Snapshot } from '../../learning/actions';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { useEnv } from '../env';
import type { StartSession } from './PanelApp';

const LEVEL_LABEL: Record<CurriculumLevel, string> = { 'pre-a1': 'Pre-A1', a1: 'A1', 'a1-a2': 'A1–A2', a2: 'A2' };

type NodeState = 'done' | 'current' | 'locked' | 'open';

function LessonNode({ lesson, state, started, onStart }: { lesson: Lesson; state: NodeState; started: boolean; onStart: () => void }) {
  const checkpoint = lesson.kind === 'checkpoint';
  const icon = state === 'done' ? 'check' : state === 'locked' ? 'lock' : checkpoint ? 'flag' : undefined;
  return (
    <li className="tn-node" data-state={state} data-checkpoint={checkpoint || undefined} data-current={state === 'current' || undefined}>
      <button
        type="button"
        className="tn-node__disc"
        disabled={state === 'locked'}
        aria-label={`${lesson.title}${checkpoint ? ' (checkpoint)' : ''}: ${state === 'done' ? 'done, play again' : state === 'locked' ? 'locked' : 'start'}`}
        onClick={onStart}
      >
        {icon ? <Icon name={icon} size={16} /> : null}
      </button>
      <div className="tn-node__text">
        {state === 'current' ? <span className="tn-node__bubble">{started ? 'Continue' : 'Start'}</span> : null}
        {checkpoint ? <span className="tn-node__kind">Checkpoint</span> : null}
        <span className="tn-node__title">{lesson.title}</span>
        {state === 'current' ? (
          <Button size="sm" onClick={onStart}>
            {started ? 'Continue' : 'Start'}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function CourseScreen({ snap, start }: { snap: Snapshot; start: StartSession }) {
  const { course, learning } = useEnv();
  const { summary, progress } = snap;
  const current = summary.current;
  const currentStage = course.curriculum.stages.findIndex((stage) => stage.id === current?.stageId);
  const [openStages, setOpenStages] = useState<ReadonlySet<string>>(() => new Set(current ? [current.stageId] : []));
  const [openModules, setOpenModules] = useState<ReadonlySet<string>>(() => new Set(current ? [current.moduleId] : []));
  const currentNode = useRef<HTMLLIElement | null>(null);
  const [pill, setPill] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const node = document.querySelector<HTMLLIElement>('.tn-node[data-current]');
    currentNode.current = node;
    node?.scrollIntoView({ block: 'center' });
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setPill(entry.isIntersecting ? null : entry.boundingClientRect.top < 0 ? 'up' : 'down');
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function toggle(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  function nodeState(lesson: Lesson): NodeState {
    if (isLessonDone(progress, lesson.id)) return 'done';
    if (lesson.id === current?.lessonId) return 'current';
    return isLessonUnlocked(course, progress, lesson.id) ? 'open' : 'locked';
  }

  return (
    <div className="tn-screen tn-course">
      {course.curriculum.stages.map((stage, stageIndex) => {
        const stageSummary = summary.stages.find((entry) => entry.id === stage.id)!;
        const modulesDone = stage.modules.filter((module) => {
          const count = summary.modules[module.id];
          return count && count.total > 0 && count.completed === count.total;
        }).length;
        const expanded = openStages.has(stage.id);
        const previous = course.curriculum.stages[stageIndex - 1];
        const canJump = currentStage >= 0 && stageIndex > currentStage && previous;
        return (
          <section key={stage.id} className="tn-stage" data-expanded={expanded}>
            <button type="button" className="tn-stage__head" aria-expanded={expanded} onClick={() => setOpenStages(toggle(openStages, stage.id))}>
              <span className="tn-stage__title">{stage.title}</span>
              <span className="tn-chip tn-chip--blue">{LEVEL_LABEL[stage.level]}</span>
              <Icon name="chevron" size={20} />
            </button>
            <ProgressBar value={stageSummary.completed} max={stageSummary.total} label={`${stage.title} progress`} thin />
            <div className="tn-stage__meta">
              <span className="tn-muted">
                {modulesDone}/{stage.modules.length} modules
              </span>
              {canJump ? (
                <button type="button" className="tn-link tn-link--small" onClick={() => void start(() => learning.startPlacement(previous.id))}>
                  Jump here
                </button>
              ) : null}
            </div>
            {expanded ? (
              <ol className="tn-modules">
                {stage.modules.map((module, moduleIndex) => {
                  const count = summary.modules[module.id] ?? { completed: 0, total: module.lessons.length };
                  const open = openModules.has(module.id);
                  return (
                    <li key={module.id} className="tn-module">
                      <button
                        type="button"
                        className="tn-module__head"
                        aria-expanded={open}
                        // The row's bar and counts would otherwise be read as one run-on name.
                        aria-label={`Module ${moduleIndex + 1}: ${module.title}, ${count.completed} of ${count.total} lessons done`}
                        onClick={() => setOpenModules(toggle(openModules, module.id))}
                      >
                        <span className="tn-module__number">{moduleIndex + 1}</span>
                        <span className="tn-module__text">
                          <span className="tn-module__title">{module.title}</span>
                          <ProgressBar value={count.completed} max={count.total} label={`${module.title} progress`} thin />
                        </span>
                        <span className="tn-module__count">
                          {count.completed}/{count.total}
                        </span>
                        <Icon name="chevron" size={20} />
                      </button>
                      {open ? (
                        <ol className="tn-stepper">
                          {module.lessons.map((lesson) => (
                            <LessonNode
                              key={lesson.id}
                              lesson={lesson}
                              state={nodeState(lesson)}
                              started={Boolean(progress.lessons[lesson.id]?.startedAt)}
                              onStart={() => void start(() => learning.startLesson(lesson.id, 'focused'))}
                            />
                          ))}
                        </ol>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </section>
        );
      })}
      {pill ? (
        <button type="button" className="tn-float-pill tn-rise-in" data-direction={pill} onClick={() => currentNode.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })}>
          <Icon name="arrowUp" size={16} />
          Current lesson
        </button>
      ) : null}
    </div>
  );
}
