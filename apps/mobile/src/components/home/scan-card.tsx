import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Scallop } from '@/components/ui/shapes';
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
        <Scallop size={64} color={palette.signal} petals={9}>
          <Icon name="viewfinder" color={palette.ink} size={26} strokeWidth={2} />
        </Scallop>
        <View style={styles.arrow}>
          <Icon name="arrowUpRight" color={palette.onInk} size={20} />
        </View>
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
    borderRadius: radius.xl,
    padding: space.lg,
    minHeight: 184,
    justifyContent: 'space-between',
    gap: space.lg,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: space.xxs },
  title: { fontSize: 26, lineHeight: 31, letterSpacing: -0.5 },
});
