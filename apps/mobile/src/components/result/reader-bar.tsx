import type { Table } from '@covert/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import type { Reader, ReaderMode } from '@/hooks/use-reader';
import { rateLabel, SPEECH_RATES } from '@/stores/settings';
import { palette, radius, shadow, size, space } from '@/theme/tokens';

const MODES: { value: ReaderMode; label: string; accessibilityLabel: string }[] = [
  { value: 'summary', label: 'Summary', accessibilityLabel: 'Read summary' },
  { value: 'table', label: 'Table', accessibilityLabel: 'Read table' },
];

interface ReaderBarProps {
  reader: Reader;
  table: Table | undefined;
  onClose: () => void;
}

/** Audio controls, docked above the home indicator while listening. */
export function ReaderBar({ reader, table, onClose }: ReaderBarProps) {
  const rows = table?.rows.length ?? 0;
  const status =
    reader.mode === 'summary'
      ? reader.playing
        ? 'Reading summary'
        : 'Summary'
      : rows === 0
        ? 'No rows'
        : `Row ${reader.row + 1} of ${rows}`;

  const rateIndex = SPEECH_RATES.indexOf(reader.rate);
  const shiftRate = (delta: number) => {
    const next = SPEECH_RATES[Math.min(Math.max(rateIndex + delta, 0), SPEECH_RATES.length - 1)];
    if (next !== undefined) reader.setRate(next);
  };
  const cycleRate = () => reader.setRate(SPEECH_RATES[(rateIndex + 1) % SPEECH_RATES.length] ?? 1);

  return (
    <View style={styles.bar} accessibilityLabel="Audio controls">
      <View style={styles.top}>
        <View style={styles.modes}>
          <Segmented
            options={MODES}
            value={reader.mode}
            onChange={reader.choose}
            label="What to read"
            tone="dark"
          />
        </View>
        <Pressable
          onPress={cycleRate}
          accessibilityRole="adjustable"
          accessibilityLabel="Speech speed"
          accessibilityValue={{ text: rateLabel(reader.rate) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) =>
            shiftRate(event.nativeEvent.actionName === 'increment' ? 1 : -1)
          }
          style={({ pressed }) => [styles.rate, pressed && styles.ratePressed]}>
          <Text
            variant="footnote"
            tone="inverse"
            style={styles.rateText}
            maxFontSizeMultiplier={1.4}>
            {rateLabel(reader.rate)}
          </Text>
        </Pressable>
        <IconButton icon="close" label="Close audio controls" variant="glass" onPress={onClose} />
      </View>

      <View style={styles.bottom}>
        <Text
          variant="callout"
          tone="inverseMuted"
          style={styles.status}
          numberOfLines={1}
          accessibilityLiveRegion="polite">
          {status}
        </Text>
        <View style={styles.controls}>
          <IconButton
            icon="previous"
            label="Previous row"
            variant="glass"
            disabled={rows === 0}
            onPress={reader.previous}
          />
          <IconButton
            icon={reader.playing ? 'stop' : 'play'}
            label={reader.playing ? 'Stop' : 'Play'}
            variant="signal"
            diameter={56}
            disabled={reader.mode === 'table' && rows === 0}
            onPress={reader.playing ? reader.stop : reader.play}
          />
          <IconButton
            icon="next"
            label="Next row"
            variant="glass"
            disabled={rows === 0}
            onPress={reader.next}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: palette.ink,
    borderRadius: radius.xl,
    padding: space.sm,
    gap: space.sm,
    ...shadow.raised,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  modes: { flex: 1 },
  rate: {
    minWidth: size.touch,
    minHeight: size.touch - space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: 'rgba(246,245,240,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratePressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  rateText: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: space.xs },
  status: { flex: 1, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
