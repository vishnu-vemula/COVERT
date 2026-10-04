import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * COVERT design tokens. Every colour, size and duration used by the app comes
 * from here; components never introduce their own values.
 *
 * Screens sit on white or on one of two soft backgrounds — blue or green — with
 * white cards, ink buttons and the signal green as the interaction accent.
 */

export const palette = {
  ink: '#111311',
  inkPressed: '#2A2D29',
  /** Neutral fill for controls and wells that sit on white. */
  canvas: '#F2F4F3',
  canvasDeep: '#E5E8E6',
  surface: '#FFFFFF',
  /** White cards and controls laid over a coloured screen. */
  glass: 'rgba(255, 255, 255, 0.62)',
  glassPressed: 'rgba(255, 255, 255, 0.85)',
  border: '#DDDED8',
  borderStrong: '#B9BBB3',
  /** Secondary text. AA on every screen colour and on white. */
  textSecondary: '#4F534C',
  /** Placeholders and disabled content only. */
  muted: '#70736D',

  /** Screen backgrounds. */
  blue: '#CFDDF5',
  green: '#D3E5C5',
  /** Deeper tints for cards and badges that sit on the screen colours. */
  blueDeep: '#B6CBF1',
  blueSoft: '#E4ECFA',
  greenDeep: '#BCD0A5',
  greenSoft: '#E6F0DD',

  signal: '#B8F332',
  signalDark: '#7EA820',
  danger: '#C94B40',
  dangerWash: '#F7E4E1',
  /** Uncertain values: a quiet violet, never alarm red. */
  review: '#5B4596',
  reviewWash: '#ECE7F7',
  onInk: '#F6F5F0',
  onInkMuted: '#A9ACA5',
  scrim: 'rgba(17, 19, 17, 0.45)',
} as const;

/** The background each kind of screen uses. */
export const scene = {
  welcome: palette.surface,
  home: palette.surface,
  auth: palette.blue,
  review: palette.blue,
  history: palette.blue,
  processing: palette.green,
  result: palette.green,
  settings: palette.green,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  /** Horizontal page gutter. */
  gutter: 20,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  round: 999,
} as const;

export const size = {
  /** Minimum touch target on both platforms. */
  touch: 48,
  iconButton: 44,
  buttonLarge: 56,
  buttonMedium: 48,
  icon: 22,
  iconSmall: 18,
  tableRow: 52,
} as const;

const systemFont = Platform.select({ ios: 'System', default: undefined });
const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

/**
 * Type scale. System fonts so Dynamic Type works everywhere; display sizes cap
 * their multiplier (see `maxScale`) so headlines stay on screen at large settings.
 */
export const type = {
  display: { fontSize: 40, lineHeight: 43, fontWeight: '700', letterSpacing: -1.3 },
  title: { fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8 },
  heading: { fontSize: 21, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.1 },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  cell: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  cellHead: { fontSize: 14, lineHeight: 19, fontWeight: '700', letterSpacing: 0.1 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0.1 },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  numeral: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  mono: { fontSize: 14, lineHeight: 21, fontFamily: monoFont },
} satisfies Record<string, TextStyle>;

/** Serif italic for one or two words inside a headline, as an editorial accent. */
export const accent: TextStyle = {
  fontFamily: serifFont,
  fontStyle: 'italic',
  fontWeight: '400',
  letterSpacing: -0.6,
};

export type TypeVariant = keyof typeof type;

export const maxScale: Partial<Record<TypeVariant, number>> = {
  display: 1.4,
  title: 1.5,
  numeral: 1.4,
  eyebrow: 1.6,
};

export const fontFamily = systemFont;

export const shadow = {
  /** Floating elements only: sheets, the reader bar, the shutter. */
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.ink,
      shadowOpacity: 0.14,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    default: { elevation: 6 },
  }),
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  /** Scale applied to pressed buttons when motion is allowed. */
  pressScale: 0.98,
} as const;
