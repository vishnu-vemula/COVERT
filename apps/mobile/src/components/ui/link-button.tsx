import { Pressable, StyleSheet } from 'react-native';

import { size, space } from '@/theme/tokens';

import { Text } from './text';

interface LinkButtonProps {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  tone?: 'primary' | 'secondary';
}

/** Text-only action with a full-size touch target and an underline, so it never relies on colour. */
export function LinkButton({
  label,
  onPress,
  accessibilityHint,
  tone = 'primary',
}: LinkButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}>
      <Text variant="callout" tone={tone} style={styles.text}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: size.touch, justifyContent: 'center', paddingHorizontal: space.xs },
  pressed: { opacity: 0.6 },
  text: { fontWeight: '600', textDecorationLine: 'underline' },
});
