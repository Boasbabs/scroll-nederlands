// The sites for in-page prompts, in their groups (src/sites.ts): a chip per site that
// switches it on or off, and All or None for a whole group.
import { useId } from 'react';
import { SITE_GROUPS, SITES, type SiteId } from '../../sites';
import { Icon } from '../components/Icon';

export function SitePicker({
  value,
  onChange,
}: {
  value: Record<SiteId, boolean>;
  /** Called straight from the click, so a permission request can follow at once. */
  onChange: (sites: ReadonlyArray<SiteId>, on: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="tn-sites">
      {SITE_GROUPS.map((group) => {
        const sites = SITES.filter((site) => site.group === group.id);
        const allOn = sites.every((site) => value[site.id]);
        const labelId = `${id}-${group.id}`;
        return (
          <div key={group.id} className="tn-sites__group" role="group" aria-labelledby={labelId}>
            <div className="tn-sites__head">
              <span id={labelId} className="tn-sites__label">
                {group.label}
              </span>
              <button
                type="button"
                className="tn-link"
                onClick={() => onChange(sites.filter((site) => value[site.id] === allOn).map((site) => site.id), !allOn)}
              >
                {allOn ? 'None' : 'All'}
              </button>
            </div>
            <div className="tn-chips">
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  className="tn-choice-chip tn-site-chip"
                  aria-pressed={value[site.id]}
                  onClick={() => onChange([site.id], !value[site.id])}
                >
                  {/* + adds the site; ✓ shows it is on. Both are the same size, so the chips never reflow. */}
                  <Icon name={value[site.id] ? 'check' : 'plus'} size={16} />
                  {site.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
