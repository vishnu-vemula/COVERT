/** Missing release destinations render as unavailable instead of dead links. */
function releaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.toString();
  } catch {
    // A malformed release URL must never become a download link.
  }
  return null;
}

export const LINKS = {
  /** In-page anchor to the download section. */
  getApp: '#get-covert',
  appStore: releaseUrl(process.env.NEXT_PUBLIC_APP_STORE_URL),
  googlePlay: releaseUrl(process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL),
  terms: releaseUrl(process.env.NEXT_PUBLIC_TERMS_URL),
  /** The repository's own remote. */
  github: 'https://github.com/vishnu-vemula/COVERT',
  privacy: '#privacy',
} as const;
