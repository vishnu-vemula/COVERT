import type { DocumentStats } from '@covert/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { plural } from '@/lib/format';
import { palette, radius, size, space } from '@/theme/tokens';

interface StatStripProps {
  stats: DocumentStats;
  onReview: () => void;
}

/** The document's shape at a glance, and the way into uncertain values. */
export function StatStrip({ stats, onReview }: StatStripProps) {
  const items = [
    { label: 'Tables', value: stats.tableCount },
    { label: 'Rows', value: stats.rowCount },
    { label: 'Columns', value: stats.columnCount },
  ];
  return (
    <View style={styles.card}>
      <View
        style={styles.stats}
        accessible
        accessibilityLabel={`${plural(stats.tableCount, 'table')}, ${plural(stats.rowCount, 'row')}, ${plural(stats.columnCount, 'column')}`}>
        {items.map((item, index) => (
          <View key={item.label} style={[styles.stat, index > 0 && styles.divided]}>
            <Text variant="eyebrow" tone="secondary">
              {item.label}
            </Text>
            <Text variant="numeral">{item.value.toLocaleString()}</Text>
          </View>
        ))}
      </View>
      {stats.uncertainCount > 0 ? (
        <Pressable
          onPress={onReview}
          accessibilityRole="button"
          accessibilityLabel={`Review uncertain values. ${plural(stats.uncertainCount, 'value')} to check.`}
          style={({ pressed }) => [styles.review, pressed && styles.reviewPressed]}>
          <View style={styles.dot} />
          <Text variant="callout" style={styles.reviewText}>
            Review uncertain values
          </Text>
          <Text variant="footnote" tone="secondary">
            {stats.uncertainCount}
          </Text>
          <Icon name="chevronRight" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.paperLime,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, gap: space.xxs, paddingHorizontal: space.xs },
  divided: { borderLeftWidth: 1, borderLeftColor: 'rgba(17,19,17,0.12)' },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.touch,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
  },
  reviewPressed: { backgroundColor: palette.canvasDeep },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.review },
  reviewText: { flex: 1, fontWeight: '600' },
});
