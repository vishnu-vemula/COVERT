import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { palette, radius, space } from '@/theme/tokens';

/** Form-level failure, announced as soon as it appears. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Icon name="alert" color={palette.danger} size={20} />
      <Text variant="callout" style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    backgroundColor: palette.dangerWash,
    borderRadius: radius.md,
    padding: space.md,
  },
  text: { flex: 1 },
});
