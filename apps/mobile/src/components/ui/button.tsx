import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@/theme/contrast';
import { useReducedMotion } from '@/theme/motion';
import { motion, palette, radius, size, space } from '@/theme/tokens';

import { Icon, type IconName } from './icon';
import { Text } from './text';

/**
 * `secondary` is white, for coloured screens; `tonal` is its counterpart on white cards and
 * sheets. `signal` and `onDark` are for dark surfaces such as the camera and crop views.
 */
type Variant = 'primary' | 'secondary' | 'tonal' | 'quiet' | 'danger' | 'signal' | 'onDark';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'large' | 'medium';
  icon?: IconName;
  /** Arrows read better after the label; other icons before it. */
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const fills: Record<Variant, { base: string; pressed: string; text: string }> = {
  primary: { base: palette.ink, pressed: palette.inkPressed, text: palette.onInk },
  secondary: { base: palette.surface, pressed: palette.canvasDeep, text: palette.ink },
  tonal: { base: palette.canvas, pressed: palette.canvasDeep, text: palette.ink },
  quiet: { base: 'transparent', pressed: palette.canvasDeep, text: palette.ink },
  danger: { base: palette.surface, pressed: palette.dangerWash, text: palette.danger },
  signal: { base: palette.signal, pressed: palette.signalDark, text: palette.ink },
  onDark: { base: 'transparent', pressed: 'rgba(255,255,255,0.08)', text: palette.onInk },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size: buttonSize = 'large',
  icon,
  iconPosition = 'start',
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const fill = fills[variant];
  const inactive = disabled || loading;
  const bordered =
    variant === 'danger' || variant === 'onDark' || (colors.increased && variant === 'secondary');

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      aria-disabled={inactive}
      aria-busy={loading}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: buttonSize === 'large' ? size.buttonLarge : size.buttonMedium,
          backgroundColor: pressed ? fill.pressed : fill.base,
          borderColor:
            variant === 'danger'
              ? palette.danger
              : variant === 'onDark'
                ? 'rgba(246,245,240,0.35)'
                : colors.border,
          borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: disabled ? 0.4 : 1,
          transform: pressed && !reducedMotion ? [{ scale: motion.pressScale }] : undefined,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fill.text} aria-hidden />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'start' ? (
            <Icon name={icon} color={fill.text} size={size.iconSmall} strokeWidth={2} />
          ) : null}
          <Text variant="headline" style={{ color: fill.text }} numberOfLines={2}>
            {label}
          </Text>
          {icon && iconPosition === 'end' ? (
            <Icon name={icon} color={fill.text} size={size.iconSmall} strokeWidth={2} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.round,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
});
