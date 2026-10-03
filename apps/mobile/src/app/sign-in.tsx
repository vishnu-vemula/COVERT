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
import { signIn } from '@/lib/auth';
import { authErrorMessage } from '@/lib/auth-errors';

const SignInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter a valid email address.')),
  password: z.string().min(1, 'Enter your password.'),
});
type SignInValues = z.infer<typeof SignInSchema>;

export default function SignInScreen() {
  const passwordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await signIn(email, password);
      // The protected routes take over from here.
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  });

  return (
    <AuthScreen
      title="Sign in"
      subtitle="Welcome back."
      footer={
        <>
          <Text variant="callout" tone="secondary">
            New to COVERT?
          </Text>
          <LinkButton label="Create an account" onPress={() => router.replace('/sign-up')} />
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
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
        )}
      />
      <Button label="Sign in" onPress={() => void submit()} loading={isSubmitting} />
      <LinkButton
        label="Forgot password?"
        tone="secondary"
        onPress={() => router.push('/forgot-password')}
      />
    </AuthScreen>
  );
}
