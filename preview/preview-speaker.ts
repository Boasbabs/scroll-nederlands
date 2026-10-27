import { createSpeaker } from '../src/audio/speech';

/** The browser's own Dutch voice, no clips: enough to exercise audio states in the harness. */
export const previewSpeaker = createSpeaker({
  synth: typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis,
  createUtterance: (text) => new SpeechSynthesisUtterance(text),
  playClip: () => Promise.reject(new Error('no clips in the preview')),
  stopClip: () => {},
  manifest: { clips: {} },
});
