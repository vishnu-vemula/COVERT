import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DocumentRow } from '@/components/document/document-row';
import { ScanCard } from '@/components/home/scan-card';
import { UploadSheet } from '@/components/home/upload-sheet';
import { BusyOverlay } from '@/components/ui/busy-overlay';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { LinkButton } from '@/components/ui/link-button';
import { Notice } from '@/components/ui/notice';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Wordmark } from '@/components/ui/wordmark';
import { usePick } from '@/hooks/use-pick';
import { useCapture } from '@/stores/capture';
import { useDocuments } from '@/stores/documents';
import { useColors } from '@/theme/contrast';
import { palette, radius, space } from '@/theme/tokens';

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const colors = useColors();
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
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Wordmark />
        <View style={styles.headerActions}>
          <IconButton icon="history" label="History" onPress={() => router.push('/history')} />
          <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
        </View>
      </View>

      <OfflineBanner />

      <Text variant="display" accessibilityRole="header">
        Turn a document{'\n'}into structured data.
      </Text>

      <View style={styles.actions}>
        <ScanCard onPress={scan} />
        <Pressable
          onPress={() => setUploadOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Upload a file"
          accessibilityHint="Choose photos or a PDF, JPG or PNG file"
          style={({ pressed }) => [
            styles.upload,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? palette.canvasDeep : palette.surface,
            },
          ]}>
          <View style={styles.uploadTile}>
            <Icon name="upload" />
          </View>
          <View style={styles.uploadCopy}>
            <Text variant="headline">Upload a file</Text>
            <Text variant="footnote" tone="secondary">
              PDF, JPG or PNG
            </Text>
          </View>
          <Icon name="chevronRight" color={colors.textSecondary} size={18} />
        </Pressable>
      </View>

      <View style={styles.recent}>
        <View style={styles.recentHeader}>
          <Text variant="eyebrow" tone="secondary" accessibilityRole="header">
            Recent
          </Text>
          {list.length > RECENT_COUNT ? (
            <LinkButton label="See all" onPress={() => router.push('/history')} />
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
          <RecentPlaceholder />
        ) : recent.length === 0 ? (
          <Notice
            title="No conversions yet"
            message="Documents you scan or upload will appear here."
          />
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

      <UploadSheet
        visible={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onChoose={(source) => void pick(source)}
      />
      <BusyOverlay visible={busy !== null} label="Preparing your file" />
    </Screen>
  );
}

/** Static placeholder while the list loads; no shimmer to distract. */
function RecentPlaceholder() {
  return (
    <View style={styles.list} accessible accessibilityLabel="Loading recent documents">
      {[0, 1, 2].map((index) => (
        <View key={index} style={styles.placeholder} />
      ))}
    </View>
  );
}

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
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.md,
    minHeight: 76,
  },
  uploadTile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.paperSand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCopy: { flex: 1, gap: 2 },
  recent: { gap: space.sm, marginTop: space.xs },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  list: { gap: space.xs },
  placeholder: { height: 76, borderRadius: radius.md, backgroundColor: palette.canvasDeep },
});
