import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Scallop } from '@/components/ui/shapes';
import { Text } from '@/components/ui/text';
import { palette, radius } from '@/theme/tokens';

/**
 * Welcome illustration: the kinds of documents COVERT reads, as tilted shapes,
 * and the arrow towards a table. Decorative, so hidden from screen readers.
 */
export function ShapeCluster() {
  return (
    <View style={styles.stage} aria-hidden>
      <Scallop size={150} color={palette.greenDeep} petals={10} style={styles.receipt}>
        <View style={styles.receiptLabel}>
          <Text variant="headline" style={styles.label}>
            Receipt
          </Text>
          <Text variant="footnote" style={styles.figures}>
            ₹219.00
          </Text>
        </View>
      </Scallop>

      <View style={styles.invoice}>
        <Text variant="heading" style={styles.label}>
          Invoice
        </Text>
        <Text variant="footnote" style={styles.figures}>
          INV-0193
        </Text>
        <View style={styles.lines}>
          {[78, 52, 66].map((width) => (
            <View key={width} style={[styles.line, { width: `${width}%` }]} />
          ))}
        </View>
      </View>

      <View style={styles.statement}>
        <View style={styles.statementLabel}>
          <Text variant="heading" style={styles.label}>
            Statement
          </Text>
          <Text variant="footnote" style={styles.figures}>
            01–31 Aug
          </Text>
        </View>
      </View>

      <View style={styles.arrow}>
        <Icon name="arrowUpRight" color={palette.signal} size={26} strokeWidth={2.2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 300, marginHorizontal: -8 },
  label: { color: palette.ink },
  figures: { color: palette.ink, opacity: 0.7, fontVariant: ['tabular-nums'] },
  receipt: { position: 'absolute', left: '2%', top: 4, transform: [{ rotate: '-24deg' }] },
  receiptLabel: { alignItems: 'center' },
  invoice: {
    position: 'absolute',
    right: '4%',
    top: 20,
    width: 168,
    height: 168,
    borderRadius: radius.xl,
    backgroundColor: palette.blue,
    padding: 20,
    gap: 2,
    transform: [{ rotate: '12deg' }],
  },
  lines: { marginTop: 14, gap: 8 },
  line: { height: 6, borderRadius: 3, backgroundColor: palette.ink, opacity: 0.12 },
  statement: {
    position: 'absolute',
    left: '16%',
    bottom: 0,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: palette.blueDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statementLabel: { alignItems: 'center', transform: [{ rotate: '-18deg' }] },
  arrow: {
    position: 'absolute',
    right: '12%',
    bottom: 22,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
