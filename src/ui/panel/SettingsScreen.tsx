// Settings: grouped cards, label left, control right, changes apply at once.
import { useState } from 'react';
import { snoozeEnd, type SnoozeChoice } from '../../trigger/browsing';
import { SITES, type SiteId } from '../../sites';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useEnv } from '../env';
import { formatClock } from '../format';
import { ChipGroup, ConfirmDialog, Group, Toggle } from './controls';

export const PROMPT_INTERVALS = [5, 8, 15, 30] as const;

const SNOOZES: ReadonlyArray<{ choice: SnoozeChoice; label: string }> = [
  { choice: '30m', label: '30 min' },
  { choice: '1h', label: '1 hour' },
  { choice: 'tomorrow', label: 'Until tomorrow' },
];

export function SettingsScreen() {
  const { prefs, setPrefs, permissions, learning, now } = useEnv();
  const [confirmReset, setConfirmReset] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const snoozed = prefs.snoozeUntil && prefs.snoozeUntil > now() ? prefs.snoozeUntil : undefined;
  const anySite = SITES.some((site) => prefs.sites[site.id]);

  // The permission request must run straight from the click, before any await.
  function enableSites(ids: ReadonlyArray<SiteId>) {
    const asked = permissions ? permissions.request(ids) : Promise.resolve(true);
    void asked.then(async (granted) => {
      if (!granted) {
        setNotice('Chrome did not allow access, so prompts stay off.');
        return;
      }
      setNotice(undefined);
      await setPrefs({ sites: { ...prefs.sites, ...Object.fromEntries(ids.map((id) => [id, true])) } });
    });
  }

  function setSite(id: SiteId, on: boolean) {
    if (on) {
      enableSites([id]);
      return;
    }
    void permissions?.revoke([id]);
    void setPrefs({ sites: { ...prefs.sites, [id]: false } });
  }

  return (
    <div className="tn-screen">
      <Group title="Browsing prompts">
        {anySite ? null : (
          <div className="tn-row tn-row--notice">
            <span className="tn-row__label">Prompts are off</span>
            <button type="button" className="tn-link" onClick={() => enableSites(SITES.map((site) => site.id))}>
              Turn on
            </button>
          </div>
        )}
        {notice ? <p className="tn-row__helper tn-row--pad">{notice}</p> : null}
        {SITES.map((site) => (
          <Toggle key={site.id} label={`Prompts on ${site.label}`} checked={prefs.sites[site.id]} onChange={(on) => setSite(site.id, on)} />
        ))}
        <div className="tn-row tn-row--stack">
          <div className="tn-row__text">
            <span className="tn-row__label">Prompt after</span>
            <span className="tn-row__helper">Minutes of active browsing before a 2-minute break.</span>
          </div>
          <ChipGroup
            label="Prompt after"
            options={PROMPT_INTERVALS.map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
            value={prefs.promptAfterMinutes}
            onChange={(minutes) => void setPrefs({ promptAfterMinutes: minutes })}
          />
        </div>
        <Toggle label="Quiet mode" helper="No prompts until you turn this off" checked={prefs.quietMode} onChange={(on) => void setPrefs({ quietMode: on })} />
        {snoozed ? (
          <div className="tn-row">
            <span className="tn-row__label">Snoozed until {formatClock(snoozed)}</span>
            <button type="button" className="tn-link" onClick={() => void setPrefs({ snoozeUntil: undefined })}>
              Resume
            </button>
          </div>
        ) : (
          <div className="tn-row tn-row--stack">
            <button type="button" className="tn-row__button" aria-expanded={snoozeOpen} onClick={() => setSnoozeOpen((open) => !open)}>
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
        <Toggle label="Autoplay audio" checked={prefs.autoplayAudio} onChange={(on) => void setPrefs({ autoplayAudio: on })} />
        <div className="tn-row">
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
        <Toggle label="Sound effects" checked={prefs.soundEffects} onChange={(on) => void setPrefs({ soundEffects: on })} />
      </Group>

      <Group title="Progress">
        <Button variant="ghost" className="tn-row__danger" onClick={() => setConfirmReset(true)}>
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
