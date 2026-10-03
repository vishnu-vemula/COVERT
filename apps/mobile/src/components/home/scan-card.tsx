import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/theme/motion';
import { motion, palette, radius, space } from '@/theme/tokens';

/** The primary action on Home. */
export function ScanCard({ onPress }: { onPress: () => void }) {
  const reducedMotion = useReducedMotion();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Scan document"
      accessibilityHint="Opens the camera to photograph one or more pages"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? palette.inkPressed : palette.ink,
          transform: pressed && !reducedMotion ? [{ scale: motion.pressScale }] : undefined,
        },
      ]}>
      <View style={styles.top}>
        <View style={styles.badge}>
          <Icon name="viewfinder" color={palette.ink} size={26} strokeWidth={2} />
        </View>
        <Icon name="arrowUpRight" color={palette.onInkMuted} size={22} />
      </View>
      <View style={styles.copy}>
        <Text variant="heading" tone="inverse" style={styles.title}>
          Scan document
        </Text>
        <Text variant="callout" tone="inverseMuted">
          Photograph one or more pages
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: space.lg,
    minHeight: 176,
    justifyContent: 'space-between',
    gap: space.lg,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: palette.signal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: space.xxs },
  title: { fontSize: 24, lineHeight: 29 },
});
