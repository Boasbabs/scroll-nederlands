import { createClipPlayer, type AudioLike } from '../../src/extension/clip-player';
import type { ExtensionMessage } from '../../src/extension/messages';
import { createOffscreenRelay } from '../../src/extension/offscreen';

function fakeAudio(fail = false) {
  const listeners = new Map<string, () => void>();
  const audio: AudioLike & { paused: boolean; emit: (type: 'ended' | 'error') => void } = {
    src: '',
    playbackRate: 1,
    defaultPlaybackRate: 1,
    preservesPitch: false,
    paused: true,
    play: async () => {
      if (fail) throw new Error('NotAllowedError');
      audio.paused = false;
    },
    pause: () => {
      audio.paused = true;
    },
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type) => listeners.delete(type),
    emit: (type) => listeners.get(type)?.(),
  };
  return audio;
}

describe('clip player', () => {
  it('plays the clip from the extension at the asked rate, keeping its pitch, and resolves when it ends', async () => {
    const audio = fakeAudio();
    const player = createClipPlayer((path) => `chrome-extension://id/${path}`, () => audio);
    let done = false;
    const playing = player.play('audio/abc.mp3', 0.7).then(() => (done = true));
    await Promise.resolve();
    expect(audio).toMatchObject({ src: 'chrome-extension://id/audio/abc.mp3', playbackRate: 0.7, defaultPlaybackRate: 0.7, preservesPitch: true });
    expect(done).toBe(false);
    audio.emit('ended');
    await playing;
    expect(done).toBe(true);
  });

  it('stops the clip that is playing when another starts or on stop()', async () => {
    const first = fakeAudio();
    const second = fakeAudio();
    const queue = [first, second];
    const player = createClipPlayer((path) => path, () => queue.shift()!);
    const one = player.play('audio/a.mp3', 1);
    const two = player.play('audio/b.mp3', 1);
    await one;
    expect(first.paused).toBe(true);
    player.stop();
    await two;
    expect(second.paused).toBe(true);
  });

  it('rejects when the clip cannot play, so the speaker can fall back to synthesis', async () => {
    const player = createClipPlayer((path) => path, () => fakeAudio(true));
    await expect(player.play('audio/missing.mp3', 1)).rejects.toThrow('audio/missing.mp3');
  });
});

describe('offscreen relay', () => {
  it('opens one offscreen document for clips asked for at once, then forwards each clip', async () => {
    let open = false;
    let created = 0;
    const sent: Array<ExtensionMessage> = [];
    const relay = createOffscreenRelay({
      hasDocument: async () => open,
      createDocument: async () => {
        created++;
        await Promise.resolve();
        open = true;
      },
      send: async (message) => {
        sent.push(message);
        return { ok: true };
      },
    });
    const replies = await Promise.all([relay.play('audio/a.mp3', 1), relay.play('audio/b.mp3', 0.7)]);
    expect(replies).toEqual([{ ok: true }, { ok: true }]);
    expect(created).toBe(1);
    expect(sent).toEqual([
      { type: 'tn:offscreen-play', path: 'audio/a.mp3', rate: 1 },
      { type: 'tn:offscreen-play', path: 'audio/b.mp3', rate: 0.7 },
    ]);
  });

  it('retries while a new document is not listening yet, and reports failure instead of throwing', async () => {
    let attempts = 0;
    const relay = createOffscreenRelay({
      hasDocument: async () => true,
      createDocument: async () => {},
      send: async () => {
        attempts++;
        if (attempts < 3) throw new Error('Receiving end does not exist.');
        return { ok: true };
      },
      wait: async () => {},
    });
    expect(await relay.play('audio/a.mp3', 1)).toEqual({ ok: true });

    const broken = createOffscreenRelay({
      hasDocument: async () => false,
      createDocument: async () => {
        throw new Error('Only a single offscreen document may be created.');
      },
      send: async () => ({ ok: true }),
    });
    expect(await broken.play('audio/a.mp3', 1)).toEqual({ ok: false, error: 'Only a single offscreen document may be created.' });
  });
});
