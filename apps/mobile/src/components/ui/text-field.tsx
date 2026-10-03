import { useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useColors } from '@/theme/contrast';
import { fontFamily, palette, radius, size, space, type } from '@/theme/tokens';

import { IconButton } from './icon-button';
import { Text } from './text';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  /** Adds a show/hide control for passwords. */
  secure?: boolean;
  ref?: Ref<TextInput>;
}

export function TextField({
  label,
  error,
  hint,
  secure = false,
  ref,
  onFocus,
  onBlur,
  ...input
}: TextFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? palette.danger : focused ? palette.ink : colors.border;

  return (
    <View style={styles.field}>
      <Text variant="footnote" tone="secondary" aria-hidden>
        {label}
      </Text>
      <View style={[styles.box, { borderColor, borderWidth: focused || error ? 1.5 : 1 }]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={palette.muted}
          secureTextEntry={secure && hidden}
          style={styles.input}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...input}
        />
        {secure ? (
          <IconButton
            icon={hidden ? 'eye' : 'eyeOff'}
            label={hidden ? 'Show password' : 'Hide password'}
            variant="plain"
            diameter={40}
            onPress={() => setHidden((value) => !value)}
          />
        ) : null}
      </View>
      {error ? (
        <Text
          variant="footnote"
          tone="danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="footnote" tone="secondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  box: {
    minHeight: size.buttonLarge,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.md,
    paddingRight: space.xxs,
  },
  input: {
    flex: 1,
    minHeight: size.buttonLarge - 4,
    paddingVertical: space.sm,
    fontFamily,
    ...type.body,
    color: palette.ink,
  },
});
