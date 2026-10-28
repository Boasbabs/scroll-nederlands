// Style tile: every core component and state at side-panel width, for visual checks.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/ui/theme.css';
import '../src/ui/motion.css';
import '../src/ui/components.css';
import { AudioButton, SpeechProvider } from '../src/ui/components/AudioButton';
import { Button } from '../src/ui/components/Button';
import { SquigglePattern, Sparks, Wordmark } from '../src/ui/components/Decor';
import { Icon } from '../src/ui/components/Icon';
import { IconTile, type TileKind } from '../src/ui/components/IconTile';
import { ProgressBar } from '../src/ui/components/ProgressBar';
import { previewSpeaker } from './preview-speaker';

const page: React.CSSProperties = { width: 380, margin: '24px auto', background: 'var(--ground-today)', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-float)' };
const section: React.CSSProperties = { display: 'grid', gap: 12, padding: 'var(--gutter)' };
const heading: React.CSSProperties = { fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-muted)' };

// The board in its two rows, each swatch labelled with the role it plays (docs/colour-system.md).
const PALETTE = [
  { name: 'Golden Yellow', token: '--golden-yellow', role: 'Look here', ink: 'var(--ink)' },
  { name: 'Seaweed Green', token: '--seaweed-green', role: 'Correct', ink: 'var(--ink)' },
  { name: 'Denim Blue', token: '--denim-blue', role: 'Soft', ink: 'var(--ink)' },
  { name: 'Mango Orange', token: '--mango-orange', role: 'Now', ink: 'var(--ink)' },
  { name: 'Warm Blue', token: '--warm-blue', role: 'Brand, action', ink: 'var(--white)' },
  { name: 'Dodger Blue', token: '--dodger-blue', role: 'Focus', ink: 'var(--ink)' },
  { name: 'Mid Blue', token: '--mid-blue', role: 'Selected', ink: 'var(--white)' },
  { name: 'Butterfly Bush', token: '--butterfly-bush', role: 'Checkpoint', ink: 'var(--white)' },
  { name: 'Flush Mahogany', token: '--flush-mahogany', role: 'Wrong', ink: 'var(--white)' },
  { name: 'Dark Cerulean', token: '--dark-cerulean', role: 'Dark', ink: 'var(--white)' },
];

// One light ground per surface, blues and greys only (theme.css).
const GROUNDS = [
  ['Today', '--ground-today'],
  ['Course', '--ground-course'],
  ['Review', '--ground-review'],
  ['Progress', '--ground-progress'],
  ['Settings', '--ground-settings'],
  ['Lesson', '--ground-player'],
];

// One tile colour per kind of activity, with its glyph.
const TILES: [TileKind, Parameters<typeof Icon>[0]['name'], string][] = [
  ['lessons', 'book', 'Lessons'],
  ['reviews', 'target', 'Reviews'],
  ['practice', 'bolt', 'Practice'],
  ['words', 'words', 'New words'],
  ['ear', 'ear', 'Ear'],
  ['articles', 'translate', 'de/het'],
  ['checkpoint', 'flag', 'Checkpoint'],
  ['soft', 'speaker', 'Settings'],
];

