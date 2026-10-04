import { ImageResponse } from 'next/og';

import { LOGO_LETTERS, LOGO_VIEWBOX } from './logo-paths';
import { SITE } from './site';

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const SOCIAL_IMAGE_ALT = 'COVERT — the mobile app that turns documents into editable tables';

/** The Open Graph / Twitter card: the logo on cream, the tagline on a cobalt band. */
export function renderSocialImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0b0b0a',
        padding: 16,
        gap: 12,
      }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#efece4',
          borderRadius: 32,
          padding: '40px 44px',
        }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 24,
            color: 'rgba(17,19,17,0.6)',
          }}>
          <span>Capture · OCR · Validate · Extract · Read · Tabulate</span>
          <span>iPhone & Android app</span>
        </div>
        <svg viewBox={LOGO_VIEWBOX} width={1080} height={193} fill="#111311">
          {LOGO_LETTERS.map((letter) => (
            <path key={letter.letter} d={letter.d} fillRule="evenodd" />
          ))}
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#2d4ff0',
          borderRadius: 32,
          padding: '30px 44px',
          color: '#ffffff',
        }}>
        <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: -2 }}>{SITE.tagline}</span>
        <span
          style={{
            fontSize: 24,
            background: '#efece4',
            color: '#111311',
            borderRadius: 999,
            padding: '12px 24px',
          }}>
          Mobile app
        </span>
      </div>
    </div>,
    SOCIAL_IMAGE_SIZE,
  );
}
