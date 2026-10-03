import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { size, space } from '@/theme/tokens';

import { IconButton } from './icon-button';
import { Text } from './text';

interface TopBarProps {
  /** Small centred label, like a breadcrumb. The screen's own heading carries the title. */
  label?: string;
  onBack?: () => void;
  backLabel?: string;
  backIcon?: 'back' | 'close';
  right?: ReactNode;
  left?: ReactNode;
}

export function TopBar({ label, onBack, backLabel = 'Back', backIcon = 'back', right, left }: TopBarProps) {
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {left ?? <IconButton icon={backIcon} label={backLabel} onPress={back} />}
      </View>
      {label ? (
        <Text variant="footnote" tone="secondary" numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      ) : (
        <View style={styles.label} />
      )}
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: size.touch + space.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: { minWidth: size.iconButton, flexDirection: 'row', gap: space.xs },
  right: { justifyContent: 'flex-end' },
  label: { flex: 1, textAlign: 'center', marginHorizontal: space.xs },
});
