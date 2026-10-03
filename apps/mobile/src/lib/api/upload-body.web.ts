import { UPLOAD_FIELD } from '@covert/shared';

import type { UploadFile } from './process';

/** Web (development preview): read each picked file into a Blob. */
export async function buildUploadBody(files: UploadFile[]): Promise<FormData> {
  const form = new FormData();
  for (const file of files) {
    const blob = await (await fetch(file.uri)).blob();
    form.append(UPLOAD_FIELD, blob, file.name);
  }
  return form;
}
