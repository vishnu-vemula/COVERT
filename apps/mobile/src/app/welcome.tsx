import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PaperStack } from '@/components/welcome/paper-stack';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Wordmark } from '@/components/ui/wordmark';
import { space } from '@/theme/tokens';

export default function WelcomeScreen() {
  return (
    <Screen
      contentStyle={styles.content}
      footer={
        <>
          <Button label="Create account" onPress={() => router.push('/sign-up')} />
          <Button label="Sign in" variant="secondary" onPress={() => router.push('/sign-in')} />
        </>
      }>
      <View style={styles.top}>
        <Wordmark />
      </View>
      <PaperStack />
      <View style={styles.copy}>
        <Text variant="display" accessibilityRole="header">
          Documents in.{'\n'}Structured{'\n'}data out.
        </Text>
        <Text tone="secondary">
          Turn photos and PDFs into tables you can review, hear, edit and export.
        </Text>
        <Text variant="footnote" tone="secondary" style={styles.expansion}>
          Capture · OCR · Validate · Extract · Read · Tabulate
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: space.lg },
  top: { paddingTop: space.sm },
  copy: { gap: space.sm },
  expansion: { marginTop: space.xs, textTransform: 'uppercase', letterSpacing: 0.6 },
});
