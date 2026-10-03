import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { palette, radius, shadow, space } from '@/theme/tokens';

import { Icon } from './icon';
import { Text } from './text';

interface ToastState {
  message: string | null;
  tone: 'neutral' | 'error';
  id: number;
  show: (message: string, tone?: 'neutral' | 'error') => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'neutral',
  id: 0,
  show: (message, tone = 'neutral') => {
    AccessibilityInfo.announceForAccessibility(message);
    set((state) => ({ message, tone, id: state.id + 1 }));
  },
  hide: () => set({ message: null }),
}));

/** Short confirmation shown above the home indicator; also announced to screen readers. */
export function ToastHost() {
  const { message, tone, id, hide } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, tone === 'error' ? 5000 : 2800);
    return () => clearTimeout(timer);
  }, [message, tone, id, hide]);

  if (!message) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + space.lg }]}
      accessibilityLiveRegion="polite">
      <View style={styles.toast}>
        {tone === 'error' ? (
          <Icon name="alert" color={palette.danger} size={18} />
        ) : (
          <Icon name="check" color={palette.signal} size={18} strokeWidth={2.4} />
        )}
        <Text variant="callout" tone="inverse" style={styles.text}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.gutter, right: space.gutter, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: palette.ink,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    maxWidth: 520,
    ...shadow.raised,
  },
  text: { flexShrink: 1 },
});
