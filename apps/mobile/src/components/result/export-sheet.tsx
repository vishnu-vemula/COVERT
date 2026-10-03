import type { CovertDocument } from '@covert/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useAfterDismiss } from '@/hooks/use-after-dismiss';
import { copyTable, ExportError, shareCsv } from '@/lib/export';
import { plural } from '@/lib/format';
import { useColors } from '@/theme/contrast';
import { palette, radius, size, space } from '@/theme/tokens';

interface ExportSheetProps {
  document: CovertDocument;
  initialTableId: string | undefined;
  visible: boolean;
  onClose: () => void;
}

type Action = 'share' | 'copy';

export function ExportSheet({ document, initialTableId, visible, onClose }: ExportSheetProps) {
  const colors = useColors();
  const showToast = useToast((state) => state.show);
  const [tableId, setTableId] = useState(initialTableId);
  const { schedule, onDismiss } = useAfterDismiss();
  const table = document.tables.find((item) => item.id === tableId) ?? document.tables[0];

  const run = async (action: Action) => {
    if (!table) return;
    try {
      if (action === 'copy') {
        await copyTable(table);
        showToast('Table copied');
      } else {
        await shareCsv(table, document.title);
      }
    } catch (error) {
      showToast(
        error instanceof ExportError ? error.message : 'Export didn’t work. Try again.',
        'error',
      );
    }
  };

  const choose = (action: Action) => {
    onClose();
    schedule(() => void run(action));
  };

  const actions: { action: Action; icon: IconName; title: string; detail: string }[] = [
    { action: 'share', icon: 'share', title: 'Share CSV', detail: 'Send a .csv file to another app' },
    { action: 'copy', icon: 'copy', title: 'Copy table', detail: 'Paste into a spreadsheet or note' },
  ];

  return (
    <Sheet
      visible={visible}
      title="Export"
      onClose={onClose}
      onDismiss={onDismiss}>
      {document.tables.length > 1 ? (
        <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel="Table to export">
          <Text variant="eyebrow" tone="secondary">
            Table
          </Text>
          {document.tables.map((item) => {
            const selected = item.id === table?.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTableId(item.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${item.title}, ${plural(item.rows.length, 'row')}`}
                style={[styles.choice, { borderColor: selected ? palette.ink : colors.border }]}>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.copy}>
                  <Text variant="headline" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text variant="footnote" tone="secondary">
                    {plural(item.rows.length, 'row')} · {plural(item.columns.length, 'column')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.group}>
        {actions.map((item) => (
          <Pressable
            key={item.action}
            onPress={() => choose(item.action)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.detail}`}
            style={({ pressed }) => [
              styles.option,
              { borderColor: colors.border, backgroundColor: pressed ? palette.canvasDeep : palette.surface },
            ]}>
            <View style={styles.tile}>
              <Icon name={item.icon} />
            </View>
            <View style={styles.copy}>
              <Text variant="headline">{item.title}</Text>
              <Text variant="footnote" tone="secondary">
                {item.detail}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.xs },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 60,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: palette.surface,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: palette.ink },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.ink },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tile: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.sm,
    backgroundColor: palette.paperLime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
});
