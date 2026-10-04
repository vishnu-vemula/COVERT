import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ShapeCluster } from '@/components/welcome/shape-cluster';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Accent, Text } from '@/components/ui/text';
import { Wordmark } from '@/components/ui/wordmark';
import { scene, space } from '@/theme/tokens';

export default function WelcomeScreen() {
  return (
    <Screen
      background={scene.welcome}
      contentStyle={styles.content}
      footer={
        <>
          <Button
            label="Create account"
            icon="arrowUpRight"
            iconPosition="end"
            onPress={() => router.push('/sign-up')}
          />
          <Button label="Sign in" variant="tonal" onPress={() => router.push('/sign-in')} />
        </>
      }>
      <View style={styles.top}>
        <Wordmark height={28} />
      </View>
      <ShapeCluster />
      <View style={styles.copy}>
        <Text variant="display" accessibilityRole="header">
          Documents in.{'\n'}
          <Accent>Structured</Accent>
          {'\n'}data out.
        </Text>
        <Text tone="secondary">
          Turn photos and PDFs into tables you can review, hear, edit and export.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: space.lg },
  top: { paddingTop: space.lg },
  copy: { gap: space.sm },
});
