// Bundled pictures (public/images/), keyed by the Dutch they show. Built by
// scripts/fetch-images.ts from the owner's picks (src/images/picks.json).
import { normalizeAnswer } from '../engine/answers';

/** Where a bundled picture came from. CC BY needs the author and license shown (Settings → Image credits). */
export type ImageCredit = {
  /** The file in public/images/. */
  file: string;
  author: string;
  /** The page the picture came from. */
  source: string;
  /** "CC0 1.0", "Public domain", "CC BY 4.0", or "Own photo". */
  license: string;
  /** Empty for the owner's own photos. */
  licenseUrl: string;
};

/** Normalised Dutch ("de fiets") → its picture. */
export type ImageManifest = Record<string, ImageCredit>;

const found = import.meta.glob<ImageManifest>('./images.json', { eager: true, import: 'default' });

export const bundledImages: ImageManifest = Object.values(found)[0] ?? {};

/** The bundled picture for a Dutch text, matched like a typed answer ("De fiets." finds "de fiets"). */
export function imageFor(manifest: ImageManifest, dutch: string | undefined): ImageCredit | undefined {
  return dutch === undefined ? undefined : manifest[normalizeAnswer(dutch)];
}
