import type { ReactElement, ReactNode, Ref } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { palette, space } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Pinned below the content, above the home indicator. */
  footer?: ReactNode;
  /** Pinned above the content, below the status bar. */
  header?: ReactNode;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollRef?: Ref<ScrollView>;
  background?: string;
}

export function Screen({
  children,
  scroll = true,
  footer,
  header,
  edges = ['top', 'bottom'],
  contentStyle,
  refreshControl,
  scrollRef,
  background = palette.surface,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header ? <View style={styles.header}>{header}</View> : null}
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={styles.root}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            refreshControl={refreshControl}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.root, styles.content, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: space.gutter, paddingTop: space.xs },
  content: { paddingHorizontal: space.gutter, paddingBottom: space.xl },
  footer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    gap: space.sm,
  },
});
