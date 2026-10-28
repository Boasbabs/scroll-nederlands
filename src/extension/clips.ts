// The audio the extension bundles: ElevenLabs clips (src/audio/clips.json, made
// by `pnpm audio:generate`) and human takes (src/audio/recorded.json, made by
// `pnpm audio:generate --recorded`). A text with neither uses the browser's
// Dutch voice; the globs find nothing if a file is missing.
import type { ClipManifest, RecordedManifest } from '../audio/speech';

const generated = import.meta.glob<ClipManifest>('../audio/clips.json', { eager: true, import: 'default' });
const recorded = import.meta.glob<RecordedManifest>('../audio/recorded.json', { eager: true, import: 'default' });

export const clipManifest: ClipManifest = {
  ...(Object.values(generated)[0] ?? { clips: {} }),
  recorded: Object.values(recorded)[0]?.takes ?? {},
};
