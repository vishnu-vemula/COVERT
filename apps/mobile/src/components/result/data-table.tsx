import { findCell, type Column, type Row, type Table } from '@covert/shared';
import { useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { fitColumns, layoutColumns, type ColumnLayout } from '@/lib/table-layout';
import { useColors } from '@/theme/contrast';
import { palette, radius, size, space } from '@/theme/tokens';

const PAGE = 100;

interface DataTableProps {
  table: Table;
  /** Row being read aloud; highlighted and kept rendered. */
  activeRow: number | null;
  onEdit: (row: Row, rowIndex: number, column: Column) => void;
  /** Reports each row's vertical offset within the table, for scrolling to it. */
  onRowLayout?: (rowIndex: number, y: number) => void;
}

/**
 * Editable table. Scrolls horizontally with the first column pinned: the first
 * cell of each row is translated by the scroll offset, so rows keep their
 * natural (wrapping) height and stay aligned.
 */
export function DataTable({ table, activeRow, onEdit, onRowLayout }: DataTableProps) {
  const colors = useColors();
  const { fontScale } = useWindowDimensions();
  const [limit, setLimit] = useState(PAGE);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [frameWidth, setFrameWidth] = useState(0);
  const natural = useMemo(() => layoutColumns(table, fontScale), [table, fontScale]);
  const columns = fitColumns(natural, frameWidth);

  const pinned = {
    transform: [
      {
        translateX: scrollX.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolateLeft: 'clamp',
        }),
      },
    ],
  };

  // Keep the row being read rendered even if it is beyond the current page.
  const visible = Math.max(
    limit,
    activeRow !== null ? Math.ceil((activeRow + 1) / PAGE) * PAGE : 0,
  );
  const rows = table.rows.slice(0, visible);

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.frame, colors.increased && { borderWidth: 1, borderColor: colors.border }]}
        onLayout={(event) =>
          setFrameWidth(Math.floor(event.nativeEvent.layout.width) - (colors.increased ? 2 : 0))
        }>
        <Animated.ScrollView
          horizontal
          bounces={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          accessibilityLabel={`${table.title} table`}>
          <View>
            <View style={styles.row}>
              {table.columns.map((column, index) => {
                const layout = columns[index];
                const cell = (
                  <View
                    key={column.id}
                    role="columnheader"
                    style={[
                      styles.headCell,
                      { width: layout?.width, borderBottomColor: palette.ink },
                      layout?.numeric && styles.alignEnd,
                    ]}>
                    <Text
                      variant="cellHead"
                      numberOfLines={2}
                      align={layout?.numeric ? 'right' : 'left'}>
                      {column.label}
                    </Text>
                  </View>
                );
                return index === 0 ? (
                  <Animated.View key={column.id} style={[styles.pinned, pinned]}>
                    {cell}
                  </Animated.View>
                ) : (
                  cell
                );
              })}
            </View>

            {rows.map((row, rowIndex) => (
              <View
                key={row.id}
                style={styles.row}
                onLayout={
                  onRowLayout
                    ? (event) => onRowLayout(rowIndex, event.nativeEvent.layout.y)
                    : undefined
                }>
                {table.columns.map((column, index) => {
                  const cell = (
                    <DataCell
                      key={column.id}
                      row={row}
                      rowIndex={rowIndex}
                      column={column}
                      layout={columns[index]}
                      active={rowIndex === activeRow}
                      divider={colors.divider}
                      onPress={() => onEdit(row, rowIndex, column)}
                    />
                  );
                  return index === 0 ? (
                    <Animated.View key={column.id} style={[styles.pinned, pinned]}>
                      {cell}
                    </Animated.View>
                  ) : (
                    cell
                  );
                })}
              </View>
            ))}
          </View>
        </Animated.ScrollView>
      </View>

      {table.rows.length > visible ? (
        <Button
          label={`Show ${Math.min(PAGE, table.rows.length - visible)} more rows`}
          variant="secondary"
          size="medium"
          onPress={() => setLimit(visible + PAGE)}
        />
      ) : null}
    </View>
  );
}

interface DataCellProps {
  row: Row;
  rowIndex: number;
  column: Column;
  layout: ColumnLayout | undefined;
  active: boolean;
  divider: string;
  onPress: () => void;
}

function DataCell({ row, rowIndex, column, layout, active, divider, onPress }: DataCellProps) {
  const cell = findCell(row, column.id);
  const value = cell?.value ?? '';
  const uncertain = cell?.uncertain ?? false;
  const spoken = `${column.label}, row ${rowIndex + 1}: ${value || 'blank'}${uncertain ? '. Uncertain' : ''}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint="Edits this value"
      style={({ pressed }) => [
        styles.cell,
        { width: layout?.width, borderBottomColor: divider },
        uncertain && styles.uncertain,
        active && styles.active,
        pressed && styles.pressed,
      ]}>
      <Text
        variant="cell"
        numberOfLines={4}
        align={layout?.numeric ? 'right' : 'left'}
        style={layout?.numeric ? styles.figures : undefined}>
        {value}
      </Text>
      {uncertain ? <View style={styles.flag} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  frame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.surface,
  },
  row: { flexDirection: 'row' },
  // Row direction lets the pinned cell stretch to the height of the tallest cell in its row.
  pinned: {
    zIndex: 1,
    flexDirection: 'row',
    borderRightWidth: 1,
    borderRightColor: palette.border,
  },
  headCell: {
    minHeight: size.tableRow,
    justifyContent: 'flex-end',
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: 10,
    backgroundColor: palette.canvasDeep,
    borderBottomWidth: 1.5,
  },
  alignEnd: { alignItems: 'flex-end' },
  cell: {
    minHeight: size.tableRow,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  figures: { fontVariant: ['tabular-nums'] },
  uncertain: { backgroundColor: palette.reviewWash },
  active: { backgroundColor: palette.green },
  pressed: { backgroundColor: palette.canvasDeep },
  flag: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: palette.review,
  },
});
