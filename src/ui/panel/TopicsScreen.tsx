// Topics tab: the scenario packs (Situations), the word sets (Tricky words)
// and the word themes (tier 2 under More words), each with its progress. A
// pack's page plays its scenes in order and holds its mission; a set's page
// is the same, part by part; a theme's page practises the words already met
// or brings in new ones, within the daily limit.
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { LearningItem, Lesson } from '../../curriculum/types';
import { isSet, type PlacedPack } from '../../packs/assemble';
import { itemStrength, type ItemStrength } from '../../engine/schedule';
import { isLessonDone, REVIEW_BATCH, themeWordsLeftToday, WORD_BATCH, wordsLeftToday } from '../../engine/selection';
import { summarizePack, summarizeTopic } from '../../engine/summary';
import type { LearnerProgress } from '../../engine/types';
import type { Snapshot } from '../../learning/actions';
import type { PlacedTheme } from '../../words/assemble';
import { AudioButton } from '../components/AudioButton';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { IconTile } from '../components/IconTile';
import { ProgressBar } from '../components/ProgressBar';
import { useEnv } from '../env';
import { packTerms, plural } from '../format';
import type { StartSession } from './PanelApp';

type TopicsProps = {
  snap: Snapshot;
  start: StartSession;
  /** The pack or theme whose page is open; none shows the list. */
  openId?: string;
  onOpen: (id: string | undefined) => void;
  /** Learner data changed here (a mission ticked). */
  onChange: () => void;
};

const STRENGTH_LABEL: Record<ItemStrength, string> = { new: 'New', learning: 'Learning', strong: 'Strong' };

/** Rows after this one settle in together, so a long list does not keep arriving. */
const LAST_STAGGERED = 8;

export function TopicsScreen({ snap, start, openId, onOpen, onChange }: TopicsProps) {
  const { course } = useEnv();
  // Pack and theme ids never collide (validatePacks).
  const pack = openId ? course.packs.find((entry) => entry.id === openId) : undefined;
  if (pack) return <PackPage pack={pack} snap={snap} start={start} onBack={() => onOpen(undefined)} onChange={onChange} />;
  const theme = openId ? course.themes.find((entry) => entry.id === openId) : undefined;
  if (theme) return <TopicPage theme={theme} snap={snap} start={start} onBack={() => onOpen(undefined)} />;
  return <TopicList snap={snap} onOpen={onOpen} />;
}

