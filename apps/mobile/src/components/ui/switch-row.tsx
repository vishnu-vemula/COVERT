import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { palette, size, space } from '@/theme/tokens';

import { Text } from './text';

// React Native Web colours the "on" thumb separately (teal by default).
const webThumb = Platform.OS === 'web' ? { activeThumbColor: palette.surface } : {};

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** The whole row toggles; the switch is announced once, as part of the row. */
export function SwitchRow({ label, description, value, onChange }: SwitchRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      aria-checked={value}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.copy}>
        <Text variant="body">{label}</Text>
        {description ? (
          <Text variant="footnote" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: palette.ink, false: palette.border }}
        thumbColor={palette.surface}
        ios_backgroundColor={palette.border}
        {...webThumb}
        aria-hidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.buttonLarge + space.xs,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  pressed: { backgroundColor: palette.canvasDeep },
  copy: { flex: 1, gap: 2 },
});
