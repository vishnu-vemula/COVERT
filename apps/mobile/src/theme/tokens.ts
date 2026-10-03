import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * COVERT design tokens. Every colour, size and duration used by the app comes
 * from here; components never introduce their own values.
 */

export const palette = {
  ink: '#111311',
  inkPressed: '#2A2D29',
  canvas: '#F6F5F0',
  canvasDeep: '#ECEBE4',
  surface: '#FFFFFF',
  border: '#DDDED8',
  borderStrong: '#B9BBB3',
  /** Secondary text. AA on canvas and surface. */
  textSecondary: '#5F625C',
  /** The brand muted grey: large text, placeholders and disabled content only. */
  muted: '#70736D',
  signal: '#B8F332',
  signalDark: '#7EA820',
  danger: '#C94B40',
  dangerWash: '#F7E4E1',
  /** Uncertain values: a quiet ochre, never alarm red. */
  review: '#8A6A1E',
  reviewWash: '#F5EDD7',
  /** Paper tints for document tiles and supporting surfaces. */
  paperLime: '#E8F4C7',
  paperSand: '#F0E6CC',
  paperClay: '#ECDAD1',
  paperSky: '#DDE4EA',
  onInk: '#F6F5F0',
  onInkMuted: '#A9ACA5',
  scrim: 'rgba(17, 19, 17, 0.45)',
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

/** Three radii plus circles. Nothing else. */
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
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

/**
 * Type scale. System fonts so Dynamic Type works everywhere; display sizes cap
 * their multiplier (see `maxScale`) so headlines stay on screen at large settings.
 */
export const type = {
  display: { fontSize: 38, lineHeight: 42, fontWeight: '700', letterSpacing: -1.1 },
  title: { fontSize: 28, lineHeight: 33, fontWeight: '700', letterSpacing: -0.6 },
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
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  mono: { fontSize: 14, lineHeight: 21, fontFamily: monoFont },
} satisfies Record<string, TextStyle>;

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
