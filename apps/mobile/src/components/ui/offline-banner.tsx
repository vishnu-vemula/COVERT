import { useNetworkState } from 'expo-network';
import { StyleSheet, View } from 'react-native';

import { palette, radius, space } from '@/theme/tokens';

import { Icon } from './icon';
import { Text } from './text';

/** Shown while the device reports no connection. */
export function OfflineBanner() {
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  if (!offline) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="offline" color={palette.onInk} size={18} />
      <Text variant="footnote" tone="inverse" style={styles.text}>
        You’re offline. Saved documents and new conversions need a connection.
      </Text>
    </View>
  );
}

export function useIsOffline(): boolean {
  const network = useNetworkState();
  return network.isConnected === false || network.isInternetReachable === false;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: palette.ink,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  text: { flex: 1 },
});
