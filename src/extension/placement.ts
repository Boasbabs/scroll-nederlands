// Where the in-page card goes (docs/ux-research.md §1.11): 24px from the right edge,
// its bottom 16px above the host's own bottom-right dock (20px with none); never over
// the feed column, an open chat or X's Spaces dock; else bottom-left; else nowhere this
// interval. Only element boxes are measured; no page text is read.
import type { SiteId } from '../sites';

export type Box = { left: number; top: number; right: number; bottom: number };
export type Side = 'right' | 'left';
/** `bottom` is the card's offset from the viewport bottom; `maxHeight` is how tall it may grow. */
export type Placement = { side: Side; bottom: number; maxHeight: number };

export type HostLayout = {
  width: number;
  height: number;
  /** The content column (the feed). */
  feed?: Box;
  /** Fixed elements near the bottom of the viewport: docks, chat windows, toasts. */
  floating: Array<Box>;
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
    const blockers = [...(layout.feed ? [layout.feed] : []), ...layout.floating.filter((box) => !docks.includes(box))];
    if (blockers.some((box) => overlaps(space, box))) continue;
    return { side, bottom, maxHeight };
  }
  return undefined;
}

/** Pages that are a chat as a whole (X's messages, LinkedIn's messaging): the card would cover the conversation. */
const CHAT_PAGES: Record<SiteId, RegExp> = {
  x: /^\/(messages|i\/chat)(\/|$)/,
  linkedin: /^\/messaging(\/|$)/,
};

export function isChatPage(site: SiteId, pathname: string): boolean {
  return CHAT_PAGES[site].test(pathname);
}

const FEED_SELECTORS: Record<SiteId, Array<string>> = {
  x: ['[data-testid="primaryColumn"]', 'main[role="main"]'],
  linkedin: ['main.scaffold-layout__main', 'main#main', 'main', '[role="main"]'],
};

function toBox(rect: DOMRect | Box): Box {
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

function union(a: Box, b: Box): Box {
  return { left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) };
}

/**
 * Measures the page: its feed column (known selectors per site) and the fixed
 * elements hit by probe points in both bottom corners. Fixed elements that reach
 * the top edge are the page's own frame (X's left navigation) and are left out:
 * covering the left column is the fallback the research allows.
 */
export function measureHost(doc: Document, site: SiteId, ownHost?: Element): HostLayout {
  const view = doc.defaultView;
  const width = doc.documentElement.clientWidth || view?.innerWidth || 0;
  const height = doc.documentElement.clientHeight || view?.innerHeight || 0;

  let feed: Box | undefined;
  for (const selector of FEED_SELECTORS[site]) {
    const rect = doc.querySelector(selector)?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      feed = { left: rect.left, right: rect.right, top: Math.max(0, rect.top), bottom: Math.min(height, rect.bottom) };
      break;
    }
  }

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
  const floating = [...found.values()].filter((box) => box.top > 0 && box.bottom > box.top && box.right > box.left);
  return { width, height, feed, floating };
}
