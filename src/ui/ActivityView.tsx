import type { Activity, LearningMode } from '../engine/types';
import { CheckpointFlow, type FlowAction, LessonFlow, ReviewFlow } from './LessonFlow';

/** Render whatever the engine picked. Both learning modes use this. */
export function ActivityView({ activity, mode, speechRate, onExit, primary, secondary, reviewsLeft }: {
  activity: Activity;
  mode: LearningMode;
  speechRate?: number;
  onExit?: () => void;
  /** Action after finishing (Continue in focused practice, Done in micro mode). */
  primary: FlowAction;
  secondary?: FlowAction;
  reviewsLeft?: number;
}) {
  switch (activity.kind) {
    case 'new-lesson':
      return (
        <LessonFlow key={activity.lesson.id} lesson={activity.lesson} mode={mode} speechRate={speechRate} onExit={onExit} primary={primary} secondary={secondary} />
      );
    case 'review':
      return (
        <ReviewFlow
          key={`${activity.lesson.id}:${activity.item.history.length}`}
          lesson={activity.lesson}
          exercise={activity.exercise}
          item={activity.item}
          mode={mode}
          speechRate={speechRate}
          onExit={onExit}
          onDone={primary.onClick}
          reviewsLeft={reviewsLeft}
        />
      );
    case 'checkpoint':
      return <CheckpointFlow key={activity.lesson.id} lesson={activity.lesson} speechRate={speechRate} onExit={onExit} primary={primary} secondary={secondary} />;
    default:
      return null;
  }
}
