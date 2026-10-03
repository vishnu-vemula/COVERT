import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { JobStage } from '@/stores/processing';
import { useColors } from '@/theme/contrast';
import { useReducedMotion } from '@/theme/motion';
import { palette, space } from '@/theme/tokens';

export const STAGE_LABELS: Record<Exclude<JobStage, 'ready'>, string> = {
  uploading: 'Uploading',
  reading: 'Reading document',
  structuring: 'Structuring data',
  checking: 'Final checks',
};

const ORDER: Exclude<JobStage, 'ready'>[] = ['uploading', 'reading', 'structuring', 'checking'];

type StageState = 'done' | 'active' | 'failed' | 'pending';

interface StageListProps {
  current: JobStage;
  failed: boolean;
  /** Extra line under the active stage, e.g. real upload progress. */
  detail?: string | null;
}

export function StageList({ current, failed, detail }: StageListProps) {
  const position = current === 'ready' ? ORDER.length : ORDER.indexOf(current);
  return (
    <View style={styles.list}>
      {ORDER.map((stage, index) => {
        const state: StageState =
          index < position
            ? 'done'
            : index === position
              ? failed
                ? 'failed'
                : 'active'
              : 'pending';
        return (
          <StageRow
            key={stage}
            label={STAGE_LABELS[stage]}
            state={state}
            last={index === ORDER.length - 1}
            detail={state === 'active' ? detail : null}
          />
        );
      })}
    </View>
  );
}

const SPOKEN_STATE: Record<StageState, string> = {
  done: 'done',
  active: 'in progress',
  failed: 'failed',
  pending: 'not started',
};

function StageRow({
  label,
  state,
  last,
  detail,
}: {
  label: string;
  state: StageState;
  last: boolean;
  detail?: string | null;
}) {
  const colors = useColors();
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}, ${SPOKEN_STATE[state]}`}>
      <View style={styles.rail}>
        <Glyph state={state} />
        {!last ? (
          <View
            style={[
              styles.connector,
              { backgroundColor: state === 'done' ? palette.ink : colors.border },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text
          variant={state === 'active' || state === 'failed' ? 'headline' : 'body'}
          tone={state === 'pending' ? 'tertiary' : state === 'failed' ? 'danger' : 'primary'}>
          {label}
        </Text>
        {detail ? (
          <Text variant="footnote" tone="secondary">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Glyph({ state }: { state: StageState }) {
  const reducedMotion = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (state !== 'active' || reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, reducedMotion, pulse]);

  if (state === 'done') {
    return (
      <View style={[styles.glyph, styles.done]}>
        <Icon name="check" color={palette.signal} size={14} strokeWidth={3} />
      </View>
    );
  }
  if (state === 'failed') {
    return (
      <View style={[styles.glyph, styles.failed]}>
        <Icon name="close" color={palette.surface} size={12} strokeWidth={3} />
      </View>
    );
  }
  if (state === 'active') {
    return (
      <View style={styles.glyphWrap}>
        {!reducedMotion ? (
          <Animated.View
            style={[
              styles.halo,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) },
                ],
              },
            ]}
          />
        ) : null}
        <View style={[styles.glyph, styles.active]} />
      </View>
    );
  }
  return <View style={[styles.glyph, styles.pending]} />;
}

const GLYPH = 24;

const styles = StyleSheet.create({
  list: { gap: 0 },
  row: { flexDirection: 'row', gap: space.md, minHeight: 64 },
  rail: { width: GLYPH, alignItems: 'center' },
  connector: { flex: 1, width: 2, marginVertical: space.xxs, borderRadius: 1 },
  copy: { flex: 1, paddingTop: 1, paddingBottom: space.md, gap: 2 },
  glyphWrap: { width: GLYPH, height: GLYPH, alignItems: 'center', justifyContent: 'center' },
  glyph: {
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: { backgroundColor: palette.ink },
  failed: { backgroundColor: palette.danger },
  active: { backgroundColor: palette.signal, borderWidth: 2, borderColor: palette.ink },
  halo: {
    position: 'absolute',
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH / 2,
    backgroundColor: palette.signal,
  },
  pending: { borderWidth: 2, borderColor: palette.borderStrong },
});
