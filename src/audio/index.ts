import { browser } from 'wxt/browser';
import manifest from './clip-manifest.json';
import { createSpeaker } from './speech';

let current: HTMLAudioElement | undefined;

function playClip(path: string): Promise<void> {
  current?.pause();
  current = new Audio(browser.runtime.getURL(path as '/'));
  return current.play();
}

export const speaker = createSpeaker({
  synth: typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis,
  createUtterance: (text) => new SpeechSynthesisUtterance(text),
  playClip,
  clips: manifest.clips as Record<string, string>,
});

export type { SpeakResult, VoiceMatch } from './speech';
