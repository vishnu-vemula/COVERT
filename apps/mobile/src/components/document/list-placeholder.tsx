import { StyleSheet, View } from 'react-native';

import { palette, radius, space } from '@/theme/tokens';

/** Static stand-ins for document rows while a list loads; no shimmer to distract. */
export function ListPlaceholder({ rows, label }: { rows: number; label: string }) {
  return (
    <View style={styles.list} accessible accessibilityLabel={label}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.row} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.xs },
  row: { height: 72, borderRadius: radius.lg, backgroundColor: palette.glass },
});
