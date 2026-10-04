import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColors } from '@/theme/contrast';
import { palette, radius, size, space } from '@/theme/tokens';

/** The recognized text, hidden until asked for. */
export function OriginalText({ text }: { text: string }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.box, colors.increased && { borderWidth: 1, borderColor: colors.border }]}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel="Original text"
        accessibilityHint={
          open ? 'Hides the recognized text' : 'Shows the text read from the document'
        }
        aria-expanded={open}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
        <Text variant="headline" style={styles.label}>
          Original text
        </Text>
        <View style={open ? styles.flip : undefined}>
          <Icon name="chevronDown" size={18} />
        </View>
      </Pressable>
      {open ? (
        <View style={[styles.body, { borderTopColor: colors.border }]}>
          <Text variant="mono" selectable>
            {text || 'No text was recognized.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.xl,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  toggle: {
    minHeight: size.buttonLarge,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
  },
  pressed: { backgroundColor: palette.canvasDeep },
  label: { flex: 1 },
  flip: { transform: [{ rotate: '180deg' }] },
  body: { borderTopWidth: 1, padding: space.md },
});
