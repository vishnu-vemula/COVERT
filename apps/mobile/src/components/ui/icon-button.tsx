import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/theme/contrast';
import { palette, radius, size } from '@/theme/tokens';

import { Icon, type IconName } from './icon';

type Variant = 'surface' | 'ink' | 'signal' | 'glass' | 'plain';

interface IconButtonProps {
  icon: IconName;
  /** Required: icon-only controls must say what they do. */
  label: string;
  onPress: () => void;
  variant?: Variant;
  diameter?: number;
  disabled?: boolean;
  selected?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const variants: Record<Variant, { bg: string; pressed: string; fg: string }> = {
  surface: { bg: palette.surface, pressed: palette.canvasDeep, fg: palette.ink },
  ink: { bg: palette.ink, pressed: palette.inkPressed, fg: palette.onInk },
  signal: { bg: palette.signal, pressed: palette.signalDark, fg: palette.ink },
  glass: { bg: 'rgba(17,19,17,0.55)', pressed: 'rgba(17,19,17,0.75)', fg: palette.onInk },
  plain: { bg: 'transparent', pressed: palette.canvasDeep, fg: palette.ink },
};

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'surface',
  diameter = size.iconButton,
  disabled = false,
  selected,
  accessibilityHint,
  style,
}: IconButtonProps) {
  const colors = useColors();
  const look = variants[variant];
  const slop = Math.max(0, (size.touch - diameter) / 2);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected }}
      style={({ pressed }) => [
        styles.base,
        {
          width: diameter,
          height: diameter,
          backgroundColor: pressed ? look.pressed : look.bg,
          borderColor: colors.border,
          borderWidth: variant === 'surface' ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: disabled ? 0.35 : 1,
        },
        style,
      ]}>
      <Icon name={icon} color={look.fg} size={diameter >= 56 ? 26 : size.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
