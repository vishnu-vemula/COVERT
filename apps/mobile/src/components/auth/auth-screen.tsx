import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TopBar } from '@/components/ui/top-bar';
import { space } from '@/theme/tokens';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for the sign-in, sign-up and reset screens. */
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <Screen header={<TopBar />} contentStyle={styles.content}>
      <View style={styles.heading}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text tone="secondary">{subtitle}</Text> : null}
      </View>
      <View style={styles.form}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg, gap: space.xl },
  heading: { gap: space.xs },
  form: { gap: space.md },
  footer: { alignItems: 'center', gap: space.xs },
});
