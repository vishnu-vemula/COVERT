import { useEffect } from 'react';
import { AccessibilityInfo, ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { palette, radius, space } from '@/theme/tokens';

import { Text } from './text';

/** Blocks input during a short local task (preparing photos, deleting) and says why. */
export function BusyOverlay({ visible, label }: { visible: boolean; label: string }) {
  useEffect(() => {
    if (visible) AccessibilityInfo.announceForAccessibility(label);
  }, [visible, label]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.root}>
        <View style={styles.box} accessible accessibilityLabel={label} accessibilityState={{ busy: true }}>
          <ActivityIndicator color={palette.onInk} />
          <Text variant="callout" tone="inverse">
            {label}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.scrim },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: palette.ink,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
