import type { DocumentListItem } from '@covert/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { fileTypeLabel, formatDate, shapeLabel } from '@/lib/format';
import { useColors } from '@/theme/contrast';
import { palette, radius, space } from '@/theme/tokens';

/** File types get their own tile colour; the label inside keeps it from relying on colour. */
const TINTS = {
  'application/pdf': palette.signal,
  'image/jpeg': palette.blue,
  'image/png': palette.green,
} as const;

interface DocumentRowProps {
  item: DocumentListItem;
  onPress: () => void;
  /** Shows a secondary actions button instead of the chevron. */
  onMore?: () => void;
}

export function DocumentRow({ item, onPress, onMore }: DocumentRowProps) {
  const colors = useColors();
  const date = formatDate(item.createdAt);
  const shape = shapeLabel(item.stats);
  const type = fileTypeLabel(item.fileType);

  return (
    <View style={[styles.row, colors.increased && { borderWidth: 1, borderColor: colors.border }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${date}. ${shape}. ${type}.`}
        accessibilityHint="Opens the table"
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <View style={[styles.tile, { backgroundColor: TINTS[item.fileType] }]}>
          <Text variant="footnote" style={styles.type} maxFontSizeMultiplier={1.2}>
            {type}
          </Text>
        </View>
        <View style={styles.copy}>
          <Text variant="headline" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="footnote" tone="secondary">
            {date} · {shape}
          </Text>
        </View>
        {onMore ? null : (
          <View style={styles.chevron}>
            <Icon name="chevronRight" size={16} strokeWidth={2.2} />
          </View>
        )}
      </Pressable>
      {onMore ? (
        <IconButton
          icon="more"
          label={`More actions for ${item.title}`}
          variant="plain"
          onPress={onMore}
          style={styles.more}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
    paddingLeft: space.xs,
    paddingRight: space.sm,
    minHeight: 72,
  },
  pressed: { backgroundColor: palette.canvas },
  tile: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  type: { fontWeight: '800', letterSpacing: 0.6 },
  copy: { flex: 1, gap: 2 },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  more: { marginRight: space.xs },
});
