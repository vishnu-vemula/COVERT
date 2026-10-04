import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { TopBar } from '@/components/ui/top-bar';
import { normalizeImage } from '@/lib/files/images';
import { FileRejectedError } from '@/lib/files/validate';
import { useCapture } from '@/stores/capture';
import { palette, radius, scene, space } from '@/theme/tokens';

const FLASH_ORDER: FlashMode[] = ['off', 'auto', 'on'];
const FLASH_LABEL: Record<string, string> = {
  off: 'Flash off',
  auto: 'Flash auto',
  on: 'Flash on',
};

export default function CaptureScreen() {
  const params = useLocalSearchParams<{ retake?: string }>();
  const retakeIndex = params.retake !== undefined ? Number(params.retake) : null;
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.dark}>
        <ActivityIndicator color={palette.onInk} />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <PermissionNeeded canAsk={permission.canAskAgain} onAllow={() => void requestPermission()} />
    );
  }
  return <Camera retakeIndex={retakeIndex} />;
}

function Camera({ retakeIndex }: { retakeIndex: number | null }) {
  const camera = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');
  const showToast = useToast((state) => state.show);

  const leave = () => {
    useCapture.getState().setAddingPage(false);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const shoot = async () => {
    if (!ready || busy || !camera.current) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.92, exif: false });
      const page = await normalizeImage(photo, 'camera');
      const capture = useCapture.getState();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      if (retakeIndex !== null && capture.pages[retakeIndex]) {
        capture.replacePage(retakeIndex, page);
        router.back();
      } else if (capture.addingPage) {
        capture.addPage(page);
        capture.setAddingPage(false);
        router.back();
      } else {
        capture.setPages([page]);
        router.replace('/review');
      }
    } catch (error) {
      showToast(
        error instanceof FileRejectedError
          ? error.message
          : 'The photo couldn’t be taken. Try again.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const cycleFlash = () =>
    setFlash(
      (current) => FLASH_ORDER[(FLASH_ORDER.indexOf(current) + 1) % FLASH_ORDER.length] ?? 'off',
    );

  // Page-shaped guide (A4 proportions) that fits between the controls.
  const frameWidth = Math.min(width - space.xl * 2, 520);
  const available = height - insets.top - insets.bottom - 260;
  const frameHeight = Math.max(160, Math.min(frameWidth * 1.414, available));

  return (
    <View style={styles.dark}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
        onCameraReady={() => setReady(true)}
        aria-hidden
      />

      <View style={[styles.top, { paddingTop: insets.top + space.xs }]}>
        <IconButton icon="close" label="Close camera" variant="glass" onPress={leave} />
        <View style={styles.hint}>
          <Text variant="footnote" tone="inverse" maxFontSizeMultiplier={1.4}>
            {retakeIndex !== null
              ? `Retake page ${retakeIndex + 1}`
              : 'Fit the page inside the frame'}
          </Text>
        </View>
        <IconButton
          icon={flash === 'off' ? 'flashOff' : 'flash'}
          label={FLASH_LABEL[flash] ?? 'Flash'}
          accessibilityHint="Changes the flash setting"
          variant="glass"
          onPress={cycleFlash}
        />
      </View>

      <View style={styles.frameArea} pointerEvents="none">
        <View style={{ width: frameWidth, height: frameHeight }}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable
          onPress={() => void shoot()}
          disabled={!ready || busy}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          aria-disabled={!ready || busy}
          aria-busy={busy}
          style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}>
          {busy ? <ActivityIndicator color={palette.ink} /> : <View style={styles.shutterCore} />}
        </Pressable>
      </View>
    </View>
  );
}

function PermissionNeeded({ canAsk, onAllow }: { canAsk: boolean; onAllow: () => void }) {
  return (
    <Screen
      background={scene.review}
      header={<TopBar backIcon="close" backLabel="Close" />}
      contentStyle={styles.permission}
      footer={
        canAsk ? (
          <Button label="Allow camera" onPress={onAllow} />
        ) : (
          <Button label="Open Settings" onPress={() => void Linking.openSettings()} />
        )
      }>
      <Text variant="title" accessibilityRole="header">
        Camera access
      </Text>
      <Text tone="secondary">
        {canAsk
          ? 'COVERT uses the camera only while you photograph a document.'
          : 'Camera access is turned off for COVERT. Turn it on in Settings, or go back and upload a file instead.'}
      </Text>
    </Screen>
  );
}

const CORNER = 30;
const STROKE = 3;

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
    gap: space.sm,
  },
  hint: {
    flexShrink: 1,
    backgroundColor: 'rgba(17,19,17,0.55)',
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  frameArea: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: palette.signal },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: STROKE,
    borderLeftWidth: STROKE,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
    borderBottomRightRadius: 6,
  },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: palette.onInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: { opacity: 0.7 },
  shutterCore: { width: 60, height: 60, borderRadius: 30, backgroundColor: palette.onInk },
  permission: { paddingTop: space.lg, gap: space.sm },
});
