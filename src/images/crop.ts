// The one picture shape: 4:3 at 480×360. Shared by the learner's pictures
// (downscale.ts) and the bundled ones (scripts/fetch-images.ts). No imports,
// so the Node script can load it as it is.

export const PICTURE_SIZE = { width: 480, height: 360 } as const;

export type CropBox = { x: number; y: number; width: number; height: number };

/**
 * The largest 4:3 box inside a width × height image, centred on `focus`
 * (fractions of the width and height) as far as the edges allow.
 */
export function coverCrop(width: number, height: number, focus: readonly [number, number] = [0.5, 0.5]): CropBox {
  const ratio = PICTURE_SIZE.width / PICTURE_SIZE.height;
  const boxWidth = Math.min(width, Math.round(height * ratio));
  const boxHeight = Math.min(height, Math.round(boxWidth / ratio));
  const clamp = (value: number, max: number) => Math.round(Math.min(Math.max(value, 0), max));
  return {
    x: clamp(focus[0] * width - boxWidth / 2, width - boxWidth),
    y: clamp(focus[1] * height - boxHeight / 2, height - boxHeight),
    width: boxWidth,
    height: boxHeight,
  };
}
