// Where the in-page card goes (docs/ux-research.md §1.11, §14): 24px from the right edge,
// its bottom 16px above the host's own bottom-right dock (20px with none); never over
// the feed or reading column, a video, an open chat, a dialog or X's Spaces dock; else
// bottom-left; else nowhere this interval. Only element boxes and states are measured;
// no page text is read.
import type { SiteId } from '../sites';

export type Box = { left: number; top: number; right: number; bottom: number };
export type Side = 'right' | 'left';
/** `bottom` is the card's offset from the viewport bottom; `maxHeight` is how tall it may grow. */
export type Placement = { side: Side; bottom: number; maxHeight: number };

export type HostLayout = {
  width: number;
  height: number;
  /** The content column: the feed, or the text of an article. */
  feed?: Box;
  /** Fixed elements near the bottom of the viewport: docks, chat windows, toasts, dialogs. */
  floating: Array<Box>;
  /** Videos on screen. */
  media?: Array<Box>;
};

export const CARD_INSET = 24;
export const CARD_WIDTH = 340;
/** The collapsed card's height before it is on the page (it is about 180px). */
export const CARD_HEIGHT = 190;
const EXPANDED_MAX = 520;
const DOCK_GAP = 16;
const NO_DOCK_BOTTOM = 20;
const TOP_GAP = 24;
/** A floating element under the card's column at most this tall, sitting on the bottom edge, is a dock (buttons, a bar). */
const DOCK_MAX_HEIGHT = 160;
const DOCK_MAX_LIFT = 60;
/** Buttons stacked above the dock with at most this gap belong to it (X's Grok above Chat). */
const STACK_GAP = 40;

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** The host's dock under the card's column: short floating elements on the bottom edge, and those stacked on them. */
function findDocks(floating: Array<Box>, left: number, right: number, height: number): Array<Box> {
  const candidates = floating.filter((box) => box.bottom - box.top <= DOCK_MAX_HEIGHT && box.left < right && left < box.right);
  const docks = candidates.filter((box) => box.bottom >= height - DOCK_MAX_LIFT);
  for (let grew = docks.length > 0; grew; ) {
    grew = false;
    const top = Math.min(...docks.map((box) => box.top));
    for (const box of candidates) {
      if (!docks.includes(box) && box.bottom <= top + 1 && box.bottom >= top - STACK_GAP) {
        docks.push(box);
        grew = true;
      }
    }
  }
  return docks;
}

export function placeCard(layout: HostLayout, cardHeight = CARD_HEIGHT): Placement | undefined {
  const width = Math.min(CARD_WIDTH, layout.width - 2 * CARD_INSET);
  for (const side of ['right', 'left'] as const) {
    const left = side === 'right' ? layout.width - CARD_INSET - width : CARD_INSET;
    const right = left + width;
    // The host's docks live in the bottom-right corner; the card stacks above them.
    const docks = side === 'right' ? findDocks(layout.floating, left, right, layout.height) : [];
    const bottom = docks.length > 0 ? Math.max(...docks.map((box) => layout.height - box.top)) + DOCK_GAP : NO_DOCK_BOTTOM;
    const maxHeight = Math.min(EXPANDED_MAX, layout.height - bottom - TOP_GAP);
    if (maxHeight < cardHeight) continue;
    // Everything the card may grow into after "Learn now" must be clear, not just the collapsed card.
    const space = { left, right, top: layout.height - bottom - maxHeight, bottom: layout.height - bottom };
    const blockers = [...(layout.feed ? [layout.feed] : []), ...(layout.media ?? []), ...layout.floating.filter((box) => !docks.includes(box))];
    if (blockers.some((box) => overlaps(space, box))) continue;
    return { side, bottom, maxHeight };
  }
  return undefined;
}

/** Pages that are a chat as a whole (messages and inboxes): the card would cover the conversation. */
const CHAT_PAGES: Partial<Record<SiteId, RegExp>> = {
  x: /^\/(messages|i\/chat)(\/|$)/,
  linkedin: /^\/messaging(\/|$)/,
  instagram: /^\/direct(\/|$)/,
  facebook: /^\/messages(\/|$)/,
  reddit: /^\/chat(\/|$)/,
};

export function isChatPage(site: SiteId, pathname: string): boolean {
  return CHAT_PAGES[site]?.test(pathname) ?? false;
}

/** Videos up to this long (seconds) are clips and short-form feeds (Shorts, Reels): they do not hold the prompt. */
const SHORT_VIDEO_MAX = 180;

/** The learner is watching: the page is in full screen (the card would not show), or a long video plays with sound. */
export function isWatching(doc: Document): boolean {
  if (doc.fullscreenElement) return true;
  for (const video of doc.querySelectorAll('video')) {
    // A length not known yet (NaN) or a live stream (Infinity) counts as long.
    if (!video.paused && !video.ended && !video.muted && video.volume > 0 && !(video.duration <= SHORT_VIDEO_MAX)) return true;
  }
  return false;
}

/**
 * The feed column on sites that have one; all visible matches of the first selector
 * that has any (Instagram's posts). Elsewhere the reading column stands in.
 */
const FEED_SELECTORS: Partial<Record<SiteId, Array<string>>> = {
  x: ['[data-testid="primaryColumn"]', 'main[role="main"]'],
  linkedin: ['main.scaffold-layout__main', 'main#main', 'main', '[role="main"]'],
  youtube: ['ytd-watch-flexy #primary'],
  reddit: ['shreddit-feed'],
  instagram: ['main article'],
  facebook: ['[role="feed"]'],
};

