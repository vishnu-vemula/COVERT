import { StyleSheet, View } from 'react-native';

import { palette } from '@/theme/tokens';

import { Text } from './text';

/** The COVERT mark: a 2×2 cell grid with one signal cell, beside the wordmark. */
export function Mark({ cell = 7, inverse = false }: { cell?: number; inverse?: boolean }) {
  const gap = Math.max(2, Math.round(cell / 3.5));
  const ink = inverse ? palette.onInk : palette.ink;
  const cellStyle = { width: cell, height: cell, borderRadius: cell / 4 };
  return (
    <View style={{ width: cell * 2 + gap, gap }} accessible={false}>
      <View style={[styles.row, { gap }]}>
        <View style={[cellStyle, { backgroundColor: palette.signal }]} />
        <View style={[cellStyle, { backgroundColor: ink }]} />
      </View>
      <View style={[styles.row, { gap }]}>
        <View style={[cellStyle, { backgroundColor: ink }]} />
        <View style={[cellStyle, { backgroundColor: ink }]} />
      </View>
    </View>
  );
}

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <View
      style={styles.wordmark}
      accessible
      accessibilityRole="header"
      accessibilityLabel="COVERT">
      <Mark inverse={inverse} />
      <Text
        variant="headline"
        tone={inverse ? 'inverse' : 'primary'}
        maxFontSizeMultiplier={1.3}
        style={styles.text}>
        COVERT
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { fontSize: 18, fontWeight: '800', letterSpacing: 2.4 },
});
