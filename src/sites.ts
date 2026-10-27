/** Sites where the in-page prompt may run. Access is optional and requested per site. */
export const SITES = [
  { id: 'x', label: 'X', origins: ['https://x.com/*', 'https://twitter.com/*'] },
  { id: 'linkedin', label: 'LinkedIn', origins: ['https://www.linkedin.com/*'] },
] as const;

export type SiteId = (typeof SITES)[number]['id'];

export const ALL_SITE_ORIGINS: Array<string> = SITES.flatMap((site) => [...site.origins]);
