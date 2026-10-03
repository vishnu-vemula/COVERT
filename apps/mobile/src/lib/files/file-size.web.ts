/** Web (development preview): picked files are blob or data URLs. */
export async function fileSize(uri: string): Promise<number | null> {
  try {
    return (await (await fetch(uri)).blob()).size;
  } catch {
    return null;
  }
}
