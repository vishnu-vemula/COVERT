import { LIMITS } from '@covert/shared';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

import type { CapturedPage, PickedPdf } from '@/stores/capture';

import { fileSize } from './file-size';
import { normalizeImage } from './images';
import { assertSize, resolveMimeType } from './validate';

export type PickResult =
  | { kind: 'pages'; pages: CapturedPage[] }
  | { kind: 'pdf'; pdf: PickedPdf }
  | { kind: 'cancelled' };

/** Photos: one or more images, each normalized for upload. */
export async function pickPhotos(): Promise<PickResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: LIMITS.maxImagePages,
    quality: 1,
    exif: false,
  });
  if (result.canceled || result.assets.length === 0) return { kind: 'cancelled' };
  const pages: CapturedPage[] = [];
  for (const asset of result.assets.slice(0, LIMITS.maxImagePages)) {
    pages.push(await normalizeImage(asset, 'library'));
  }
  return { kind: 'pages', pages };
}

/** Files: a single JPG, PNG or PDF. */
export async function pickFile(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return { kind: 'cancelled' };

  const mimeType = resolveMimeType(asset.mimeType, asset.name);
  const size = asset.size ?? (await fileSize(asset.uri));
  assertSize(size);

  if (mimeType === 'application/pdf') {
    return { kind: 'pdf', pdf: { uri: asset.uri, name: asset.name, size: size ?? 0 } };
  }
  const dimensions = await imageSize(asset.uri);
  return { kind: 'pages', pages: [await normalizeImage({ uri: asset.uri, ...dimensions }, 'files')] };
}

function imageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject),
  );
}
