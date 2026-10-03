import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { TextInput } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/auth/auth-screen';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { signUp } from '@/lib/auth';
import { authErrorMessage } from '@/lib/auth-errors';

const SignUpSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address.').pipe(z.email('Enter a valid email address.')),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(128, 'Use 128 characters or fewer.'),
});
type SignUpValues = z.infer<typeof SignUpSchema>;

export default function SignUpScreen() {
  const passwordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await signUp(email, password);
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  });

  return (
    <AuthScreen
      title="Create account"
      subtitle="Your conversions are saved to your account and visible only to you."
      footer={
        <>
          <Text variant="callout" tone="secondary">
            Already have an account?
          </Text>
          <LinkButton label="Sign in" onPress={() => router.replace('/sign-in')} />
        </>
      }>
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
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            ref={passwordRef}
            label="Password"
            secure
            hint="At least 8 characters."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
        )}
      />
      <Button label="Create account" onPress={() => void submit()} loading={isSubmitting} />
    </AuthScreen>
  );
}
