import { isChatPage, measureHost, placeCard, type Box, type HostLayout } from '../../src/extension/placement';
import { siteForHost } from '../../src/sites';

const W = 1440;
const H = 900;
const box = (left: number, top: number, right: number, bottom: number): Box => ({ left, top, right, bottom });
/** X at 1440px: navigation, a 600px feed column, the right rail. */
const X_FEED = box(390, 0, 990, H);

function layout(parts: Partial<HostLayout> = {}): HostLayout {
  return { width: W, height: H, feed: X_FEED, floating: [], ...parts };
}

describe('placing the in-page card (§1.11)', () => {
  it('sits 24px from the right and 20px from the bottom when the host has no dock', () => {
    expect(placeCard(layout())).toEqual({ side: 'right', bottom: 20, maxHeight: 520 });
  });

  it('stacks 16px above the host dock in the bottom-right corner', () => {
    // X's Grok and Chat buttons: two 52px squares, 20px from the bottom.
    const grok = box(W - 76, H - 140, W - 24, H - 88);
    const chat = box(W - 76, H - 72, W - 24, H - 20);
    expect(placeCard(layout({ floating: [grok, chat] }))).toEqual({ side: 'right', bottom: 140 + 16, maxHeight: 520 });
    // LinkedIn's collapsed Messaging bar.
    expect(placeCard(layout({ feed: box(405, 76, 960, H), floating: [box(W - 312, H - 48, W - 24, H)] }))?.bottom).toBe(64);
  });

  it('caps the expanded height to the viewport minus the bottom offset and 24px', () => {
    expect(placeCard(layout({ height: 500 }))).toEqual({ side: 'right', bottom: 20, maxHeight: 500 - 20 - 24 });
    expect(placeCard(layout({ height: 1000 }))?.maxHeight).toBe(520);
  });

  it('moves to the bottom-left when the right corner would cover the feed column', () => {
    const narrowFeed = box(600, 0, 1200, H);
    expect(placeCard(layout({ feed: narrowFeed }))).toEqual({ side: 'left', bottom: 20, maxHeight: 520 });
  });

  it('moves to the bottom-left when an open chat window takes the right corner', () => {
    const openChat = box(W - 420, H - 520, W - 24, H);
    expect(placeCard(layout({ floating: [openChat] }))?.side).toBe('left');
    // A conversation window next to LinkedIn's Messaging bar blocks the right too.
    const conversation = box(W - 650, H - 400, W - 320, H);
    expect(placeCard(layout({ floating: [box(W - 312, H - 48, W - 24, H), conversation] }))?.side).toBe('left');
  });

  it('skips the interval when both corners collide', () => {
    const wideFeed = box(80, 0, W - 80, H);
    expect(placeCard(layout({ feed: wideFeed }))).toBeUndefined();
    const leftToast = box(24, H - 80, 400, H - 24);
    expect(placeCard(layout({ feed: box(600, 0, 1200, H), floating: [leftToast] }))).toBeUndefined();
  });

  it('does not fit above a tall dock in a short window', () => {
    const tallDock = box(W - 76, H - 160, W - 24, H - 20);
    expect(placeCard(layout({ height: 380, floating: [{ ...tallDock, top: 380 - 160, bottom: 380 - 20 }] }))?.side).toBe('left');
  });

  it('never prompts on pages that are a chat as a whole', () => {
    expect(isChatPage('x', '/messages/123-456')).toBe(true);
    expect(isChatPage('x', '/i/chat')).toBe(true);
    expect(isChatPage('x', '/home')).toBe(false);
    expect(isChatPage('x', '/messagesfan')).toBe(false);
    expect(isChatPage('linkedin', '/messaging/thread/2-abc/')).toBe(true);
    expect(isChatPage('linkedin', '/feed/')).toBe(false);
  });

  it('knows which site a page belongs to', () => {
    expect(siteForHost('x.com')).toBe('x');
    expect(siteForHost('twitter.com')).toBe('x');
    expect(siteForHost('www.linkedin.com')).toBe('linkedin');
    expect(siteForHost('example.com')).toBeUndefined();
  });
});

describe('measuring the host page', () => {
  function rect(b: Box): DOMRect {
    return { ...b, x: b.left, y: b.top, width: b.right - b.left, height: b.bottom - b.top, toJSON: () => b } as DOMRect;
  }

  it('finds the feed column and the fixed docks, and leaves out the page frame and our own card', () => {
    document.body.innerHTML = `
      <nav id="frame" style="position: fixed"><a id="account">me</a></nav>
      <div data-testid="primaryColumn"></div>
      <div id="dock" style="position: fixed"><button id="chat">Chat</button></div>
      <taalnudge-card id="own" style="position: fixed"></taalnudge-card>`;
    const boxes: Record<string, Box> = {
      frame: box(0, 0, 300, H),
      account: box(20, H - 70, 280, H - 10),
      dock: box(W - 76, H - 72, W - 24, H - 20),
      chat: box(W - 76, H - 72, W - 24, H - 20),
      own: box(W - 364, H - 300, W - 24, H - 100),
    };
    for (const [id, b] of Object.entries(boxes)) document.getElementById(id)!.getBoundingClientRect = () => rect(b);
    document.querySelector('[data-testid="primaryColumn"]')!.getBoundingClientRect = () => rect(box(390, -2000, 990, 5000));
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: W });
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: H });
    const inside = (b: Box, x: number, y: number) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    document.elementsFromPoint = (x, y) =>
      ['own', 'chat', 'account', 'frame'].map((id) => document.getElementById(id)!).filter((element) => inside(boxes[element.id]!, x, y));

    const measured = measureHost(document, 'x', document.getElementById('own')!);
    expect(measured.feed).toEqual(box(390, 0, 990, H));
    expect(measured.floating).toEqual([boxes.dock]);
    expect(placeCard(measured)).toEqual({ side: 'right', bottom: 72 + 16, maxHeight: 520 });
  });
});
