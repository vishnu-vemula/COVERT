import { File } from 'expo-file-system';

/** Size in bytes of a local file, or null when it can't be determined. */
export async function fileSize(uri: string): Promise<number | null> {
  try {
    const file = new File(uri);
    return file.exists ? file.size : null;
  } catch {
    return null;
  }
}
