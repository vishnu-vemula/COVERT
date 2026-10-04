import type { CovertDocument } from '@covert/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { fileTypeLabel, plural } from '@/lib/format';
import { palette, radius, size, space } from '@/theme/tokens';

interface DocumentCardProps {
  document: CovertDocument;
  onRename: () => void;
  onReview: () => void;
}

/** The document's shape at a glance, and the way into uncertain values. */
export function DocumentCard({ document, onRename, onReview }: DocumentCardProps) {
  const { stats } = document;
  const items = [
    { label: 'Rows', value: stats.rowCount },
    { label: 'Columns', value: stats.columnCount },
    { label: 'Tables', value: stats.tableCount },
  ];
  const source = [
    fileTypeLabel(document.fileType),
    document.pageCount > 1 ? plural(document.pageCount, 'page') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.badge}>
          <Icon name="table" />
        </View>
        <View style={styles.topCopy}>
          <Text variant="headline">Extracted data</Text>
          <Text variant="footnote" tone="secondary">
            {source}
          </Text>
        </View>
        <IconButton icon="edit" label="Rename document" variant="surface" onPress={onRename} />
      </View>

      <View
        style={styles.stats}
        accessible
        accessibilityLabel={`${plural(stats.rowCount, 'row')}, ${plural(stats.columnCount, 'column')}, ${plural(stats.tableCount, 'table')}`}>
        {items.map((item, index) => (
          <View key={item.label} style={[styles.stat, index > 0 && styles.divided]}>
            <Text variant="footnote" tone="secondary">
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
          <Icon name="chevronRight" size={16} strokeWidth={2.2} />
        </Pressable>
      ) : (
        <Text variant="footnote" tone="secondary" style={styles.clear}>
          No values were flagged as uncertain.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.blue,
    borderRadius: radius.xl,
    padding: space.md,
    gap: space.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCopy: { flex: 1, gap: 2 },
  stats: { flexDirection: 'row', paddingVertical: space.xxs },
  stat: { flex: 1, gap: 2, paddingHorizontal: space.sm },
  divided: { borderLeftWidth: 1, borderLeftColor: 'rgba(17,19,17,0.14)' },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.touch,
    paddingHorizontal: space.md,
    borderRadius: radius.round,
    backgroundColor: palette.surface,
  },
  reviewPressed: { backgroundColor: palette.canvas },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.review },
  reviewText: { flex: 1, fontWeight: '600' },
  clear: { paddingHorizontal: space.sm },
});