function TopicList({ snap, onOpen }: { snap: Snapshot; onOpen: (id: string) => void }) {
  const { course, now } = useEnv();
  const at = now();
  const situations = course.packs.filter((pack) => !isSet(pack));
  const sets = course.packs.filter(isSet);
  // Tier 2 (words 626–1,000) under its own heading, after the basic themes.
  const basics = course.themes.filter((theme) => theme.tier === 1);
  const more = course.themes.filter((theme) => theme.tier === 2);
  const row = (pack: PlacedPack, index: number) => <PackRow key={pack.id} pack={pack} progress={snap.progress} at={at} index={index} onOpen={onOpen} />;
  return (
    <div className="tn-screen">
      {situations.length > 0 ? (
        <section className="tn-section">
          <h2 className="tn-section__title">Situations</h2>
          <p className="tn-section__lead">Real life in the Netherlands, scene by scene.</p>
          <ul className="tn-panel-card tn-today-list">{situations.map((pack, i) => row(pack, i))}</ul>
        </section>
      ) : null}
      {sets.length > 0 ? (
        <section className="tn-section">
          <h2 className="tn-section__title">Tricky words</h2>
          <p className="tn-section__lead">Short sets on the words that trip up English speakers.</p>
          <ul className="tn-panel-card tn-today-list">{sets.map((pack, i) => row(pack, situations.length + i))}</ul>
        </section>
      ) : null}
      <section className="tn-section">
        <h2 className="tn-section__title">Word themes</h2>
        <p className="tn-section__lead">Practise one theme&rsquo;s words, or learn new ones from it.</p>
        <ul className="tn-panel-card tn-today-list">
          {basics.map((theme, i) => (
            <TopicRow key={theme.id} theme={theme} snap={snap} at={at} index={course.packs.length + i} onOpen={onOpen} />
          ))}
        </ul>
      </section>
      {more.length > 0 ? (
        <section className="tn-section">
          <h2 className="tn-section__title">More words</h2>
          <p className="tn-section__lead">Words 626 to 1,000. Today adds them once most core words are met; open a theme to start it now.</p>
          <ul className="tn-panel-card tn-today-list">
            {more.map((theme, i) => (
              <TopicRow key={theme.id} theme={theme} snap={snap} at={at} index={course.packs.length + basics.length + i} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** A pack's line: where the learner is in its scenes (a set's parts), and its words met. */
function packMeta(pack: PlacedPack, progress: LearnerProgress, at: number): string {
  const summary = summarizePack(pack, progress, at);
  const { step, Step } = packTerms(pack);
  const met = summary.items.total - summary.items.new;
  const due = summary.items.due > 0 ? ` · ${summary.items.due} due` : '';
  if (!summary.next) return `All ${summary.scenes.total} ${step}s done${due}`;
  if (!summary.started) return `${plural(summary.scenes.total, step)} · ${summary.items.total} phrases and words`;
  return `${Step} ${summary.scenes.completed + 1} of ${summary.scenes.total} · ${met} of ${summary.items.total} met${due}`;
}

/** A pack as a line of the list, in the Today tab's row style; its bar counts scenes. A set's tile shows two languages. */
function PackRow({ pack, progress, at, index, onOpen }: { pack: PlacedPack; progress: LearnerProgress; at: number; index: number; onOpen: (id: string) => void }) {
  const metaId = useId();
  const scenes = pack.scenes.filter((scene) => isLessonDone(progress, scene.id)).length;
  return (
    <li className="tn-settle-in" style={{ '--i': Math.min(index, LAST_STAGGERED) } as CSSProperties}>
      <button type="button" className="tn-today-row" aria-label={pack.title} aria-describedby={metaId} onClick={() => onOpen(pack.id)}>
        <IconTile icon={isSet(pack) ? 'translate' : 'chats'} kind="packs" />
        <span className="tn-today-row__text">
          <span className="tn-today-row__title">{pack.title}</span>
          <span className="tn-today-row__meta" id={metaId}>
            {packMeta(pack, progress, at)}
          </span>
          <ProgressBar value={scenes} max={pack.scenes.length} thin decorative />
        </span>
        <Icon name="chevron" size={20} />
      </button>
    </li>
  );
}

/** A theme as a line of the list, in the Today tab's row style: tile, name, how far along. */
function TopicRow({ theme, snap, at, index, onOpen }: { theme: PlacedTheme; snap: Snapshot; at: number; index: number; onOpen: (id: string) => void }) {
  const metaId = useId();
  const summary = summarizeTopic(theme.items, snap.progress, at);
  const met = summary.total - summary.new;
  const meta = [`${met} of ${summary.total} met`, summary.due > 0 ? `${summary.due} due` : undefined].filter(Boolean).join(' · ');
  return (
    <li className="tn-settle-in" style={{ '--i': Math.min(index, LAST_STAGGERED) } as CSSProperties}>
      <button type="button" className="tn-today-row" aria-label={theme.title} aria-describedby={metaId} onClick={() => onOpen(theme.id)}>
        <IconTile icon="words" kind="words" />
        <span className="tn-today-row__text">
          <span className="tn-today-row__title">{theme.title}</span>
          <span className="tn-today-row__meta" id={metaId}>
            {meta}
          </span>
          {/* The meta line says the count; the bar only shows it. */}
          <ProgressBar value={met} max={summary.total} thin decorative />
        </span>
        <Icon name="chevron" size={20} />
      </button>
    </li>
  );
}

/** Why there is no Learn button while the theme still has new words. */
function noNewWordsReason(perDay: number, leftToday: number): string {
  if (perDay <= 0) return 'New words are turned off in Settings.';
  if (leftToday <= 0) return `That's today's ${plural(perDay, 'new word')}. More tomorrow, or raise the limit in Settings.`;
  return 'You learned a batch from this theme today. More tomorrow.';
}

function TopicPage({ theme, snap, start, onBack }: { theme: PlacedTheme; snap: Snapshot; start: StartSession; onBack: () => void }) {
  const { learning, course, now } = useEnv();
  const back = usePageStart(theme.id);
  const at = now();
  const { progress, prefs } = snap;
  const summary = summarizeTopic(theme.items, progress, at);
  const met = summary.total - summary.new;
  const batch = Math.min(WORD_BATCH.focused, themeWordsLeftToday(course, progress, at, prefs.newWordsPerDay, theme.id));
  const practise = met > 0 ? () => void start(() => learning.startTopicPractice(theme.id)) : undefined;
  const learn = batch > 0 ? () => void start(() => learning.startTopicWords(theme.id)) : undefined;

  return (
    <div className="tn-screen tn-topic">
      <button ref={back} type="button" className="tn-topic__back" onClick={onBack}>
        <Icon name="back" size={18} />
        All topics
      </button>

      <section className="tn-continue tn-topic__head" aria-labelledby="tn-topic-title">
        <h2 className="tn-continue__title" id="tn-topic-title">
          {theme.title}
        </h2>
        <ul className="tn-topic__counts" aria-label="Words by strength">
          {(['new', 'learning', 'strong'] as const).map((strength) => (
            <li key={strength} data-strength={strength}>
              {summary[strength]} {STRENGTH_LABEL[strength].toLowerCase()}
            </li>
          ))}
        </ul>
        <ProgressBar value={met} max={summary.total} label={`${theme.title}: words met`} count />
        {practise ? (
          <Button block onClick={practise}>
            {summary.due > 0 ? `Practise · ${summary.due} due` : `Practise ${plural(Math.min(met, REVIEW_BATCH.focused), 'word')}`}
          </Button>
        ) : null}
        {learn ? (
          <Button block variant={practise ? 'secondary' : 'primary'} onClick={learn}>
            Learn {plural(batch, 'new word')}
          </Button>
        ) : null}
        {summary.new === 0 ? (
          <p className="tn-topic__note">You have met every word in this theme.</p>
        ) : learn ? null : (
          <p className="tn-topic__note">{noNewWordsReason(prefs.newWordsPerDay, wordsLeftToday(course, progress, at, prefs.newWordsPerDay))}</p>
        )}
      </section>

      <section className="tn-section">
        <h3 className="tn-section__title">Words</h3>
        <ItemList items={theme.items} progress={progress} />
      </section>
    </div>
  );
}

/**
 * A topic's items, each with audio, its meaning and its strength as a dot and
 * a label. A set adds each word's note after its meaning, as the lesson's key
 * phrases do: the note is what to say for the English look-alike.
 */
function ItemList({ items, progress, notes = false }: { items: ReadonlyArray<LearningItem>; progress: LearnerProgress; notes?: boolean }) {
  return (
    <ul className="tn-panel-card tn-topic__words">
      {items.map((item) => {
        const strength = itemStrength(progress.items[item.id]);
        return (
          <li key={item.id} className="tn-word-row" data-strength={strength}>
            <AudioButton text={item.dutch} size="small" label={`Play ${item.dutch}`} />
            <span className="tn-word-row__text">
              <span className="tn-word-row__dutch" lang="nl">
                {item.dutch}
              </span>
              <span className="tn-word-row__english">
                {item.english}
                {notes && item.note ? ` · ${item.note}` : null}
              </span>
            </span>
            <span className="tn-word-row__status">{STRENGTH_LABEL[strength]}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** The page starts at its top with focus on the way back, as it replaces the list. */
function usePageStart(id: string) {
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    back.current?.focus({ preventScroll: true });
    const main = back.current?.closest('.tn-shell__main');
    if (main) main.scrollTop = 0;
  }, [id]);
  return back;
}

type SceneState = 'done' | 'next' | 'locked';

function sceneState(scene: Lesson, next: Lesson | undefined, progress: LearnerProgress): SceneState {
  if (isLessonDone(progress, scene.id)) return 'done';
  return scene.id === next?.id ? 'next' : 'locked';
}

const SCENE_META: Record<SceneState, (number: number, step: string) => string> = {
  done: () => 'Done · play again',
  next: () => 'Up next',
  locked: (number, step) => `After ${step} ${number - 1}`,
};

/** One scene (a set's part) as a step: a disc with its number (a tick once done, a lock until its turn), its title, what it is now. */
function SceneRow({ scene, number, state, terms, onStart }: { scene: Lesson; number: number; state: SceneState; terms: ReturnType<typeof packTerms>; onStart: () => void }) {
  const metaId = useId();
  return (
    <li className="tn-pack-step" data-state={state}>
      <button type="button" className="tn-pack-step__row" disabled={state === 'locked'} aria-label={`${terms.Step} ${number}: ${scene.title}`} aria-describedby={metaId} onClick={onStart}>
        <span className="tn-pack-step__disc" aria-hidden="true">
          {state === 'done' ? <Icon name="check" size={16} /> : state === 'locked' ? <Icon name="lock" size={14} /> : number}
        </span>
        <span className="tn-pack-step__text">
          <span className="tn-pack-step__title">{scene.title}</span>
          <span className="tn-pack-step__meta" id={metaId}>
            {SCENE_META[state](number, terms.step)}
          </span>
        </span>
        {state === 'locked' ? null : <Icon name="chevron" size={20} />}
      </button>
    </li>
  );
}

/**
 * "Do it for real": the learner ticks the mission off themselves. The tick is
 * shown at once and saved apart from progress; it is never scored.
 */
function MissionCard({ pack, mission, done, onChange }: { pack: PlacedPack; mission: string; done: boolean; onChange: () => void }) {
  const { learning } = useEnv();
  const [ticked, setTicked] = useState(done);
  // Only a tick made here pops; one that was already there just shows.
  const [popped, setPopped] = useState(false);
  useEffect(() => setTicked(done), [done]);
  function toggle() {
    const next = !ticked;
    setTicked(next);
    setPopped(next);
    void learning.setMission(pack.id, next).then(onChange);
  }
  return (
    <div className="tn-panel-card tn-mission" data-done={ticked || undefined}>
      <p className="tn-mission__text">{mission}</p>
      <button type="button" className="tn-mission__tick" aria-pressed={ticked} onClick={toggle}>
        <span className={`tn-mission__box${ticked && popped ? ' tn-tick' : ''}`} aria-hidden="true">
          {ticked ? <Icon name="check" size={16} /> : null}
        </span>
        Done it
      </button>
    </div>
  );
}

/** "Best after: Stage 3 · Service situations": the latest course module the pack builds on. */
function bestAfter(course: ReturnType<typeof useEnv>['course'], pack: PlacedPack): string | undefined {
  const modules = course.curriculum.stages.flatMap((stage) => stage.modules.map((module) => ({ stage, module })));
  const last = modules.filter(({ module }) => pack.buildsOn.includes(module.id)).at(-1);
  return last && `Best after: ${last.stage.title.split(' · ')[0]} · ${last.module.title}`;
}

function PackPage({ pack, snap, start, onBack, onChange }: { pack: PlacedPack; snap: Snapshot; start: StartSession; onBack: () => void; onChange: () => void }) {
  const { learning, course, now } = useEnv();
  const back = usePageStart(pack.id);
  const { progress } = snap;
  const summary = summarizePack(pack, progress, now());
  const met = summary.items.total - summary.items.new;
  const next = summary.next;
  const nextNumber = next ? pack.scenes.indexOf(next) + 1 : 0;
  const context = bestAfter(course, pack);
  const terms = packTerms(pack);
  const play = (scene: Lesson) => () => void start(() => learning.startLesson(scene.id, 'focused'));
  const practise = met > 0 ? () => void start(() => learning.startPackPractice(pack.id)) : undefined;

  return (
    <div className="tn-screen tn-topic">
      <button ref={back} type="button" className="tn-topic__back" onClick={onBack}>
        <Icon name="back" size={18} />
        All topics
      </button>

      <section className="tn-continue tn-topic__head" aria-labelledby="tn-pack-title">
        {context ? <p className="tn-continue__context">{context}</p> : null}
        <h2 className="tn-continue__title" id="tn-pack-title">
          {pack.title}
        </h2>
        <p className="tn-pack__situation">{pack.situation}</p>
        <ProgressBar value={summary.scenes.completed} max={summary.scenes.total} label={`${pack.title}: ${terms.step}s done`} count />
        {next ? (
          <Button block onClick={play(next)}>
            {progress.lessons[next.id]?.startedAt ? 'Continue' : 'Start'} {terms.step} {nextNumber}
          </Button>
        ) : null}
        {practise ? (
          <Button block variant={next ? 'secondary' : 'primary'} onClick={practise}>
            {summary.items.due > 0 ? `Practise this ${terms.whole} · ${summary.items.due} due` : `Practise this ${terms.whole}`}
          </Button>
        ) : null}
        {next ? null : <p className="tn-topic__note">You have done every {terms.step}. Practise to keep it fresh.</p>}
      </section>

      <section className="tn-section">
        <h3 className="tn-section__title">{terms.Step}s</h3>
        <ol className="tn-panel-card tn-pack-steps">
          {pack.scenes.map((scene, i) => (
            <SceneRow key={scene.id} scene={scene} number={i + 1} state={sceneState(scene, next, progress)} terms={terms} onStart={play(scene)} />
          ))}
        </ol>
      </section>

      {pack.mission ? (
        <section className="tn-section">
          <h3 className="tn-section__title">Do it for real</h3>
          <MissionCard pack={pack} mission={pack.mission} done={pack.id in snap.missions} onChange={onChange} />
        </section>
      ) : null}

      {pack.cultureNote ? (
        <section className="tn-section">
          <h3 className="tn-section__title">Good to know</h3>
          <div className="tn-panel-card tn-culture">
            <IconTile icon="bulb" kind="soft" size={32} />
            <p>{pack.cultureNote}</p>
          </div>
        </section>
      ) : null}

      <section className="tn-section">
        <h3 className="tn-section__title">Phrases and words</h3>
        <ItemList items={pack.members} progress={progress} notes={isSet(pack)} />
      </section>
    </div>
  );
}
