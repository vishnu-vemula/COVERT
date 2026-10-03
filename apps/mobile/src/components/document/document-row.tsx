import type { DocumentListItem } from '@covert/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { fileTypeLabel, formatDate, shapeLabel } from '@/lib/format';
import { useColors } from '@/theme/contrast';
import { palette, radius, space } from '@/theme/tokens';

const TINTS = {
  'application/pdf': palette.paperClay,
  'image/jpeg': palette.paperSand,
  'image/png': palette.paperSky,
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
    <View style={[styles.row, { borderColor: colors.border }]}>
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
        {onMore ? null : <Icon name="chevronRight" color={colors.textSecondary} size={18} />}
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
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingLeft: space.sm,
    paddingRight: space.md,
    minHeight: 76,
  },
  pressed: { backgroundColor: palette.canvasDeep },
  tile: {
    width: 48,
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  type: { fontWeight: '800', letterSpacing: 0.6 },
  copy: { flex: 1, gap: 3 },
  more: { marginRight: space.xs },
});
