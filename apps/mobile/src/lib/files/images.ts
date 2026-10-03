import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { CapturedPage } from '@/stores/capture';

import { fileSize } from './file-size';
import { assertSize } from './validate';

/** Longest side sent for OCR: sharp enough for small print, small enough to upload quickly. */
const MAX_DIMENSION = 2800;

export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface Edit {
  rotate?: number;
  crop?: CropRect;
}

/**
 * Re-encodes an image as JPEG with orientation applied, optionally rotated or
 * cropped, and scaled down when very large. Also converts formats such as HEIC
 * from the photo library into something the API accepts.
 */
export async function normalizeImage(
  source: { uri: string; width: number; height: number },
  origin: CapturedPage['source'],
  edit: Edit = {},
): Promise<CapturedPage> {
  const context = ImageManipulator.manipulate(source.uri);
  let width = source.width;
  let height = source.height;

  if (edit.crop) {
    context.crop(edit.crop);
    width = edit.crop.width;
    height = edit.crop.height;
  }
  if (edit.rotate) {
    context.rotate(edit.rotate);
    if (Math.abs(edit.rotate) % 180 === 90) [width, height] = [height, width];
  }
  const longest = Math.max(width, height);
  if (longest > MAX_DIMENSION) {
    context.resize(width >= height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION });
  }

  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.86 });
  assertSize(await fileSize(saved.uri));
  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
    mimeType: 'image/jpeg',
    source: origin,
  };
}