/** A paragraph this tall (two lines) and wide is body text, not a caption or a byline. */
const BODY_TEXT_MIN_HEIGHT = 40;
const BODY_TEXT_MIN_WIDTH = 240;
/** Body text spread wider than this share of the viewport is a page of stories, not a column. */
const COLUMN_MAX_SHARE = 2 / 3;
/** A fixed element covering this share of the viewport both ways is a dialog, a consent wall or an app's frame. */
const COVER_SHARE = 0.9;

function toBox(rect: DOMRect | Box): Box {
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

function union(a: Box, b: Box): Box {
  return { left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) };
}

function onScreen(rect: DOMRect, height: number): boolean {
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < height;
}

/**
 * The column of body text being read (a news article), from paragraph boxes alone:
 * at least two paragraphs of two lines or more, together no wider than a column.
 */
function readingColumn(doc: Document, width: number, height: number): Box | undefined {
  let column: Box | undefined;
  let count = 0;
  for (const paragraph of doc.querySelectorAll('p')) {
    const rect = paragraph.getBoundingClientRect();
    if (!onScreen(rect, height) || rect.height < BODY_TEXT_MIN_HEIGHT || rect.width < BODY_TEXT_MIN_WIDTH) continue;
    const box = { left: rect.left, right: rect.right, top: 0, bottom: height };
    column = column ? union(column, box) : box;
    count++;
  }
  if (!column || count < 2 || column.right - column.left > width * COLUMN_MAX_SHARE) return undefined;
  return column;
}

/** Videos on screen, cut to the viewport. */
function videoBoxes(doc: Document, width: number, height: number): Array<Box> {
  const boxes: Array<Box> = [];
  for (const video of doc.querySelectorAll('video')) {
    const rect = video.getBoundingClientRect();
    if (!onScreen(rect, height) || rect.right <= 0 || rect.left >= width) continue;
    boxes.push({ left: Math.max(0, rect.left), top: Math.max(0, rect.top), right: Math.min(width, rect.right), bottom: Math.min(height, rect.bottom) });
  }
  return boxes;
}

/**
 * Measures the page: its feed column (known selectors per site, else the column of
 * body text), its videos, and the fixed elements hit by probe points in both bottom
 * corners. Fixed elements that reach the top edge are the page's own frame (X's left
 * navigation) and are left out: covering the left column is the fallback the research
 * allows. So is a fixed element that holds the page's content. One that covers the
 * viewport otherwise is a dialog or a consent wall, and nothing fits beside it.
 */
export function measureHost(doc: Document, site: SiteId, ownHost?: Element): HostLayout {
  const view = doc.defaultView;
  const width = doc.documentElement.clientWidth || view?.innerWidth || 0;
  const height = doc.documentElement.clientHeight || view?.innerHeight || 0;

  let feed: Box | undefined;
  let feedElement: Element | undefined;
  for (const selector of FEED_SELECTORS[site] ?? []) {
    for (const element of doc.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect();
      if (!onScreen(rect, height)) continue;
      const box = { left: rect.left, right: rect.right, top: Math.max(0, rect.top), bottom: Math.min(height, rect.bottom) };
      feed = feed ? union(feed, box) : box;
      feedElement ??= element;
    }
    if (feed) break;
  }
  feed ??= readingColumn(doc, width, height);
  const content = [feedElement, doc.querySelector('main, [role="main"]')].filter((element) => element != null);

  const fixedCache = new Map<Element, boolean>();
  const isFixed = (element: Element) => {
    let fixed = fixedCache.get(element);
    if (fixed === undefined) {
      fixed = view?.getComputedStyle(element).position === 'fixed';
      fixedCache.set(element, fixed);
    }
    return fixed;
  };

  const found = new Map<Element, Box>();
  const xs = [30, 110, 200, 290, CARD_INSET + CARD_WIDTH - 4].flatMap((x) => [x, width - x]);
  const ys = [6, 40, 90, 150, 230, 330, 450, 560].map((y) => height - y);
  for (const x of xs) {
    for (const y of ys) {
      if (x < 0 || y < 0 || x > width || typeof doc.elementsFromPoint !== 'function') continue;
      // The topmost element at this point, ignoring our own card.
      const hit = doc.elementsFromPoint(x, y).find((element) => !ownHost || (element !== ownHost && !ownHost.contains(element)));
      let fixed: Element | undefined;
      for (let element = hit ?? null; element && element !== doc.body && element !== doc.documentElement; element = element.parentElement) {
        if (isFixed(element)) {
          fixed = element;
          break;
        }
      }
      if (!fixed || !hit) continue;
      const own = fixed.getBoundingClientRect();
      // A zero-size fixed wrapper still has visible children: use what was hit.
      let box = own.width > 0 && own.height > 0 ? union(toBox(own), toBox(hit.getBoundingClientRect())) : toBox(hit.getBoundingClientRect());
      const seen = found.get(fixed);
      if (seen) box = union(seen, box);
      found.set(fixed, box);
    }
  }
  const covers = (box: Box) => box.right - box.left >= width * COVER_SHARE && box.bottom - box.top >= height * COVER_SHARE;
  const frame = (element: Element, box: Box) => content.some((part) => element.contains(part)) || (box.top <= 0 && !covers(box));
  const floating = [...found]
    .filter(([element, box]) => box.bottom > box.top && box.right > box.left && !frame(element, box))
    .map(([, box]) => box);
  return { width, height, feed, floating, media: videoBoxes(doc, width, height) };
}
