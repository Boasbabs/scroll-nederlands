import { useEffect, useState } from 'react';
import { createEmptyProgress } from '../../engine/progress';
import type { LearnerPreferences } from '../../engine/types';
import { SITES, type SiteId } from '../../sites';
import { snoozeOptions } from '../../trigger/browsing';
import { useEnv } from '../env';

const INTERVAL_STOPS = [5, 8, 15, 30, 60];

function Switch({ checked, onChange, label }: { checked: boolean; onChange(value: boolean): void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="tn-switch" onClick={() => onChange(!checked)} />;
}

function formatTime(at: number): string {
  return new Date(at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

export function Settings({ preferences }: { preferences: LearnerPreferences }) {
  const { store, sites, now, speaker } = useEnv();
  const [siteStatus, setSiteStatus] = useState<Record<SiteId, boolean> | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const update = (patch: Partial<LearnerPreferences>) => void store.updatePreferences(patch);
  const snoozed = preferences.snoozeUntil !== null && preferences.snoozeUntil > now();
  const intervalIndex = Math.max(0, INTERVAL_STOPS.indexOf(preferences.promptAfterMinutes));

  useEffect(() => {
    void sites?.status().then(setSiteStatus);
    void speaker.describeVoice().then((v) => setVoiceName(v.hasClips ? 'Bundled recordings' : (v.voiceName ?? 'None found')));
  }, [sites, speaker]);

  async function toggleSite(site: SiteId, enable: boolean) {
    if (!sites) return;
    setSiteError(null);
    const ok = enable ? await sites.request(site) : await sites.revoke(site);
    if (enable && !ok) setSiteError('Permission was not granted. Lessons still work here in the side panel.');
    setSiteStatus(await sites.status());
  }

  return (
    <div className="tn-screen-body tn-stack tn-enter">
      <section>
        <h2 className="tn-h3">Prompts while browsing</h2>
        {SITES.map((site) => (
          <div className="tn-setting" key={site.id}>
            <span style={{ flex: 1 }}>{site.label}</span>
            <Switch
              label={`Prompts on ${site.label}`}
              checked={siteStatus?.[site.id] ?? false}
              onChange={(value) => void toggleSite(site.id, value)}
            />
          </div>
        ))}
        <p className="tn-muted" style={{ margin: '0 0 8px', fontSize: 13 }}>
          Chrome asks for access to each site. TaalNudge only notices that you are active (scrolling or typing), never what is on the page.
        </p>
        {siteError && <p className="tn-notice" role="alert">{siteError}</p>}

        <div className="tn-setting">
          <span style={{ flex: 1 }}>
            Quiet mode
            <br />
            <span className="tn-muted" style={{ fontSize: 13 }}>Pause all in-page prompts</span>
          </span>
          <Switch label="Quiet mode" checked={preferences.quietMode} onChange={(quietMode) => update({ quietMode })} />
        </div>

        <div className="tn-stack-sm" style={{ marginTop: 8 }}>
          <div className="tn-row">
            <label htmlFor="tn-interval" style={{ flex: 1 }}>Prompt after active browsing</label>
            <strong>{preferences.promptAfterMinutes} min</strong>
          </div>
          <input
            id="tn-interval"
            className="tn-range"
            type="range"
            min={0}
            max={INTERVAL_STOPS.length - 1}
            step={1}
            value={intervalIndex}
            onChange={(e) => update({ promptAfterMinutes: INTERVAL_STOPS[Number(e.target.value)]! })}
            aria-valuetext={`${preferences.promptAfterMinutes} minutes`}
          />
          <div className="tn-row tn-muted" style={{ fontSize: 12 }}>
            <span>{INTERVAL_STOPS[0]} min</span>
            <span className="tn-spacer" />
            <span>{INTERVAL_STOPS.at(-1)} min</span>
          </div>
          <p className="tn-muted" style={{ margin: 0, fontSize: 13 }}>
            8 minutes is a starting point, not a scientific optimum. At most three prompts per browsing session.
          </p>
        </div>

        <div style={{ marginTop: 12 }}>
          {snoozed ? (
            <div className="tn-setting">
              <span style={{ flex: 1 }}>Snoozed until {formatTime(preferences.snoozeUntil!)}</span>
              <button type="button" className="tn-btn tn-btn-outline" onClick={() => update({ snoozeUntil: null })}>Resume now</button>
            </div>
          ) : (
            <div className="tn-row" style={{ flexWrap: 'wrap' }}>
              {snoozeOptions(now()).map((option) => (
                <button key={option.label} type="button" className="tn-btn tn-btn-outline" onClick={() => update({ snoozeUntil: option.until })}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="tn-h3">Audio</h2>
        <div className="tn-stack-sm">
          <div className="tn-row">
            <label htmlFor="tn-rate" style={{ flex: 1 }}>Speaking speed</label>
            <strong>{Math.round(preferences.speechRate * 100)}%</strong>
          </div>
          <input
            id="tn-rate"
            className="tn-range"
            type="range"
            min={0.6}
            max={1.1}
            step={0.05}
            value={preferences.speechRate}
            onChange={(e) => update({ speechRate: Number(e.target.value) })}
          />
          <p className="tn-muted" style={{ margin: 0, fontSize: 13 }}>
            Voice: {voiceName ?? '…'}. Target pronunciation is standard Netherlands Dutch (nl-NL); device voices vary.
          </p>
        </div>
      </section>

      <section>
        <h2 className="tn-h3">Your data</h2>
        <p className="tn-muted" style={{ margin: '0 0 8px', fontSize: 13 }}>
          Progress is stored only in this browser. Nothing is sent anywhere.
        </p>
        {confirmReset ? (
          <div className="tn-row">
            <span style={{ flex: 1 }}>Delete all progress?</span>
            <button type="button" className="tn-btn tn-btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button
              type="button"
              className="tn-btn tn-btn-danger"
              onClick={() => {
                void store.updateProgress(() => createEmptyProgress());
                setConfirmReset(false);
              }}
            >
              Delete
            </button>
          </div>
        ) : (
          <button type="button" className="tn-btn tn-btn-outline" onClick={() => setConfirmReset(true)}>Reset progress</button>
        )}
      </section>
    </div>
  );
}
