// Topics tab: the basic-word themes, each with its progress. A theme's page
// practises the words already met or brings in new ones, within the daily limit.
import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { itemStrength, type ItemStrength } from '../../engine/schedule';
import { REVIEW_BATCH, themeWordsLeftToday, WORD_BATCH, wordsLeftToday } from '../../engine/selection';
import { summarizeTopic } from '../../engine/summary';
import type { Snapshot } from '../../learning/actions';
import type { PlacedTheme } from '../../words/assemble';
import { AudioButton } from '../components/AudioButton';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { IconTile } from '../components/IconTile';
import { ProgressBar } from '../components/ProgressBar';
import { useEnv } from '../env';
import { plural } from '../format';
import type { StartSession } from './PanelApp';

type TopicsProps = {
  snap: Snapshot;
  start: StartSession;
  /** The theme whose page is open; none shows the list. */
  openId?: string;
  onOpen: (id: string | undefined) => void;
};

const STRENGTH_LABEL: Record<ItemStrength, string> = { new: 'New', learning: 'Learning', strong: 'Strong' };

/** Rows after this one settle in together, so a long list does not keep arriving. */
const LAST_STAGGERED = 8;

export function TopicsScreen({ snap, start, openId, onOpen }: TopicsProps) {
  const { course } = useEnv();
  const theme = openId ? course.themes.find((entry) => entry.id === openId) : undefined;
  if (theme) return <TopicPage theme={theme} snap={snap} start={start} onBack={() => onOpen(undefined)} />;
  return <TopicList snap={snap} onOpen={onOpen} />;
}

function TopicList({ snap, onOpen }: { snap: Snapshot; onOpen: (id: string) => void }) {
  const { course, now } = useEnv();
  const at = now();
  return (
    <div className="tn-screen">
      <section className="tn-section">
        <h2 className="tn-section__title">Word themes</h2>
        <p className="tn-section__lead">Practise one theme&rsquo;s words, or learn new ones from it.</p>
        <ul className="tn-panel-card tn-today-list">
          {course.themes.map((theme, i) => (
            <TopicRow key={theme.id} theme={theme} snap={snap} at={at} index={i} onOpen={onOpen} />
          ))}
        </ul>
      </section>
    </div>
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
  const back = useRef<HTMLButtonElement>(null);
  const at = now();
  const { progress, prefs } = snap;
  const summary = summarizeTopic(theme.items, progress, at);
  const met = summary.total - summary.new;
  const batch = Math.min(WORD_BATCH.focused, themeWordsLeftToday(course, progress, at, prefs.newWordsPerDay, theme.id));
  const practise = met > 0 ? () => void start(() => learning.startTopicPractice(theme.id)) : undefined;
  const learn = batch > 0 ? () => void start(() => learning.startTopicWords(theme.id)) : undefined;

  // The page replaces the list: start at its top, with focus on the way back.
  useEffect(() => {
    back.current?.focus({ preventScroll: true });
    const main = back.current?.closest('.tn-shell__main');
    if (main) main.scrollTop = 0;
  }, [theme.id]);

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
        <ul className="tn-panel-card tn-topic__words">
          {theme.items.map((item) => {
            const strength = itemStrength(progress.items[item.id]);
            return (
              <li key={item.id} className="tn-word-row" data-strength={strength}>
                <AudioButton text={item.dutch} size="small" label={`Play ${item.dutch}`} />
                <span className="tn-word-row__text">
                  <span className="tn-word-row__dutch" lang="nl">
                    {item.dutch}
                  </span>
                  <span className="tn-word-row__english">{item.english}</span>
                </span>
                <span className="tn-word-row__status">{STRENGTH_LABEL[strength]}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
