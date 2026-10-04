import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Scalloped "flower" outline: `petals` rounded bumps around a circle. Used as a
 * badge behind icons and as an illustration shape. Decorative.
 */
function scallopPath(size: number, petals: number, depth: number): string {
  const center = size / 2;
  const outer = size / 2;
  const inner = outer * (1 - depth);
  const step = (Math.PI * 2) / petals;
  const point = (radius: number, angle: number) =>
    `${(center + radius * Math.cos(angle)).toFixed(2)} ${(center + radius * Math.sin(angle)).toFixed(2)}`;
  let path = `M ${point(inner, -Math.PI / 2)}`;
  for (let i = 0; i < petals; i += 1) {
    const start = -Math.PI / 2 + i * step;
    // Two control points pushed past the outer radius give round, full petals.
    path += ` C ${point(outer * 1.08, start + step * 0.08)} ${point(outer * 1.08, start + step * 0.92)} ${point(inner, start + step)}`;
  }
  return `${path} Z`;
}

interface ScallopProps {
  size: number;
  color: string;
  petals?: number;
  depth?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Scallop({ size, color, petals = 8, depth = 0.16, children, style }: ScallopProps) {
  return (
    <View style={[{ width: size, height: size }, styles.center, style]} aria-hidden={!children}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Path d={scallopPath(size, petals, depth)} fill={color} />
      </Svg>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', justifyContent: 'center' },
});
