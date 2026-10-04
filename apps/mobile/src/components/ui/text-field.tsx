import { useState, type Ref } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

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
  /** Grey fill, for fields on white sheets where a white box would disappear. */
  tinted?: boolean;
  ref?: Ref<TextInput>;
}

export function TextField({
  label,
  error,
  hint,
  secure = false,
  tinted = false,
  ref,
  onFocus,
  onBlur,
  ...input
}: TextFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const fill = tinted ? palette.canvas : palette.surface;
  const borderColor = error
    ? palette.danger
    : focused
      ? palette.ink
      : colors.increased
        ? colors.border
        : fill;

  return (
    <View style={styles.field}>
      <Text variant="footnote" tone="secondary" aria-hidden>
        {label}
      </Text>
      <View style={[styles.box, { borderColor, backgroundColor: fill }]}>
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
    borderWidth: 2,
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
    // The box border already shows focus. In the web preview, a zero-width solid outline
    // replaces the browser's focus ring, whose white inner ring would cover the box border.
    ...(Platform.OS === 'web' ? { outlineStyle: 'solid', outlineWidth: 0 } : null),
  },
});
