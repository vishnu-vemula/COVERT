import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Scallop } from '@/components/ui/shapes';
import { Text } from '@/components/ui/text';
import { TopBar } from '@/components/ui/top-bar';
import { Mark } from '@/components/ui/wordmark';
import { palette, radius, scene, space } from '@/theme/tokens';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for the sign-in, sign-up and reset screens: blue screen, white form card. */
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <Screen background={scene.auth} header={<TopBar />} contentStyle={styles.content}>
      <View style={styles.heading}>
        <Scallop size={72} color={palette.greenDeep} petals={9}>
          <Mark size={30} />
        </Scallop>
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
  content: { paddingTop: space.md, gap: space.lg },
  heading: { gap: space.sm },
  form: {
    gap: space.md,
    backgroundColor: palette.glass,
    borderRadius: radius.xl,
    padding: space.md,
  },
  footer: { alignItems: 'center', gap: space.xxs },
});
