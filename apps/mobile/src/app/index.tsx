import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DocumentRow } from '@/components/document/document-row';
import { ListPlaceholder } from '@/components/document/list-placeholder';
import { ScanCard } from '@/components/home/scan-card';
import { UploadSheet } from '@/components/home/upload-sheet';
import { BusyOverlay } from '@/components/ui/busy-overlay';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { Screen } from '@/components/ui/screen';
import { Accent, Text } from '@/components/ui/text';
import { Wordmark } from '@/components/ui/wordmark';
import { usePick } from '@/hooks/use-pick';
import { plural } from '@/lib/format';
import { useCapture } from '@/stores/capture';
import { useDocuments } from '@/stores/documents';
import { palette, radius, scene, size, space } from '@/theme/tokens';

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { pick, busy } = usePick();
  const list = useDocuments((state) => state.list);
  const listState = useDocuments((state) => state.listState);
  const listError = useDocuments((state) => state.listError);
  const loadList = useDocuments((state) => state.loadList);

  useFocusEffect(
    useCallback(() => {
      void loadList();
    }, [loadList]),
  );

  const scan = () => {
    useCapture.getState().reset();
    router.push('/capture');
  };

  const recent = list.slice(0, RECENT_COUNT);

  return (
    <Screen background={scene.home} contentStyle={styles.content}>
      <View style={styles.header}>
        <Wordmark />
        <View style={styles.headerActions}>
          <IconButton
            icon="history"
            label="History"
            variant="tonal"
            onPress={() => router.push('/history')}
          />
          <IconButton
            icon="settings"
            label="Settings"
            variant="tonal"
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>

      <OfflineBanner />

      <Text variant="display" accessibilityRole="header">
        Turn a document <Accent>into</Accent> structured data.
      </Text>

      <View style={styles.actions}>
        <ScanCard onPress={scan} />
        <Pressable
          onPress={() => setUploadOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Upload a file"
          accessibilityHint="Choose photos or a PDF, JPG or PNG file"
          style={({ pressed }) => [styles.upload, pressed && styles.uploadPressed]}>
          <View style={styles.uploadTile}>
            <Icon name="upload" />
          </View>
          <View style={styles.uploadCopy}>
            <Text variant="headline">Upload a file</Text>
            <Text variant="footnote" tone="secondary">
              PDF, JPG or PNG
            </Text>
          </View>
          <View style={styles.chevron}>
            <Icon name="chevronRight" size={16} strokeWidth={2.2} />
          </View>
        </Pressable>
      </View>

      {/* Recent sits on a stack of cards, the newest conversions on top. */}
      <View>
        <View style={[styles.peek, styles.peekBack]} aria-hidden />
        <View style={[styles.peek, styles.peekMiddle]} aria-hidden />
        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text variant="heading" accessibilityRole="header" style={styles.recentTitle}>
              Recent
            </Text>
            {list.length > 0 ? (
              <Pressable
                onPress={() => router.push('/history')}
                accessibilityRole="button"
                accessibilityLabel={`See all, ${plural(list.length, 'document')}`}
                style={({ pressed }) => [styles.seeAll, pressed && styles.seeAllPressed]}>
                <Text variant="footnote" style={styles.seeAllText}>
                  See all
                </Text>
                <Icon name="chevronRight" size={14} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>

          {listState === 'error' && list.length === 0 ? (
            <Notice
              tone="error"
              icon="alert"
              title="Recent documents didn’t load"
              message={listError?.message}
              actionLabel="Try again"
              onAction={() => void loadList()}
            />
          ) : listState !== 'ready' && list.length === 0 ? (
            <ListPlaceholder rows={3} label="Loading recent documents" />
          ) : recent.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="headline">No conversions yet</Text>
              <Text variant="callout">Documents you scan or upload will appear here.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {recent.map((item) => (
                <DocumentRow
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/document/${item.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <UploadSheet
        visible={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onChoose={(source) => void pick(source)}
      />
      <BusyOverlay visible={busy !== null} label="Preparing your file" />
    </Screen>
  );
}

const PEEK = 18;

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingTop: space.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  headerActions: { flexDirection: 'row', gap: space.xs },
  actions: { gap: space.sm },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.round,
    backgroundColor: palette.canvas,
    padding: space.xs,
    paddingRight: space.sm,
    minHeight: 72,
  },
  uploadPressed: { backgroundColor: palette.canvasDeep },
  uploadTile: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCopy: { flex: 1, gap: 2 },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peek: {
    height: PEEK * 2,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  peekBack: { marginHorizontal: space.xl, backgroundColor: palette.blue },
  peekMiddle: {
    marginHorizontal: space.md,
    marginTop: -PEEK,
    backgroundColor: palette.blueDeep,
  },
  recent: {
    marginTop: -PEEK,
    backgroundColor: palette.greenDeep,
    borderRadius: radius.xl,
    padding: space.sm,
    paddingTop: space.md,
    gap: space.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
    minHeight: size.touch,
  },
  recentTitle: { flex: 1 },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
    paddingHorizontal: space.sm,
    borderRadius: radius.round,
    backgroundColor: palette.glass,
  },
  seeAllPressed: { backgroundColor: palette.glassPressed },
  seeAllText: { fontWeight: '700' },
  list: { gap: space.xs },
  empty: {
    gap: space.xxs,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: palette.glass,
  },
});
