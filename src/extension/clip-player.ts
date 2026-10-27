// Plays bundled clips one at a time with an <audio> element: in the side panel
// directly, and in the offscreen document for the in-page card.

export type AudioLike = {
  src: string;
  playbackRate: number;
  defaultPlaybackRate: number;
  preservesPitch: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: 'ended' | 'error', listener: () => void): void;
  removeEventListener(type: 'ended' | 'error', listener: () => void): void;
};

export function createClipPlayer(resolveUrl: (path: string) => string, createAudio: () => AudioLike = () => new Audio()) {
  let current: { audio: AudioLike; finish: () => void } | undefined;

  /** Stops the clip that is playing; its play() resolves, and the speaker treats it as interrupted. */
  function stop() {
    const playing = current;
    current = undefined;
    playing?.audio.pause();
    playing?.finish();
  }

  /** Resolves when the clip has ended (or was stopped); rejects when it cannot play. */
  function play(path: string, rate: number): Promise<void> {
    stop();
    const audio = createAudio();
    audio.preservesPitch = true;
    audio.src = resolveUrl(path);
    // Loading a source resets playbackRate to the default rate, so set both.
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        if (current?.audio === audio) current = undefined;
      };
      const onEnded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Could not play ${path}`));
      };
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      current = { audio, finish: onEnded };
      audio.play().catch(onError);
    });
  }

  return { play, stop };
}

export type ClipPlayer = ReturnType<typeof createClipPlayer>;
