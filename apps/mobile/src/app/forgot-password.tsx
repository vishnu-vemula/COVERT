import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/auth/auth-screen';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { sendReset } from '@/lib/auth';
import { authErrorMessage } from '@/lib/auth-errors';
import { palette, radius, space } from '@/theme/tokens';

const ResetSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter a valid email address.')),
});
type ResetValues = z.infer<typeof ResetSchema>;

export default function ForgotPasswordScreen() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(ResetSchema), defaultValues: { email: '' } });

  const submit = handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      await sendReset(email);
    } catch (error) {
      const message = authErrorMessage(error);
      // Don't reveal whether an account exists for this address.
      const code = (error as { code?: string }).code;
      if (code !== 'auth/user-not-found') {
        setFormError(message);
        return;
      }
    }
    setSentTo(email);
    AccessibilityInfo.announceForAccessibility('Reset link sent. Check your email.');
  });

  if (sentTo) {
    return (
      <AuthScreen title="Check your email">
        <View style={styles.sent}>
          <Icon name="check" color={palette.ink} />
          <Text style={styles.sentText}>
            If an account exists for {sentTo}, a link to reset your password is on its way.
          </Text>
        </View>
        <Button label="Back to sign in" onPress={() => router.replace('/sign-in')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Reset password" subtitle="Enter your email and we’ll send you a reset link.">
      <FormError message={formError} />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={() => void submit()}
          />
        )}
      />
      <Button label="Send reset link" onPress={() => void submit()} loading={isSubmitting} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sent: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.greenSoft,
  },
  sentText: { flex: 1 },
});
