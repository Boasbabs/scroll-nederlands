/** How the sites are grouped where the learner picks them. */
export const SITE_GROUPS = [
  { id: 'social', label: 'Social and video' },
  { id: 'news', label: 'News' },
] as const;

export type SiteGroupId = (typeof SITE_GROUPS)[number]['id'];

/** Sites where the in-page prompt may run. Access is optional and requested per site. */
export const SITES = [
  { id: 'x', label: 'X', group: 'social', origins: ['https://x.com/*', 'https://twitter.com/*'] },
  { id: 'linkedin', label: 'LinkedIn', group: 'social', origins: ['https://www.linkedin.com/*'] },
  { id: 'youtube', label: 'YouTube', group: 'social', origins: ['https://www.youtube.com/*'] },
  { id: 'reddit', label: 'Reddit', group: 'social', origins: ['https://www.reddit.com/*', 'https://old.reddit.com/*'] },
  { id: 'instagram', label: 'Instagram', group: 'social', origins: ['https://www.instagram.com/*'] },
  { id: 'facebook', label: 'Facebook', group: 'social', origins: ['https://www.facebook.com/*'] },
  { id: 'bbc', label: 'BBC', group: 'news', origins: ['https://www.bbc.com/*', 'https://www.bbc.co.uk/*'] },
  { id: 'guardian', label: 'The Guardian', group: 'news', origins: ['https://www.theguardian.com/*'] },
  { id: 'cnn', label: 'CNN', group: 'news', origins: ['https://edition.cnn.com/*', 'https://www.cnn.com/*'] },
  { id: 'nytimes', label: 'The New York Times', group: 'news', origins: ['https://www.nytimes.com/*'] },
  { id: 'nos', label: 'NOS', group: 'news', origins: ['https://nos.nl/*'] },
  { id: 'nu', label: 'NU.nl', group: 'news', origins: ['https://www.nu.nl/*'] },
  { id: 'nltimes', label: 'NL Times', group: 'news', origins: ['https://nltimes.nl/*'] },
  { id: 'dutchnews', label: 'DutchNews.nl', group: 'news', origins: ['https://www.dutchnews.nl/*'] },
  { id: 'hackernews', label: 'Hacker News', group: 'news', origins: ['https://news.ycombinator.com/*'] },
] as const satisfies ReadonlyArray<{ id: string; label: string; group: SiteGroupId; origins: ReadonlyArray<string> }>;

export type SiteId = (typeof SITES)[number]['id'];

export const SITE_IDS: ReadonlyArray<SiteId> = SITES.map((site) => site.id);

export const ALL_SITE_ORIGINS: Array<string> = SITES.flatMap((site) => [...site.origins]);

/** Every site, switched on when it is in `on`. */
export function siteRecord(on: Iterable<SiteId> = []): Record<SiteId, boolean> {
  const chosen = new Set(on);
  return Object.fromEntries(SITE_IDS.map((id) => [id, chosen.has(id)])) as Record<SiteId, boolean>;
}

/** The learner's choice of sites with `ids` switched on or off. */
export function switchSites(sites: Record<SiteId, boolean>, ids: ReadonlyArray<SiteId>, on: boolean): Record<SiteId, boolean> {
  return { ...sites, ...Object.fromEntries(ids.map((id) => [id, on])) };
}

/** The site a page belongs to, from its hostname (twitter.com counts as X). */
export function siteForHost(hostname: string): SiteId | undefined {
  return SITES.find((site) => site.origins.some((origin) => new URL(origin.replace('/*', '/')).hostname === hostname))?.id;
}

/** The match patterns for the given sites. */
export function originsFor(sites: ReadonlyArray<SiteId>): Array<string> {
  return SITES.filter((site) => sites.includes(site.id)).flatMap((site) => [...site.origins]);
}
