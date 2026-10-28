import { isChatPage, isWatching, measureHost, placeCard, type Box, type HostLayout } from '../../src/extension/placement';
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

  it('never covers a video', () => {
    const video = box(W - 500, H - 400, W - 40, H - 120);
    expect(placeCard(layout({ media: [video] }))?.side).toBe('left');
    expect(placeCard(layout({ media: [video, box(40, H - 400, 500, H - 120)] }))).toBeUndefined();
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
    expect(isChatPage('instagram', '/direct/inbox/')).toBe(true);
    expect(isChatPage('facebook', '/messages/t/123')).toBe(true);
    expect(isChatPage('reddit', '/chat/room/abc')).toBe(true);
    expect(isChatPage('facebook', '/marketplace/')).toBe(false);
    expect(isChatPage('youtube', '/watch')).toBe(false);
  });

  it('knows which site a page belongs to', () => {
    expect(siteForHost('x.com')).toBe('x');
    expect(siteForHost('twitter.com')).toBe('x');
    expect(siteForHost('www.linkedin.com')).toBe('linkedin');
    expect(siteForHost('example.com')).toBeUndefined();
    expect(siteForHost('www.youtube.com')).toBe('youtube');
    expect(siteForHost('old.reddit.com')).toBe('reddit');
    expect(siteForHost('www.bbc.co.uk')).toBe('bbc');
    expect(siteForHost('nos.nl')).toBe('nos');
    expect(siteForHost('news.ycombinator.com')).toBe('hackernews');
    // Only the hosts the learner granted: a mobile site is not one of them.
    expect(siteForHost('m.youtube.com')).toBeUndefined();
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

  /** A page of `html` whose elements (by id) have these boxes; probes hit the `stack` ids, topmost first. */
  function page(html: string, boxes: Record<string, Box>, stack: Array<string> = []) {
    document.body.innerHTML = html;
    for (const [id, b] of Object.entries(boxes)) document.getElementById(id)!.getBoundingClientRect = () => rect(b);
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: W });
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: H });
    const inside = (b: Box, x: number, y: number) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    document.elementsFromPoint = (x, y) => stack.map((id) => document.getElementById(id)!).filter((element) => inside(boxes[element.id]!, x, y));
  }

  it('keeps the reading column of an article clear, and leaves a page of stories alone', () => {
    // Two paragraphs of body text in a 640px column; a one-line caption does not count.
    page('<main><p id="p1"></p><p id="p2"></p><p id="caption"></p></main>', {
      p1: box(400, 100, 1040, 220),
      p2: box(400, 240, 1040, 400),
      caption: box(400, 420, 1300, 440),
    });
    const article = measureHost(document, 'nos');
    expect(article.feed).toEqual(box(400, 0, 1040, H));
    expect(placeCard(article)).toEqual({ side: 'right', bottom: 20, maxHeight: 520 });

    // A front page: summaries spread over the whole width are not a column, so the card may take the corner.
    page('<main><p id="a"></p><p id="b"></p><p id="c"></p></main>', {
      a: box(40, 200, 460, 260),
      b: box(500, 200, 920, 260),
      c: box(960, 200, 1400, 260),
    });
    expect(measureHost(document, 'bbc').feed).toBeUndefined();
  });

  it('takes the column of the posts on screen as the feed', () => {
    page('<main><article id="post1"></article><article id="post2"></article><article id="gone"></article></main>', {
      post1: box(485, 60, 955, 700),
      post2: box(485, 720, 955, 1400),
      gone: box(485, -900, 955, -40),
    });
    expect(measureHost(document, 'instagram').feed).toEqual(box(485, 60, 955, H));
  });

  it('keeps videos clear, and waits behind a dialog or a consent wall', () => {
    const video = box(1000, 500, 1400, 725);
    page('<main id="main"></main><video id="video"></video>', { main: box(0, 60, W, 3000), video });
    const open = measureHost(document, 'guardian');
    expect(open.media).toEqual([video]);
    expect(placeCard(open)?.side).toBe('left');

    page(
      '<main id="main"></main><div id="wall" style="position: fixed"><button id="reject"></button></div>',
      { main: box(0, 60, W, 3000), wall: box(0, 0, W, H), reject: box(600, 700, 840, 748) },
      ['reject', 'wall'],
    );
    const walled = measureHost(document, 'guardian');
    expect(walled.floating).toEqual([box(0, 0, W, H)]);
    expect(placeCard(walled)).toBeUndefined();
  });

  it('leaves out a fixed frame that holds the page itself', () => {
    // Some sites scroll inside a fixed frame the size of the window: that frame is the page, not a dialog.
    page(
      '<div id="app" style="position: fixed"><main id="main"><span id="text"></span></main></div>',
      { app: box(0, 0, W, H), main: box(0, 0, W, H), text: box(1000, 700, 1400, 800) },
      ['text', 'main', 'app'],
    );
    expect(measureHost(document, 'facebook').floating).toEqual([]);
  });
});

describe('watching', () => {
  function video(state: Partial<Record<'paused' | 'muted' | 'duration', unknown>>) {
    const element = document.createElement('video');
    for (const [key, value] of Object.entries(state)) Object.defineProperty(element, key, { configurable: true, value });
    document.body.append(element);
  }

  afterEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null });
  });

  it('holds the prompt for a long video with sound or a page in full screen', () => {
    expect(isWatching(document)).toBe(false);
    // A Short, a muted autoplay and a paused video do not hold it.
    video({ paused: false, duration: 60 });
    video({ paused: false, duration: 600, muted: true });
    video({ paused: true, duration: 600 });
    expect(isWatching(document)).toBe(false);
    video({ paused: false, duration: 600 });
    expect(isWatching(document)).toBe(true);

    document.body.innerHTML = '';
    video({ paused: false, duration: Infinity });
    expect(isWatching(document)).toBe(true);

    document.body.innerHTML = '';
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.body });
    expect(isWatching(document)).toBe(true);
  });
});
