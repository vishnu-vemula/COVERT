import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Scallop } from '@/components/ui/shapes';
import type { JobStage } from '@/stores/processing';
import { useReducedMotion } from '@/theme/motion';
import { palette } from '@/theme/tokens';

const ICONS: Record<JobStage, IconName> = {
  uploading: 'upload',
  reading: 'viewfinder',
  structuring: 'table',
  checking: 'check',
  ready: 'check',
};

const SIZE = 104;

/**
 * The flower badge on the processing screen. It turns slowly while the server
 * is working (unless the person prefers reduced motion) and stops on failure.
 */
export function WorkingBadge({ stage, failed }: { stage: JobStage; failed: boolean }) {
  const reducedMotion = useReducedMotion();
  const [turn] = useState(() => new Animated.Value(0));
  const spinning = !failed && !reducedMotion;

  useEffect(() => {
    if (!spinning) return;
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinning, turn]);

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.wrap} aria-hidden>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Scallop size={SIZE} color={failed ? palette.dangerWash : palette.blueDeep} petals={10} />
      </Animated.View>
      <View>
        <Icon
          name={failed ? 'alert' : ICONS[stage]}
          color={failed ? palette.danger : palette.ink}
          size={34}
          strokeWidth={2}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
});
