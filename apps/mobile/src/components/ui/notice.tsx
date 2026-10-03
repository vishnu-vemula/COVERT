import { StyleSheet, View } from 'react-native';

import { palette, radius, space } from '@/theme/tokens';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

interface NoticeProps {
  title: string;
  message?: string;
  icon?: IconName;
  tone?: 'neutral' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

/** Inline message for empty, offline and failure states. */
export function Notice({ title, message, icon, tone = 'neutral', actionLabel, onAction }: NoticeProps) {
  return (
    <View
      style={[styles.box, tone === 'error' ? styles.error : styles.neutral]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <View style={styles.row}>
        {icon ? (
          <Icon name={icon} color={tone === 'error' ? palette.danger : palette.ink} size={20} />
        ) : null}
        <View style={styles.copy}>
          <Text variant="headline">{title}</Text>
          {message ? (
            <Text variant="callout" tone="secondary">
              {message}
            </Text>
          ) : null}
        </View>
      </View>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="medium" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, padding: space.md, gap: space.md },
  neutral: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.borderStrong,
  },
  error: { backgroundColor: palette.dangerWash },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  copy: { flex: 1, gap: space.xxs },
});
