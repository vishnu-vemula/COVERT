import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { palette, radius, space } from '@/theme/tokens';

/**
 * Illustration for the welcome screen: two paper documents behind the table
 * COVERT makes from them. Decorative, so hidden from screen readers.
 */
const ROWS = [
  ['04 Sep', '41', '₹331'],
  ['05 Sep', '38', '₹307'],
  ['06 Sep', '44', '₹356'],
];

function Lines({ widths }: { widths: number[] }) {
  return (
    <View style={styles.lines}>
      {widths.map((width, index) => (
        <View key={index} style={[styles.line, { width: `${width}%` }]} />
      ))}
    </View>
  );
}

export function PaperStack() {
  return (
    <View
      style={styles.stage}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.paper, styles.receipt]}>
        <Text variant="eyebrow" style={styles.paperLabel}>
          Receipt
        </Text>
        <Lines widths={[80, 55, 70, 40, 65]} />
      </View>
      <View style={[styles.paper, styles.invoice]}>
        <Text variant="eyebrow" style={styles.paperLabel}>
          Statement
        </Text>
        <Lines widths={[90, 60, 75, 50, 85, 45]} />
      </View>

      <View style={styles.tableWrap}>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            {['Date', 'Units', 'Amount'].map((label, index) => (
              <Text
                key={label}
                variant="footnote"
                style={[styles.cell, index > 0 && styles.numeric, styles.headText]}>
                {label}
              </Text>
            ))}
          </View>
          {ROWS.map((row, rowIndex) => (
            <View
              key={row[0]}
              style={[styles.tableRow, rowIndex < ROWS.length - 1 && styles.rowRule]}>
              {row.map((value, index) => (
                <Text
                  key={index}
                  variant="footnote"
                  style={[styles.cell, index > 0 && styles.numeric]}>
                  {value}
                </Text>
              ))}
            </View>
          ))}
        </View>
        <View style={styles.chip}>
          <Text variant="footnote" style={styles.chipText}>
            3 records
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 280, justifyContent: 'flex-end', alignItems: 'center' },
  paper: {
    position: 'absolute',
    top: 0,
    width: 150,
    height: 190,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  receipt: { left: '4%', backgroundColor: palette.paperSand, transform: [{ rotate: '-9deg' }] },
  invoice: {
    right: '4%',
    top: 8,
    backgroundColor: palette.paperClay,
    transform: [{ rotate: '7deg' }],
  },
  paperLabel: { color: palette.ink, opacity: 0.7 },
  lines: { gap: 9 },
  line: { height: 6, borderRadius: 3, backgroundColor: palette.ink, opacity: 0.14 },
  tableWrap: { width: '86%', maxWidth: 320, marginBottom: space.md },
  table: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  tableHead: { backgroundColor: palette.canvasDeep },
  tableRow: { flexDirection: 'row', paddingHorizontal: space.md, paddingVertical: 10 },
  rowRule: { borderBottomWidth: 1, borderBottomColor: palette.border },
  cell: { flex: 1, fontVariant: ['tabular-nums'] },
  numeric: { textAlign: 'right' },
  headText: { fontWeight: '700' },
  chip: {
    position: 'absolute',
    right: space.sm,
    top: -14,
    backgroundColor: palette.signal,
    borderRadius: radius.sm,
    paddingHorizontal: space.xs,
    paddingVertical: 2,
  },
  chipText: { fontWeight: '700', color: palette.ink },
});
