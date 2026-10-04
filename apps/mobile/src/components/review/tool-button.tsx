import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColors } from '@/theme/contrast';
import { palette, radius, size, space } from '@/theme/tokens';

interface ToolButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}

/** Icon-over-label control for page tools (rotate, crop, retake, remove). */
export function ToolButton({
  icon,
  label,
  onPress,
  disabled = false,
  accessibilityHint,
}: ToolButtonProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      aria-disabled={disabled}
      style={({ pressed }) => [
        styles.tool,
        {
          borderColor: colors.border,
          borderWidth: colors.increased ? 1 : 0,
          backgroundColor: pressed ? palette.canvas : palette.surface,
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
      <Icon name={icon} size={size.icon} />
      <Text variant="footnote" numberOfLines={1} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tool: {
    flex: 1,
    minHeight: 68,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
    paddingHorizontal: space.xxs,
  },
});
