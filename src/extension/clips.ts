// The ElevenLabs clip manifest once phase 8 has generated it. Until then the glob
// finds nothing and every line uses the browser's Dutch voice.
import type { ClipManifest } from '../audio/speech';

const found = import.meta.glob<ClipManifest>('../audio/clips.json', { eager: true, import: 'default' });

export const clipManifest: ClipManifest = Object.values(found)[0] ?? { clips: {} };
