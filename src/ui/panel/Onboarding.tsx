// First run: welcome, level and starting point, browsing prompts, then lesson 1.
import { useState } from 'react';
import { stageCheckpointId } from '../../engine/selection';
import { SITES, type SiteId } from '../../sites';
import { Button } from '../components/Button';
import { SquigglePattern, Wordmark } from '../components/Decor';
import { Icon } from '../components/Icon';
import { useEnv } from '../env';
import { NudgeCard } from '../nudge/NudgeCard';
import { ChipGroup, Segments, SignalBars } from './controls';
import type { StartSession } from './PanelApp';
import { PROMPT_INTERVALS } from './SettingsScreen';

type Level = 'a0' | 'a1' | 'a2';

const LEVELS: ReadonlyArray<{ id: Level; label: string; cefr: string; bars: 1 | 2 | 3; skipStage?: string }> = [
  { id: 'a0', label: 'I’m new to Dutch', cefr: 'A0', bars: 1 },
  { id: 'a1', label: 'I know some words', cefr: 'A1', bars: 2, skipStage: 's0' },
  { id: 'a2', label: 'I can handle basic conversations', cefr: 'A2', bars: 3, skipStage: 's1' },
];

export function Onboarding({ start }: { start: StartSession }) {
  const { course, learning, setPrefs, permissions, now } = useEnv();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level>();
  const [from, setFrom] = useState<'scratch' | 'checkpoint'>();
  const [sites, setSites] = useState<Record<SiteId, boolean>>({ x: true, linkedin: true });
  const [minutes, setMinutes] = useState(8);
  const [prompts, setPrompts] = useState<'on' | 'off'>();

  const chosen = LEVELS.find((entry) => entry.id === level);
  const skipStage = chosen?.skipStage && stageCheckpointId(course, chosen.skipStage) ? chosen.skipStage : undefined;
  const stageNumber = skipStage ? course.curriculum.stages.findIndex((stage) => stage.id === skipStage) : -1;
  const first = course.lessons[0];

  function turnOn() {
    const ids = SITES.map((site) => site.id).filter((id) => sites[id]);
    // Straight from the click: Chrome shows the permission dialog only for a user gesture.
    const asked = ids.length > 0 && permissions ? permissions.request(ids) : Promise.resolve(ids.length > 0);
    void asked.then((granted) => {
      setPrompts(granted ? 'on' : 'off');
      return setPrefs({
        promptAfterMinutes: minutes,
        sites: { x: granted && sites.x, linkedin: granted && sites.linkedin },
      });
    });
  }

  function finish() {
    void setPrefs({ onboarded: true }).then(() =>
      start(() => (from === 'checkpoint' && skipStage ? learning.startPlacement(skipStage) : first ? learning.startLesson(first.id, 'focused') : undefined)),
    );
  }

  if (step === 0) {
    return (
      <div className="tn-onboarding tn-onboarding--hero tn-band tn-band--hero">
        <SquigglePattern className="tn-band__pattern tn-band__pattern--top" />
        <SquigglePattern />
        <div className="tn-onboarding__hero">
          <Segments count={3} current={0} />
          <Wordmark size={26} />
          <h1 className="tn-onboarding__greeting tn-display tn-land">Hallo · Hoi · Dag</h1>
          <p className="tn-onboarding__lead">Learn Dutch in 2-minute breaks while you browse.</p>
        </div>
        <div className="tn-onboarding__zone">
          <Button block onClick={() => setStep(1)}>
            Get started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="tn-onboarding">
      <header className="tn-onboarding__bar">
        <button type="button" className="tn-icon-btn" aria-label="Back" onClick={() => setStep(step - 1)}>
          <Icon name="back" />
        </button>
        <Segments count={3} current={step} />
      </header>
      <div className="tn-onboarding__body">
        {step === 1 ? (
          <div className="tn-onboarding__content tn-step-in">
            <h1 className="tn-title">How much Dutch do you know?</h1>
            <div className="tn-options" role="radiogroup" aria-label="Your Dutch level">
              {LEVELS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="radio"
                  aria-checked={level === entry.id}
                  className="tn-option"
                  onClick={() => {
                    setLevel(entry.id);
                    setFrom(entry.skipStage ? undefined : 'scratch');
                  }}
                >
                  <SignalBars level={entry.bars} />
                  <span className="tn-option__grow">{entry.label}</span>
                  <span className="tn-chip tn-chip--info">{entry.cefr}</span>
                </button>
              ))}
            </div>
            {level ? (
              <div className="tn-onboarding__start tn-rise-in">
                <h2 className="tn-title tn-title--sm">Where should we start?</h2>
                <div className="tn-options" role="radiogroup" aria-label="Where to start">
                  <button type="button" role="radio" aria-checked={from === 'scratch'} className="tn-option tn-start-card" onClick={() => setFrom('scratch')}>
                    <span className="tn-option__grow">
                      <strong>Start from scratch</strong>
                      <span className="tn-muted">Begin with sounds and greetings.</span>
                    </span>
                    <span className="tn-chip tn-chip--highlight">Recommended</span>
                  </button>
                  {skipStage ? (
                    <button type="button" role="radio" aria-checked={from === 'checkpoint'} className="tn-option tn-start-card" onClick={() => setFrom('checkpoint')}>
                      <span className="tn-option__grow">
                        <strong>Take the Stage {stageNumber} checkpoint</strong>
                        <span className="tn-muted">Pass it to skip ahead.</span>
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="tn-onboarding__content tn-step-in">
            <h1 className="tn-title">Get 2-minute prompts while you browse</h1>
            <div className="tn-onboarding__mock" aria-hidden="true">
              <NudgeCard demo now={now()} preview={{ dutch: 'Goedemorgen', english: 'Good morning' }} onLearn={() => {}} onNotNow={() => {}} onSnooze={() => {}} onQuiet={() => {}} />
            </div>
            <fieldset className="tn-fieldset" disabled={prompts !== undefined}>
              <legend className="tn-label">Show prompts on</legend>
              {SITES.map((site) => (
                <label key={site.id} className="tn-check">
                  <input type="checkbox" checked={sites[site.id]} onChange={(event) => setSites({ ...sites, [site.id]: event.target.checked })} />
                  {site.label}
                </label>
              ))}
              <span className="tn-label">After</span>
              <ChipGroup
                label="Prompt after"
                options={PROMPT_INTERVALS.map((value) => ({ value, label: `${value} min` }))}
                value={minutes}
                onChange={setMinutes}
              />
            </fieldset>
            <p className="tn-muted">You can change or pause this anytime in Settings.</p>
            {prompts === 'on' ? <p className="tn-onboarding__result">Prompts are on. See you on your next scroll.</p> : null}
            {prompts === 'off' ? <p className="tn-onboarding__result">Prompts are off. You can turn them on in Settings.</p> : null}
          </div>
        )}
      </div>
      <div className="tn-onboarding__zone">
        {step === 1 ? (
          <Button block disabled={!level || !from} onClick={() => setStep(2)}>
            Continue
          </Button>
        ) : prompts ? (
          <Button block onClick={finish}>
            {from === 'checkpoint' ? `Start the Stage ${stageNumber} checkpoint` : 'Start lesson 1'}
          </Button>
        ) : (
          <>
            <Button block onClick={turnOn} disabled={!SITES.some((site) => sites[site.id])}>
              Turn on prompts
            </Button>
            <Button block variant="ghost" onClick={() => setPrompts('off')}>
              Not now
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
