// One graded exercise: question, answer area, then Check → feedback.
// Only the first attempt is graded; "Try again" is practice.
import { useRef, useState } from 'react';
import type { Exercise } from '../../curriculum/types';
import type { AnswerCheck } from '../../engine/answers';
import type { PlannedExercise } from '../../engine/exercises';
import { AudioButton } from '../components/AudioButton';
import { Button } from '../components/Button';
import { PictureFrame } from '../components/Picture';
import { useEnv } from '../env';
import { ChoiceView, ClozeView, MatchView, OrderView, TypeView, WriteView } from './exercises';
import { FeedbackSheet, type Feedback } from './FeedbackSheet';
import { allowsRetry, fillGap, givenText, gradeAnswer, isAnswered, type Answer } from './grade';
import { HetLine, isHetNoun } from './het';
import { GetItCorrected } from './corrections';
import { LeechPrompt, NoteCue } from './notes';
import { AudioHeader, Conversation, Instruction, Passage } from './parts';
import { ActionZone, RecallCard, StepBody } from './steps';

type Phase = 'answering' | 'retry' | 'correct' | 'wrong' | 'rate';

export type ExerciseStepProps = {
  planned: PlannedExercise;
  /** A missed exercise coming back later in the lesson (practice, not graded again). */
  review: boolean;
  /** Show it as a recall card (generated recall drills in reviews). */
  recall: boolean;
  /** The first answer's verdict. Match reports the items it mismatched. */
  onGraded: (correct: boolean, missedItemIds?: ReadonlyArray<string>) => void;
  onNext: () => void;
  onCantListen: () => void;
};

function meaningOf(exercise: Exercise): string | undefined {
  return 'english' in exercise && exercise.english ? exercise.english : undefined;
}

/** The full model answer to show: cloze answers are shown in their sentence. */
function expectedText(exercise: Exercise, check: AnswerCheck): string {
  if (exercise.kind === 'cloze') return fillGap(exercise.sentence, check.expected);
  return check.expected;
}

