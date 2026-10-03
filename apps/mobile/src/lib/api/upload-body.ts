import { UPLOAD_FIELD } from '@covert/shared';

import type { UploadFile } from './process';

/** Native: React Native streams files from disk when given `{ uri, name, type }`. */
export async function buildUploadBody(files: UploadFile[]): Promise<FormData> {
  const form = new FormData();
  for (const file of files) {
    form.append(UPLOAD_FIELD, {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
  }
  return form;
}
