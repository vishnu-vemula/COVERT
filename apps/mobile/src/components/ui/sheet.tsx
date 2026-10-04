import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReducedMotion } from '@/theme/motion';
import { motion, palette, radius, shadow, space } from '@/theme/tokens';

import { IconButton } from './icon-button';
import { Text } from './text';

interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** iOS: runs once the sheet has fully disappeared (needed before presenting system pickers). */
  onDismiss?: () => void;
  children: ReactNode;
}

/** Bottom sheet built on the platform modal so focus is trapped for screen readers. */
export function Sheet({ visible, title, onClose, onDismiss, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [rise] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    rise.setValue(reducedMotion ? 1 : 0);
    if (!reducedMotion) {
      Animated.timing(rise, {
        toValue: 1,
        duration: motion.slow,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, reducedMotion, rise]);

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={onDismiss}
      statusBarTranslucent
      navigationBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, space.md) + space.xs,
                transform: [{ translateY }],
              },
            ]}
            accessibilityViewIsModal>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text variant="heading" accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <IconButton icon="close" label="Close" onPress={onClose} variant="plain" />
            </View>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: palette.scrim },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.gutter,
    gap: space.md,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    ...shadow.raised,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.borderStrong,
    marginTop: space.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1 },
});
