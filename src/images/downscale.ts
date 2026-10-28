// Turns a pasted or chosen image into a 480×360 WebP (about 25 KB) before it
// is stored. Browser only: it draws on a canvas.
import { coverCrop, PICTURE_SIZE } from './crop';

export async function downscaleToWebp(image: Blob): Promise<Blob> {
  // Phone photos carry their rotation in EXIF; createImageBitmap applies it.
  const bitmap = await createImageBitmap(image);
  const crop = coverCrop(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = PICTURE_SIZE.width;
  canvas.height = PICTURE_SIZE.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No canvas to draw the picture on');
  context.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The picture could not be encoded'))), 'image/webp', 0.8),
  );
}
