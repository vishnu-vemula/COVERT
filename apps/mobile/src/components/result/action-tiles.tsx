import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColors } from '@/theme/contrast';
import { useReducedMotion } from '@/theme/motion';
import { motion, palette, radius, space } from '@/theme/tokens';

interface Tile {
  title: string;
  detail: string;
  cta: string;
  icon: IconName;
  hint: string;
  tone: 'blue' | 'white';
  onPress: () => void;
}

/** Read and Export as two tiles, side by side. */
export function ActionTiles({ onRead, onExport }: { onRead: () => void; onExport: () => void }) {
  const tiles: Tile[] = [
    {
      title: 'Read',
      detail: 'Hear the summary or every row',
      cta: 'Listen',
      icon: 'speaker',
      hint: 'Reads the summary aloud and opens audio controls',
      tone: 'blue',
      onPress: onRead,
    },
    {
      title: 'Export',
      detail: 'CSV, copy or share',
      cta: 'Export',
      icon: 'share',
      hint: 'Opens export options',
      tone: 'white',
      onPress: onExport,
    },
  ];
  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <ActionTile key={tile.title} tile={tile} />
      ))}
    </View>
  );
}

function ActionTile({ tile }: { tile: Tile }) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const blue = tile.tone === 'blue';
  return (
    <Pressable
      onPress={tile.onPress}
      accessibilityRole="button"
      accessibilityLabel={tile.title}
      accessibilityHint={tile.hint}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: blue ? palette.blueDeep : palette.surface,
          borderWidth: colors.increased ? 1 : 0,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: pressed && !reducedMotion ? [{ scale: motion.pressScale }] : undefined,
        },
      ]}>
      <View style={styles.top}>
        <Text variant="heading" style={styles.title}>
          {tile.title}
        </Text>
        <View style={[styles.icon, { backgroundColor: blue ? palette.surface : palette.blue }]}>
          <Icon name={tile.icon} size={20} />
        </View>
      </View>
      <Text variant="footnote" tone="secondary" style={styles.detail}>
        {tile.detail}
      </Text>
      <View style={styles.cta}>
        <Text variant="callout" style={styles.ctaText}>
          {tile.cta}
        </Text>
        <Icon name="arrowUpRight" size={18} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1,
    minHeight: 156,
    borderRadius: radius.xl,
    padding: space.md,
    gap: space.xs,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { flexShrink: 1 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: { flex: 1 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaText: { fontWeight: '700' },
});