export function ExerciseStep({ planned, review, recall, onGraded, onNext, onCantListen }: ExerciseStepProps) {
  const { sfx, prefs, course, surface } = useEnv();
  const exercise = planned.exercise;
  const [answer, setAnswer] = useState<Answer>();
  const [phase, setPhase] = useState<Phase>('answering');
  const [check, setCheck] = useState<AnswerCheck>();
  const [attempt, setAttempt] = useState(0);
  const graded = useRef(false);

  function grade(correct: boolean, missed?: ReadonlyArray<string>) {
    if (graded.current) return;
    graded.current = true;
    onGraded(correct, missed);
  }

  function submit() {
    if (phase !== 'answering' || !isAnswered(answer)) return;
    const result = gradeAnswer(exercise, answer);
    setCheck(result);
    if (exercise.kind === 'write') {
      setPhase('rate');
      return;
    }
    grade(result.correct);
    sfx.play(result.correct ? 'correct' : 'wrong');
    if (result.correct) setPhase('correct');
    else setPhase(allowsRetry(exercise) && attempt === 0 ? 'retry' : 'wrong');
  }

  function dontKnow() {
    grade(false);
    setCheck(gradeAnswer(exercise, { kind: 'text', text: '' }));
    setPhase('wrong');
  }

  if (recall) {
    const item = course.item(planned.itemIds[0] ?? '');
    if (item) {
      return (
        <RecallCard
          item={item}
          situation={exercise.situation}
          picture={exercise.picture}
          note={exercise.note}
          leech={planned.leech}
          onGrade={grade}
          onNext={onNext}
        />
      );
    }
  }

  const locked = phase !== 'answering';
  const judged = check?.correct;
  const viewProps = { planned, locked, judged, answer, onAnswer: setAnswer };
  let view;
  switch (exercise.kind) {
    case 'choice':
      view = <ChoiceView exercise={exercise} {...viewProps} />;
      break;
    case 'match':
      view = <MatchView exercise={exercise} {...viewProps} />;
      break;
    case 'cloze':
      view = <ClozeView exercise={exercise} {...viewProps} />;
      break;
    case 'order':
      view = <OrderView exercise={exercise} {...viewProps} />;
      break;
    case 'type':
      view = <TypeView exercise={exercise} {...viewProps} />;
      break;
    case 'write':
      view = <WriteView exercise={exercise} {...viewProps} />;
      break;
  }

  const chosenReply = exercise.kind === 'choice' && locked && answer?.kind === 'choice' ? answer.option : undefined;

  let zone;
  if (exercise.kind === 'match') {
    const done = answer?.kind === 'match';
    zone = (
      <Button
        block
        disabled={!done}
        data-primary
        onClick={() => {
          if (answer?.kind !== 'match') return;
          grade(answer.missedItemIds.length === 0, answer.missedItemIds);
          onNext();
        }}
      >
        Continue
      </Button>
    );
  } else if (phase === 'answering') {
    zone = (
      <Button block disabled={!isAnswered(answer)} onClick={submit} data-primary>
        Check
      </Button>
    );
  } else if (phase === 'rate') {
    zone = (
      <>
        <p className="tn-zone-question">Compare with the model answer. Did yours work?</p>
        <div className="tn-zone-pair">
          <Button
            variant="secondary"
            onClick={() => {
              grade(false);
              onNext();
            }}
          >
            Not yet
          </Button>
          <Button
            onClick={() => {
              grade(true);
              onNext();
            }}
          >
            Looks right
          </Button>
        </div>
      </>
    );
  } else {
    const feedback: Feedback =
      phase === 'correct'
        ? {
            type: 'correct',
            note: check?.note,
            meaning: meaningOf(exercise),
            explanation: exercise.explanation,
          }
        : phase === 'retry'
          ? { type: 'retry', note: check?.note }
          : {
              type: 'wrong',
              expected: check ? expectedText(exercise, check) : '',
              given: exercise.kind === 'choice' ? undefined : givenText(answer) || undefined,
              chosen: answer?.kind === 'choice' ? answer.option : undefined,
              meaning: meaningOf(exercise),
              explanation: exercise.explanation,
            };
    // One het-noun practised (its meaning or its article): the answer comes with the het image.
    const het = phase !== 'retry' && planned.itemIds.length === 1 && isHetNoun(course, planned.itemIds[0]!);
    // A miss on an item that keeps slipping offers "Make it yours" (once: the offer is remembered).
    const slipping = phase === 'wrong' && planned.leech ? course.item(planned.itemIds[0] ?? '') : undefined;
    zone = (
      <FeedbackSheet
        feedback={feedback}
        onContinue={onNext}
        onRetry={() => {
          setAttempt(1);
          setPhase('answering');
        }}
        onShowAnswer={() => setPhase('wrong')}
      >
        {het ? <HetLine /> : null}
        {slipping ? <LeechPrompt item={slipping} /> : null}
      </FeedbackSheet>
    );
  }

  return (
    <>
      <StepBody label="Exercise">
        {review ? <span className="tn-chip tn-chip--review">Review</span> : null}
        <Instruction>{exercise.prompt}</Instruction>
        {exercise.situation ? <p className="tn-scene">{exercise.situation}</p> : null}
        {exercise.note ? <NoteCue text={exercise.note} /> : null}
        {exercise.picture ? (
          <PictureFrame
            itemId={exercise.picture}
            alt={course.item(exercise.picture)?.english ?? ''}
            placeholder
            fallback={<p className="tn-translation">{course.item(exercise.picture)?.english}</p>}
          />
        ) : null}
        {exercise.kind === 'choice' && exercise.noun ? (
          <div className="tn-article-word">
            <p className="tn-phrase" lang="nl">
              <span className="tn-article-word__gap" data-filled={locked || undefined}>
                {locked ? exercise.answer : '___'}
              </span>{' '}
              {exercise.noun}
            </p>
            {/* Heard only once answered: the article would give itself away. */}
            {locked ? <AudioButton text={`${exercise.answer} ${exercise.noun}`} size="small" autoPlay={prefs.autoplayAudio} /> : null}
          </div>
        ) : null}
        {exercise.passage ? <Passage text={exercise.passage} /> : null}
        {exercise.context?.length ? (
          <Conversation
            lines={exercise.context}
            reply={chosenReply ? { text: chosenReply, mark: judged ? 'correct' : 'wrong' } : undefined}
          />
        ) : null}
        {exercise.audioText ? (
          exercise.listenOnly ? (
            <div className="tn-listen">
              <AudioHeader text={exercise.audioText} autoPlay={prefs.autoplayAudio} />
              {locked ? (
                <p className="tn-listen__text" lang="nl">
                  {exercise.audioText}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="tn-prompt-card">
              <AudioHeader text={exercise.audioText} />
              <p className="tn-prompt-card__dutch" lang="nl">
                {exercise.audioText}
              </p>
            </div>
          )
        ) : null}
        {view}
        {exercise.kind === 'write' && phase === 'rate' && surface === 'panel' ? (
          <GetItCorrected input={{ text: givenText(answer) ?? '', prompt: exercise.prompt, exerciseId: planned.exerciseId }} />
        ) : null}
        {exercise.listenOnly && !locked ? (
          <button type="button" className="tn-link" onClick={onCantListen}>
            Can’t listen now
          </button>
        ) : null}
        {exercise.kind === 'type' && !locked && !exercise.listenOnly ? (
          <button type="button" className="tn-link" onClick={dontKnow}>
            Don’t know
          </button>
        ) : null}
      </StepBody>
      <ActionZone>{zone}</ActionZone>
    </>
  );
}
