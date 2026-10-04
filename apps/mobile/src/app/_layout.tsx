import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { ToastHost } from '@/components/ui/toast';
import { Wordmark } from '@/components/ui/wordmark';
import { AuthProvider, useAuth } from '@/lib/auth';
import { env, envProblems } from '@/lib/env';
import { useCapture } from '@/stores/capture';
import { useDocuments } from '@/stores/documents';
import { useProcessing } from '@/stores/processing';
import { ContrastProvider } from '@/theme/contrast';
import { useReducedMotion } from '@/theme/motion';
import { palette, space } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ContrastProvider>
        <StatusBar style="dark" />
        {env ? (
          <AuthProvider>
            <RootNavigator />
            <ToastHost />
          </AuthProvider>
        ) : (
          <MissingConfiguration />
        )}
      </ContrastProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { user, initializing } = useAuth();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!initializing) void SplashScreen.hideAsync();
  }, [initializing]);

  // Nothing from one account may survive into the next session.
  useEffect(() => {
    if (user) return;
    useProcessing.getState().cancel();
    useDocuments.getState().reset();
    useCapture.getState().reset();
  }, [user]);

  if (initializing) {
    return (
      <View style={styles.loading} accessible accessibilityLabel="Loading COVERT">
        <Wordmark height={36} />
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.surface },
        animation: reducedMotion ? 'none' : 'default',
      }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="capture"
          options={{
            presentation: 'fullScreenModal',
            animation: reducedMotion ? 'none' : 'fade',
            contentStyle: { backgroundColor: palette.ink },
          }}
        />
        <Stack.Screen name="review" />
        <Stack.Screen name="processing" options={{ gestureEnabled: false }} />
        <Stack.Screen name="document/[id]" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
      </Stack.Protected>
    </Stack>
  );
}

function MissingConfiguration() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <Screen contentStyle={styles.config}>
      <Wordmark />
      <Text variant="title" accessibilityRole="header">
        COVERT isn’t configured
      </Text>
      <Text tone="secondary">
        Copy apps/mobile/.env.example to .env, fill in these values and restart the bundler:
      </Text>
      {envProblems.map((problem) => (
        <Text key={problem} variant="mono">
          {problem}
        </Text>
      ))}
    </Screen>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <Screen
      scroll={false}
      contentStyle={styles.error}
      footer={<Button label="Try again" onPress={() => void retry()} />}>
      <Text variant="title" accessibilityRole="header">
        Something went wrong
      </Text>
      <Text tone="secondary">
        COVERT hit an unexpected problem on this screen. Your saved documents are safe.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    backgroundColor: palette.surface,
  },
  config: { paddingTop: space.xl, gap: space.md },
  error: { justifyContent: 'center', gap: space.sm },
});
