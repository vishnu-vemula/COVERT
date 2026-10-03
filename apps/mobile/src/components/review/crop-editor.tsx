import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutRectangle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { CropRect } from '@/lib/files/images';
import type { CapturedPage } from '@/stores/capture';
import { palette, space } from '@/theme/tokens';

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Bounds {
  width: number;
  height: number;
}

const HANDLE = 44;
const MIN_SIZE = 64;
const CORNERS: Corner[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
const CORNER_LABEL: Record<Corner, string> = {
  topLeft: 'Top left crop corner',
  topRight: 'Top right crop corner',
  bottomLeft: 'Bottom left crop corner',
  bottomRight: 'Bottom right crop corner',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Moves one corner by (dx, dy), keeping the crop inside the image and above a minimum size. */
function moveCorner(corner: Corner, dx: number, dy: number, from: Rect, bounds: Bounds): Rect {
  let { x, y, w, h } = from;
  const right = from.x + from.w;
  const bottom = from.y + from.h;
  if (corner.endsWith('Left')) {
    x = clamp(from.x + dx, 0, right - MIN_SIZE);
    w = right - x;
  } else {
    w = clamp(from.w + dx, MIN_SIZE, bounds.width - from.x);
  }
  if (corner.startsWith('top')) {
    y = clamp(from.y + dy, 0, bottom - MIN_SIZE);
    h = bottom - y;
  } else {
    h = clamp(from.h + dy, MIN_SIZE, bounds.height - from.y);
  }
  return { x, y, w, h };
}

interface CropEditorProps {
  page: CapturedPage;
  visible: boolean;
  onCancel: () => void;
  onApply: (rect: CropRect) => void;
}

/** Drag the corners to trim the page. Each corner is also adjustable with screen-reader swipes. */
export function CropEditor({ page, visible, onCancel, onApply }: CropEditorProps) {
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<LayoutRectangle | null>(null);
  const latest = useRef<Rect | null>(null);

  const fit = useMemo(() => {
    if (!area) return null;
    const scale = Math.min(area.width / page.width, area.height / page.height);
    return { scale, width: page.width * scale, height: page.height * scale };
  }, [area, page.width, page.height]);

  const apply = () => {
    const rect = latest.current;
    if (!rect || !fit) return;
    onApply({
      originX: Math.round(rect.x / fit.scale),
      originY: Math.round(rect.y / fit.scale),
      width: Math.round(Math.min(rect.w / fit.scale, page.width)),
      height: Math.round(Math.min(rect.h / fit.scale, page.height)),
    });
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View
        style={[
          styles.root,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md },
        ]}>
        <Text variant="headline" tone="inverse" align="center" accessibilityRole="header">
          Crop page
        </Text>
        <View style={styles.area} onLayout={(event) => setArea(event.nativeEvent.layout)}>
          {fit ? (
            <CropSurface
              key={`${page.uri}-${Math.round(fit.width)}`}
              uri={page.uri}
              bounds={{ width: fit.width, height: fit.height }}
              onChange={(rect) => {
                latest.current = rect;
              }}
            />
          ) : null}
        </View>
        <View style={styles.actions}>
          <Button label="Cancel" variant="onDark" onPress={onCancel} style={styles.action} />
          <Button label="Apply crop" variant="signal" onPress={apply} style={styles.action} />
        </View>
      </View>
    </Modal>
  );
}

function CropSurface({
  uri,
  bounds,
  onChange,
}: {
  uri: string;
  bounds: Bounds;
  onChange: (rect: Rect) => void;
}) {
  const [rect, setRect] = useState<Rect>(() => {
    const inset = Math.min(bounds.width, bounds.height) * 0.06;
    return { x: inset, y: inset, w: bounds.width - inset * 2, h: bounds.height - inset * 2 };
  });
  /** Where the active drag began, in page coordinates, and the crop at that moment. */
  const drag = useRef<{ x: number; y: number; from: Rect } | null>(null);

  useEffect(() => {
    onChange(rect);
  }, [rect, onChange]);

  const dragHandlers = (corner: Corner) => ({
    onStartShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event: GestureResponderEvent) => {
      drag.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, from: rect };
    },
    onResponderMove: (event: GestureResponderEvent) => {
      const start = drag.current;
      if (!start) return;
      const dx = event.nativeEvent.pageX - start.x;
      const dy = event.nativeEvent.pageY - start.y;
      setRect(moveCorner(corner, dx, dy, start.from, bounds));
    },
    onResponderRelease: () => {
      drag.current = null;
    },
  });

  const adjust = (corner: Corner, event: AccessibilityActionEvent) => {
    const step = Math.min(bounds.width, bounds.height) * 0.05;
    const outward = event.nativeEvent.actionName === 'increment' ? step : -step;
    const dx = corner.endsWith('Left') ? -outward : outward;
    const dy = corner.startsWith('top') ? -outward : outward;
    setRect((previous) => moveCorner(corner, dx, dy, previous, bounds));
  };

  return (
    <View style={bounds}>
      <Image source={{ uri }} style={bounds} contentFit="fill" aria-hidden />
      <View style={[styles.shade, { left: 0, top: 0, right: 0, height: rect.y }]} />
      <View style={[styles.shade, { left: 0, top: rect.y + rect.h, right: 0, bottom: 0 }]} />
      <View style={[styles.shade, { left: 0, top: rect.y, width: rect.x, height: rect.h }]} />
      <View
        style={[styles.shade, { left: rect.x + rect.w, top: rect.y, right: 0, height: rect.h }]}
      />
      <View
        style={[styles.frame, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }]}
        pointerEvents="none"
      />
      {CORNERS.map((corner) => (
        <View
          key={corner}
          {...dragHandlers(corner)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={CORNER_LABEL[corner]}
          accessibilityHint="Swipe up to enlarge the crop, down to shrink it"
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => adjust(corner, event)}
          style={[
            styles.handle,
            {
              left: (corner.endsWith('Left') ? rect.x : rect.x + rect.w) - HANDLE / 2,
              top: (corner.startsWith('top') ? rect.y : rect.y + rect.h) - HANDLE / 2,
            },
          ]}>
          <View style={styles.knob} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink, gap: space.md },
  area: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: space.gutter,
  },
  shade: { position: 'absolute', backgroundColor: 'rgba(17,19,17,0.6)' },
  frame: { position: 'absolute', borderWidth: 2, borderColor: palette.signal },
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.signal,
    borderWidth: 2,
    borderColor: palette.ink,
  },
  actions: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.gutter },
  action: { flex: 1 },
});
