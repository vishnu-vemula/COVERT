import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useColors } from '@/theme/contrast';
import { accent, fontFamily, maxScale, palette, type, type TypeVariant } from '@/theme/tokens';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'inverseMuted' | 'danger' | 'review';

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', tone = 'primary', align, style, ...rest }: TextProps) {
  const colors = useColors();
  const color: Record<Tone, string> = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    inverse: palette.onInk,
    inverseMuted: palette.onInkMuted,
    danger: palette.danger,
    review: palette.review,
  };
  return (
    <RNText
      maxFontSizeMultiplier={maxScale[variant]}
      style={[
        { fontFamily },
        type[variant],
        { color: color[tone] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}

/** One or two words of a headline set in serif italic. Nest inside a Text. */
export function Accent({ children }: { children: string }) {
  return <RNText style={accent}>{children}</RNText>;
}
