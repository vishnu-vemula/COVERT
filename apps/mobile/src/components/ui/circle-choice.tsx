import { Pressable, StyleSheet, View } from 'react-native';

import { useColors } from '@/theme/contrast';
import { palette, size, space } from '@/theme/tokens';

import { Text } from './text';

interface Option<T extends string | number> {
  value: T;
  label: string;
  accessibilityLabel?: string;
}

interface CircleChoiceProps<T extends string | number> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** A row of round options, one filled; for short values such as speeds. */
export function CircleChoice<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: CircleChoiceProps<T>) {
  const colors = useColors();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            aria-checked={selected}
            style={({ pressed }) => [
              styles.circle,
              {
                backgroundColor: selected
                  ? palette.ink
                  : pressed
                    ? palette.canvasDeep
                    : palette.canvas,
                borderWidth: colors.increased && !selected ? 1 : 0,
                borderColor: colors.border,
              },
            ]}>
            <Text
              variant="footnote"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.3}
              style={[styles.label, { color: selected ? palette.onInk : palette.ink }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xs },
  circle: {
    flex: 1,
    maxWidth: 60,
    minHeight: size.touch,
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700', paddingHorizontal: 2 },
});
