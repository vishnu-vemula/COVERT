import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useAfterDismiss } from '@/hooks/use-after-dismiss';
import type { PickSource } from '@/hooks/use-pick';
import { useColors } from '@/theme/contrast';
import { palette, radius, space } from '@/theme/tokens';

const OPTIONS: {
  source: PickSource;
  title: string;
  detail: string;
  icon: IconName;
  tint: string;
}[] = [
  {
    source: 'photos',
    title: 'Photos',
    detail: 'Choose up to 6 images as pages',
    icon: 'image',
    tint: palette.green,
  },
  {
    source: 'files',
    title: 'Files',
    detail: 'PDF, JPG or PNG up to 10 MB',
    icon: 'file',
    tint: palette.blue,
  },
];

interface UploadSheetProps {
  visible: boolean;
  onClose: () => void;
  onChoose: (source: PickSource) => void;
}

export function UploadSheet({ visible, onClose, onChoose }: UploadSheetProps) {
  const colors = useColors();
  const { schedule, onDismiss } = useAfterDismiss();

  const choose = (source: PickSource) => {
    onClose();
    schedule(() => onChoose(source));
  };

  return (
    <Sheet visible={visible} title="Upload a file" onClose={onClose} onDismiss={onDismiss}>
      <View style={styles.list}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.source}
            onPress={() => choose(option.source)}
            accessibilityRole="button"
            accessibilityLabel={`${option.title}. ${option.detail}`}
            style={({ pressed }) => [
              styles.option,
              {
                borderColor: colors.border,
                borderWidth: colors.increased ? 1 : 0,
                backgroundColor: pressed ? palette.canvasDeep : palette.canvas,
              },
            ]}>
            <View style={[styles.tile, { backgroundColor: option.tint }]}>
              <Icon name={option.icon} />
            </View>
            <View style={styles.copy}>
              <Text variant="headline">{option.title}</Text>
              <Text variant="footnote" tone="secondary">
                {option.detail}
              </Text>
            </View>
            <Icon name="chevronRight" color={colors.textSecondary} size={18} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.xs,
    paddingRight: space.md,
    borderRadius: radius.round,
    minHeight: 72,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
});
