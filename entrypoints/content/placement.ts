// Where to put the card so it never covers the feed or the host's own docks.
// Only element boxes are measured; no page text is read.

const RIGHT_DOCK_SELECTORS = [
  '#msg-overlay', // LinkedIn messaging bar
  '.msg-overlay-container',
  '[data-testid="DMDrawer"]', // X messages drawer
  '[data-testid="GrokDrawer"]',
  '[data-testid="chat-drawer-root"]',
];

export type Placement = { side: 'left' | 'right'; bottom: number };

export function computePlacement(): Placement {
  let dockHeight = 0;
  for (const selector of RIGHT_DOCK_SELECTORS) {
    for (const element of document.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect();
      const anchoredBottomRight = rect.width > 0 && rect.right > window.innerWidth - 400 && rect.bottom >= window.innerHeight - 40;
      if (anchoredBottomRight) dockHeight = Math.max(dockHeight, window.innerHeight - rect.top);
    }
  }
  // An open chat window takes the right corner: use the bottom-left slot LinkedIn uses for its own toasts.
  if (dockHeight > 140) return { side: 'left', bottom: 24 };
  return { side: 'right', bottom: Math.max(24, dockHeight + 16) };
}