function StyleTile() {
  const [step, setStep] = useState(3);
  const [selected, setSelected] = useState(1);
  const [sheetKey, setSheetKey] = useState(0);
  return (
    <div className="tn-root" style={{ background: '#e4e6ec', minHeight: '100vh', padding: 1 }}>
      <div style={page}>
        <header className="tn-band" style={{ padding: '18px var(--gutter) 22px' }}>
          <SquigglePattern />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Wordmark size={26} />
            <span className="tn-chip tn-chip--highlight">Stage 0 · pre-A1</span>
          </div>
          <p className="tn-display" style={{ position: 'relative', marginTop: 10, fontSize: 'var(--text-xl)' }}>
            Goedemiddag! Ready for 2 minutes of Dutch?
          </p>
        </header>

        <div style={section}>
          <span style={heading}>Palette</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {PALETTE.map((swatch, i) => (
              <div key={swatch.token} style={{ display: 'grid', alignContent: 'space-between', minHeight: i < 5 ? 92 : 64, padding: 6, borderRadius: 8, background: `var(${swatch.token})`, color: swatch.ink, fontSize: 10, fontWeight: 800, lineHeight: 1.2 }}>
                <span>{swatch.name}</span>
                <span style={{ fontWeight: 600 }}>{swatch.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={section}>
          <span style={heading}>Grounds</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {GROUNDS.map(([name, token]) => (
              <div key={token} style={{ display: 'grid', alignContent: 'end', minHeight: 64, padding: 8, borderRadius: 12, background: `var(${token})`, boxShadow: 'inset 0 0 0 1px rgba(22, 23, 29, 0.06)', fontSize: 11, fontWeight: 800 }}>
                <span>{name}</span>
                <span className="tn-muted" style={{ fontWeight: 600 }}>Muted text</span>
              </div>
            ))}
          </div>
        </div>

        <div style={section}>
          <span style={heading}>Raised card and tiles</span>
          <button type="button" className="tn-card tn-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: 0, textAlign: 'left' }}>
            <IconTile kind="words" icon="words" />
            <span style={{ flex: 1, display: 'grid', gap: 6 }}>
              <strong>Learn 5 words</strong>
              <ProgressBar value={3} max={5} label="Words" count />
            </span>
            <span className="tn-btn tn-btn--secondary tn-btn--sm">Hint</span>
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {TILES.map(([kind, icon, name]) => (
              <span key={kind} style={{ display: 'grid', justifyItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}>
                <IconTile kind={kind} icon={icon} size={44} />
                {name}
              </span>
            ))}
          </div>
        </div>

        <div style={section}>
          <span style={heading}>Progress</span>
          <ProgressBar value={step} max={8} label="Lesson progress" />
          <ProgressBar value={step} max={8} label="Lesson progress" count />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button>
            <Button size="sm" onClick={() => setStep((value) => Math.min(8, value + 1))}>Advance</Button>
          </div>
        </div>

        <div style={section}>
          <span style={heading}>Learn card</span>
          <article className="tn-card tn-rise-in" style={{ padding: 18, display: 'grid', gap: 12 }}>
            <span className="tn-chip tn-chip--info" style={{ justifySelf: 'start' }}>New phrase</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AudioButton text="Goedemiddag!" />
              <AudioButton text="Goedemiddag!" slow />
              <h2 className="tn-dutch" style={{ fontSize: 'var(--text-2xl)' }}>Goedemiddag!</h2>
            </div>
            <p className="tn-muted">Good afternoon!</p>
            <p className="tn-tip"><strong>Tip</strong>The final g is the throaty ch: “khoo-duh-MID-dakh”.</p>
          </article>
        </div>

        <div style={section}>
          <span style={heading}>Options</span>
          {['Goedemorgen!', 'Goedemiddag!', 'Goedenavond!'].map((option, i) => (
            <button key={option} type="button" className="tn-option tn-settle-in" style={{ '--i': i } as React.CSSProperties} aria-pressed={selected === i} onClick={() => setSelected(i)}>
              <span className="tn-option__key">{i + 1}</span>
              {option}
            </button>
          ))}
          <button type="button" className="tn-option" data-state="correct"><span className="tn-option__key"><Icon name="check" size={16} /></span>Correct state</button>
          <button type="button" className="tn-option tn-shake" data-state="wrong"><span className="tn-option__key"><Icon name="cross" size={16} /></span>Wrong state</button>
        </div>

        <div style={section}>
          <span style={heading}>Tiles and input</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Ik', 'wil', 'graag', 'betalen.'].map((word) => (
              <button key={word} type="button" className="tn-tile">{word}</button>
            ))}
            <span className="tn-tile tn-tile--ghost">koffie</span>
          </div>
          <input className="tn-input" placeholder="Type in Dutch" defaultValue="Ik wil graag betalen" />
        </div>

        <div style={section}>
          <span style={heading}>Buttons</span>
          <Button block>Learn now</Button>
          <Button block variant="secondary">Not now</Button>
          <Button block disabled>Check</Button>
          <section className="tn-review-card" style={{ display: 'grid', gap: 8, justifyItems: 'start', padding: 18, borderRadius: 'var(--radius-lg)', background: 'var(--highlight)' }}>
            <p className="tn-display" style={{ fontSize: 20 }}>3 reviews due</p>
            <Button variant="ink">Review now</Button>
          </section>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="ghost" size="sm">Snooze</Button>
            <button type="button" className="tn-icon-btn" aria-label="More"><Icon name="more" /></button>
            <button type="button" className="tn-icon-btn" aria-label="Close"><Icon name="close" /></button>
            <button type="button" className="tn-round-btn" aria-label="Close"><Icon name="close" size={18} /></button>
          </div>
        </div>

        <div style={section}>
          <span style={heading}>Dialog and toast</span>
          <div className="tn-dialog-card">
            <button type="button" className="tn-round-btn" aria-label="Close"><Icon name="close" size={18} /></button>
            <h2 className="tn-dialog-card__title">Quit lesson?</h2>
            <p className="tn-muted">Your answers in this session won’t be saved.</p>
            <Button block>Keep learning</Button>
            <Button block variant="secondary">Quit</Button>
          </div>
          <p style={{ justifySelf: 'center', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 'var(--radius-pill)', background: 'var(--toast)', color: 'var(--on-toast)', fontWeight: 700 }}>
            Snoozed until 15:30 <span style={{ textDecoration: 'underline' }}>Undo</span>
          </p>
        </div>

        <div style={{ ...section, paddingBottom: 0 }}>
          <span style={heading}>Feedback</span>
          <Button size="sm" variant="secondary" onClick={() => setSheetKey((key) => key + 1)}>Replay feedback</Button>
        </div>
        <div key={sheetKey} style={{ display: 'grid', gap: 12, paddingTop: 12 }}>
          <div className="tn-sheet tn-sheet--correct">
            <p className="tn-sheet__title">
              <span className="tn-sheet__mark"><Icon name="check" /><Sparks /></span>
              Goed zo!
            </p>
            <p style={{ marginBottom: 12 }}>Meaning: Good afternoon!</p>
            <Button block variant="correct">Continue</Button>
          </div>
          <div className="tn-sheet tn-sheet--wrong">
            <p className="tn-sheet__title">
              <span className="tn-sheet__mark"><Icon name="cross" /></span>
              Not quite
            </p>
            <p style={{ marginBottom: 4 }}>Correct answer:</p>
            <p className="tn-dutch" style={{ fontSize: 'var(--text-lg)', marginBottom: 12 }}>
              Ik wil <span className="tn-miss">graag</span> betalen.
            </p>
            <Button block variant="wrong">Got it</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <SpeechProvider speaker={previewSpeaker}>
    <StyleTile />
  </SpeechProvider>,
);
