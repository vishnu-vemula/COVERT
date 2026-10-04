import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { palette, radius, size, space } from '@/theme/tokens';

import { Text } from './text';

interface Option<T extends string | number> {
  value: T;
  label: string;
  accessibilityLabel?: string;
}

interface SegmentedProps<T extends string | number> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** Scroll horizontally instead of sharing the width equally. */
  scrollable?: boolean;
  tone?: 'light' | 'dark';
}

/** A single-choice control; the active option is filled, not merely recoloured. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  scrollable = false,
  tone = 'light',
}: SegmentedProps<T>) {
  const dark = tone === 'dark';
  const items = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={String(option.value)}
        onPress={() => onChange(option.value)}
        accessibilityRole="radio"
        accessibilityLabel={option.accessibilityLabel ?? option.label}
        aria-checked={selected}
        style={({ pressed }) => [
          styles.item,
          !scrollable && styles.equal,
          selected && { backgroundColor: dark ? palette.signal : palette.ink },
          !selected &&
            pressed && { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : palette.glassPressed },
        ]}>
        <Text
          variant="footnote"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.4}
          style={[
            styles.label,
            {
              color: selected
                ? dark
                  ? palette.ink
                  : palette.onInk
                : dark
                  ? palette.onInk
                  : palette.ink,
            },
          ]}>
          {option.label}
        </Text>
      </Pressable>
    );
  });

  const container = [
    styles.track,
    { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : palette.glass },
  ];

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={container}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}>
        {items}
      </ScrollView>
    );
  }
  return (
    <View style={container} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {items}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.round,
    padding: space.xxs,
    gap: space.xxs,
  },
  item: {
    minHeight: size.touch - space.xs,
    minWidth: size.touch,
    paddingHorizontal: space.xs,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equal: { flex: 1 },
  label: { fontWeight: '600' },
});
