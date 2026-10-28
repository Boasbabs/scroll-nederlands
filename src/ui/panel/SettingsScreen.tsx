// Settings: grouped cards, label left, control right, changes apply at once.
import { useEffect, useState } from 'react';
import { bundledImages, type ImageManifest } from '../../images/manifest';
import { snoozeEnd, type SnoozeChoice } from '../../trigger/browsing';
import { SITE_IDS, switchSites, type SiteId } from '../../sites';
import { NEW_WORDS_CHOICES } from '../../storage/store';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useEnv } from '../env';
import { formatClock } from '../format';
import { HetImageChoice } from '../player/het';
import { ChipGroup, ConfirmDialog, Group, RowTile, Toggle } from './controls';
import { SitePicker } from './SitePicker';

export const PROMPT_INTERVALS = [5, 8, 15, 30] as const;

const SNOOZES: ReadonlyArray<{ choice: SnoozeChoice; label: string }> = [
  { choice: '30m', label: '30 min' },
  { choice: '1h', label: '1 hour' },
  { choice: 'tomorrow', label: 'Until tomorrow' },
];

/** Who made the bundled pictures, under which license (CC BY asks for this). */
function ImageCredits({ images }: { images: ImageManifest }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(images);
  if (entries.length === 0) return null;
  return (
    <Group title="Image credits">
      <div className="tn-row tn-row--stack">
        <button type="button" className="tn-row__button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <RowTile icon="image" />
          <span className="tn-row__label">Pictures in the lessons ({entries.length})</span>
          <Icon name="chevron" size={20} />
        </button>
        {open ? (
          <ul className="tn-credits tn-rise-in">
            {entries.map(([dutch, credit]) => (
              <li key={dutch}>
                <span lang="nl">{dutch}</span>
                <span className="tn-muted">
                  {credit.source ? (
                    <a href={credit.source} target="_blank" rel="noopener noreferrer">
                      Photo
                    </a>
                  ) : (
                    'Photo'
                  )}{' '}
                  by {credit.author} ·{' '}
                  {credit.licenseUrl ? (
                    <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">
                      {credit.license}
                    </a>
                  ) : (
                    credit.license
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Group>
  );
}

export function SettingsScreen({ images = bundledImages }: { images?: ImageManifest }) {
  const { prefs, setPrefs, permissions, learning, now } = useEnv();
  const [confirmReset, setConfirmReset] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const snoozed = prefs.snoozeUntil && prefs.snoozeUntil > now() ? prefs.snoozeUntil : undefined;
  const anySite = SITE_IDS.some((id) => prefs.sites[id]);

  // Chrome can take a site's access away (its site access menu); such a site shows as off.
  useEffect(() => {
    let live = true;
    void permissions
      ?.granted()
      .then((granted) => {
        const lost = SITE_IDS.filter((id) => prefs.sites[id] && !granted[id]);
        if (live && lost.length > 0) void setPrefs({ sites: switchSites(prefs.sites, lost, false) });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // Checked once, when Settings opens.
  }, []);

  // The permission request must run straight from the click, before any await.
  function enableSites(ids: ReadonlyArray<SiteId>) {
    const asked = permissions ? permissions.request(ids) : Promise.resolve(true);
    // Chrome throws instead of asking when its copy of the manifest lacks a site (rebuilt, not reloaded): a refusal.
    void asked.catch(() => false).then(async (granted) => {
      if (!granted) {
        setNotice('Chrome did not allow access, so prompts stay off.');
        return;
      }
      setNotice(undefined);
      await setPrefs({ sites: switchSites(prefs.sites, ids, true) });
    });
  }

  function setSites(ids: ReadonlyArray<SiteId>, on: boolean) {
    if (ids.length === 0) return;
    if (on) {
      enableSites(ids);
      return;
    }
    void permissions?.revoke(ids).catch(() => undefined);
    void setPrefs({ sites: switchSites(prefs.sites, ids, false) });
  }

  return (
    <div className="tn-screen">
      <Group title="Browsing prompts">
        {anySite ? null : (
          <div className="tn-row tn-row--notice">
            <RowTile icon="bellSlash" />
            <span className="tn-row__label">Prompts are off</span>
            <button type="button" className="tn-link" onClick={() => enableSites(SITE_IDS)}>
              Turn on
            </button>
          </div>
        )}
        {notice ? <p className="tn-row__helper tn-row--pad">{notice}</p> : null}
        <div className="tn-row tn-row--stack">
          <div className="tn-row__head">
            <RowTile icon="browser" />
            <div className="tn-row__text">
              <span className="tn-row__label">Sites</span>
              <span className="tn-row__helper">Prompts show only on the sites you pick.</span>
            </div>
          </div>
          <SitePicker value={prefs.sites} onChange={setSites} />
        </div>
        <div className="tn-row tn-row--stack">
          <div className="tn-row__head">
            <RowTile icon="timer" />
            <div className="tn-row__text">
              <span className="tn-row__label">Prompt after</span>
              <span className="tn-row__helper">Minutes of active browsing before a 2-minute break.</span>
            </div>
          </div>
          <ChipGroup
            label="Prompt after"
            options={PROMPT_INTERVALS.map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
            value={prefs.promptAfterMinutes}
            onChange={(minutes) => void setPrefs({ promptAfterMinutes: minutes })}
          />
        </div>
        <Toggle icon="moon" label="Quiet mode" helper="No prompts until you turn this off" checked={prefs.quietMode} onChange={(on) => void setPrefs({ quietMode: on })} />
        {snoozed ? (
          <div className="tn-row">
            <RowTile icon="alarm" />
            <span className="tn-row__label">Snoozed until {formatClock(snoozed)}</span>
            <button type="button" className="tn-link" onClick={() => void setPrefs({ snoozeUntil: undefined })}>
              Resume
            </button>
          </div>
        ) : (
          <div className="tn-row tn-row--stack">
            <button type="button" className="tn-row__button" aria-expanded={snoozeOpen} onClick={() => setSnoozeOpen((open) => !open)}>
              <RowTile icon="alarm" />
              <span className="tn-row__label">Snooze</span>
              <Icon name="chevron" size={20} />
            </button>
            {snoozeOpen ? (
              <ChipGroup
                label="Snooze for"
                options={SNOOZES.map((entry) => ({ value: entry.choice, label: entry.label }))}
                value={undefined}
                onChange={(choice) => {
                  setSnoozeOpen(false);
                  void setPrefs({ snoozeUntil: snoozeEnd(choice, now()) });
                }}
              />
            ) : null}
          </div>
        )}
      </Group>

      <Group title="Audio">
        <Toggle icon="speaker" label="Autoplay audio" checked={prefs.autoplayAudio} onChange={(on) => void setPrefs({ autoplayAudio: on })} />
        <div className="tn-row">
          <RowTile icon="gauge" />
          <span className="tn-row__label">Audio speed</span>
          <ChipGroup
            label="Audio speed"
            options={[
              { value: 'slow', label: 'Slow' },
              { value: 'normal', label: 'Normal' },
            ]}
            value={prefs.speechRate < 1 ? 'slow' : 'normal'}
            onChange={(speed) => void setPrefs({ speechRate: speed === 'slow' ? 0.85 : 1 })}
          />
        </div>
        <Toggle icon="music" label="Sound effects" checked={prefs.soundEffects} onChange={(on) => void setPrefs({ soundEffects: on })} />
      </Group>

      <Group title="Learning">
        <Toggle
          icon="translate"
          label="Show translations"
          helper="Off: cards show the Dutch first, with the English behind Show meaning"
          checked={prefs.showTranslations}
          onChange={(on) => void setPrefs({ showTranslations: on })}
        />
        <div className="tn-row tn-row--stack">
          <div className="tn-row__head">
            <RowTile icon="image" />
            <div className="tn-row__text">
              <span className="tn-row__label">Het-word image</span>
              <span className="tn-row__helper">Picture every het-word this way (het mes, het huis), so the picture tells you het.</span>
            </div>
          </div>
          <HetImageChoice label="Het-word image" />
        </div>
      </Group>

      <Group title="Basic words">
        <div className="tn-row tn-row--stack">
          <div className="tn-row__head">
            <RowTile icon="words" />
            <div className="tn-row__text">
              <span className="tn-row__label">New words a day</span>
              <span className="tn-row__helper">Everyday words, learned beside the course.</span>
            </div>
          </div>
          <ChipGroup<number>
            label="New words a day"
            options={NEW_WORDS_CHOICES.map((value) => ({ value, label: value === 0 ? 'Off' : String(value) }))}
            value={prefs.newWordsPerDay}
            onChange={(value) => void setPrefs({ newWordsPerDay: value })}
          />
        </div>
      </Group>

      <ImageCredits images={images} />

      <Group title="Progress">
        <Button variant="ghost" className="tn-row__danger" onClick={() => setConfirmReset(true)}>
          <RowTile icon="refresh" />
          Reset progress
        </Button>
      </Group>

      {confirmReset ? (
        <ConfirmDialog
          title="Reset all progress?"
          body="Lessons and reviews go back to the start. This can’t be undone."
          keep="Keep my progress"
          confirm="Reset everything"
          onKeep={() => setConfirmReset(false)}
          onConfirm={() => {
            setConfirmReset(false);
            void learning.resetProgress().then(() => setPrefs({}));
          }}
        />
      ) : null}
    </div>
  );
}
