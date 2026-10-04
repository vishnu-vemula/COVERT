import { formatBytes, LIMITS } from '@covert/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CropEditor } from '@/components/review/crop-editor';
import { ToolButton } from '@/components/review/tool-button';
import { BusyOverlay } from '@/components/ui/busy-overlay';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { useIsOffline } from '@/components/ui/offline-banner';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { TopBar } from '@/components/ui/top-bar';
import { normalizeImage, type CropRect } from '@/lib/files/images';
import { plural } from '@/lib/format';
import { useCapture } from '@/stores/capture';
import { useProcessing } from '@/stores/processing';
import { palette, radius, scene, space } from '@/theme/tokens';

export default function ReviewScreen() {
  const pages = useCapture((state) => state.pages);
  const pdf = useCapture((state) => state.pdf);
  const [selected, setSelected] = useState(0);
  const [cropping, setCropping] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const offline = useIsOffline();
  const showToast = useToast((state) => state.show);

  const index = Math.min(selected, Math.max(pages.length - 1, 0));
  const page = pages[index];

  const edit = async (label: string, change: { rotate?: number; crop?: CropRect }) => {
    if (!page) return;
    setWorking(label);
    try {
      useCapture.getState().replacePage(index, await normalizeImage(page, page.source, change));
    } catch {
      showToast('That change couldn’t be applied. Try again.', 'error');
    } finally {
      setWorking(null);
    }
  };

  const convert = () => {
    if (offline) {
      showToast('You’re offline. Connect to the internet to convert this document.', 'error');
      return;
    }
    useProcessing.getState().start();
    router.push('/processing');
  };

  if (!pdf && !page) {
    return (
      <Screen background={scene.review} header={<TopBar />} contentStyle={styles.empty}>
        <Notice
          title="Nothing to review"
          message="Scan or upload a document to get started."
          actionLabel="Back to home"
          onAction={() => router.dismissTo('/')}
        />
      </Screen>
    );
  }

  const meta = pdf ? `PDF · ${formatBytes(pdf.size)}` : `${plural(pages.length, 'page')}`;

  return (
    <Screen
      background={scene.review}
      header={<TopBar label={meta} />}
      contentStyle={styles.content}
      footer={
        <Button
          label="Convert"
          icon="arrowUpRight"
          iconPosition="end"
          accessibilityHint="Reads the document and builds a table"
          onPress={convert}
        />
      }>
      <Text variant="title" accessibilityRole="header">
        Review
      </Text>

      {pdf ? (
        <View style={styles.pdf}>
          <View style={styles.pdfTile}>
            <Text variant="heading">PDF</Text>
          </View>
          <View style={styles.pdfCopy}>
            <Text variant="headline" numberOfLines={3}>
              {pdf.name}
            </Text>
            <Text variant="footnote" tone="secondary">
              {formatBytes(pdf.size)} · up to {LIMITS.maxPdfPages} pages are read
            </Text>
          </View>
        </View>
      ) : page ? (
        <>
          <View style={styles.preview}>
            <Image
              source={{ uri: page.uri }}
              style={styles.image}
              contentFit="contain"
              accessible
              accessibilityLabel={`Page ${index + 1} of ${pages.length}`}
              transition={120}
            />
          </View>

          {pages.length > 1 || page.source === 'camera' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}>
              {pages.map((item, position) => (
                <Pressable
                  key={item.uri}
                  onPress={() => setSelected(position)}
                  accessibilityRole="button"
                  accessibilityLabel={`Page ${position + 1}`}
                  aria-selected={position === index}
                  style={[styles.thumb, position === index && styles.thumbSelected]}>
                  <Image source={{ uri: item.uri }} style={styles.thumbImage} contentFit="cover" />
                </Pressable>
              ))}
              {pages.length < LIMITS.maxImagePages ? (
                <Pressable
                  onPress={() => {
                    useCapture.getState().setAddingPage(true);
                    router.push('/capture');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add page"
                  accessibilityHint="Opens the camera to photograph another page"
                  style={({ pressed }) => [
                    styles.thumb,
                    styles.addPage,
                    pressed && styles.addPagePressed,
                  ]}>
                  <Icon name="plus" size={20} />
                </Pressable>
              ) : null}
            </ScrollView>
          ) : null}

          <View style={styles.tools}>
            <ToolButton
              icon="rotate"
              label="Rotate"
              onPress={() => void edit('Rotating page', { rotate: 90 })}
            />
            <ToolButton icon="crop" label="Crop" onPress={() => setCropping(true)} />
            {page.source === 'camera' ? (
              <ToolButton
                icon="camera"
                label="Retake"
                onPress={() =>
                  router.push({ pathname: '/capture', params: { retake: String(index) } })
                }
              />
            ) : null}
            {pages.length > 1 ? (
              <ToolButton
                icon="trash"
                label="Remove"
                accessibilityHint={`Removes page ${index + 1}`}
                onPress={() => useCapture.getState().removePage(index)}
              />
            ) : null}
          </View>

          <CropEditor
            page={page}
            visible={cropping}
            onCancel={() => setCropping(false)}
            onApply={(crop) => {
              setCropping(false);
              void edit('Cropping page', { crop });
            }}
          />
        </>
      ) : null}

      <BusyOverlay visible={working !== null} label={working ?? 'Updating page'} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingTop: space.xs },
  empty: { paddingTop: space.lg },
  preview: {
    height: 380,
    borderRadius: radius.xl,
    backgroundColor: palette.glass,
    padding: space.sm,
  },
  image: { flex: 1 },
  strip: { gap: space.xs, paddingVertical: space.xxs },
  thumb: {
    width: 56,
    height: 72,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: palette.glass,
  },
  thumbSelected: { borderColor: palette.ink },
  thumbImage: { flex: 1 },
  addPage: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: palette.ink,
    backgroundColor: 'transparent',
  },
  addPagePressed: { backgroundColor: palette.glass },
  tools: { flexDirection: 'row', gap: space.xs },
  pdf: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.xl,
    backgroundColor: palette.surface,
  },
  pdfTile: {
    width: 72,
    height: 92,
    borderRadius: radius.md,
    backgroundColor: palette.green,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: space.sm,
  },
  pdfCopy: { flex: 1, gap: space.xxs },
});
