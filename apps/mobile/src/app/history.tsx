import type { DocumentListItem } from '@covert/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { DocumentRow } from '@/components/document/document-row';
import { RenameSheet } from '@/components/result/rename-sheet';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { Screen } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { TopBar } from '@/components/ui/top-bar';
import { useAfterDismiss } from '@/hooks/use-after-dismiss';
import { toApiError } from '@/lib/api/client';
import { confirm } from '@/lib/confirm';
import { groupByMonth, plural } from '@/lib/format';
import { useCapture } from '@/stores/capture';
import { useDocuments } from '@/stores/documents';
import { palette, radius, space } from '@/theme/tokens';

export default function HistoryScreen() {
  const list = useDocuments((state) => state.list);
  const listState = useDocuments((state) => state.listState);
  const listError = useDocuments((state) => state.listError);
  const loadList = useDocuments((state) => state.loadList);
  const showToast = useToast((state) => state.show);
  const [selected, setSelected] = useState<DocumentListItem | null>(null);
  const [renaming, setRenaming] = useState<DocumentListItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const actions = useAfterDismiss();

  useFocusEffect(
    useCallback(() => {
      void loadList();
    }, [loadList]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadList();
    setRefreshing(false);
  };

  const remove = async (item: DocumentListItem) => {
    const confirmed = await confirm({
      title: 'Delete this document?',
      message: `“${item.title}” will be removed from your history. This can’t be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await useDocuments.getState().remove(item.id);
      showToast('Document deleted');
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    }
  };

  const groups = groupByMonth(list);

  return (
    <Screen
      header={<TopBar label={list.length > 0 ? plural(list.length, 'document') : undefined} />}
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={palette.ink} />
      }>
      <Text variant="title" accessibilityRole="header">
        History
      </Text>
      <OfflineBanner />

      {listState === 'error' && list.length === 0 ? (
        <Notice
          tone="error"
          icon="alert"
          title="History didn’t load"
          message={listError?.message}
          actionLabel="Try again"
          onAction={() => void loadList()}
        />
      ) : listState !== 'ready' && list.length === 0 ? (
        <View style={styles.list} accessible accessibilityLabel="Loading history">
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={styles.placeholder} />
          ))}
        </View>
      ) : list.length === 0 ? (
        <Notice
          title="Nothing here yet"
          message="Every document you convert is saved here, ready to reopen."
          actionLabel="Scan a document"
          onAction={() => {
            useCapture.getState().reset();
            router.push('/capture');
          }}
        />
      ) : (
        groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <Text variant="eyebrow" tone="secondary" accessibilityRole="header">
              {group.label}
            </Text>
            <View style={styles.list}>
              {group.items.map((item) => (
                <DocumentRow
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/document/${item.id}`)}
                  onMore={() => setSelected(item)}
                />
              ))}
            </View>
          </View>
        ))
      )}

      <Sheet
        visible={selected !== null}
        title={selected?.title ?? ''}
        onClose={() => setSelected(null)}
        onDismiss={actions.onDismiss}>
        <View style={styles.menu}>
          <Button
            label="Open"
            onPress={() => {
              const item = selected;
              setSelected(null);
              if (item) actions.schedule(() => router.push(`/document/${item.id}`));
            }}
          />
          <Button
            label="Rename"
            icon="edit"
            variant="secondary"
            onPress={() => {
              const item = selected;
              setSelected(null);
              actions.schedule(() => setRenaming(item));
            }}
          />
          <Button
            label="Delete"
            icon="trash"
            variant="danger"
            onPress={() => {
              const item = selected;
              setSelected(null);
              if (item) actions.schedule(() => void remove(item));
            }}
          />
        </View>
      </Sheet>

      <RenameSheet
        visible={renaming !== null}
        title={renaming?.title ?? ''}
        onClose={() => setRenaming(null)}
        onSave={async (title) => {
          if (renaming) await useDocuments.getState().rename(renaming.id, title);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingTop: space.xs },
  group: { gap: space.sm },
  list: { gap: space.xs },
  placeholder: { height: 76, borderRadius: radius.md, backgroundColor: palette.canvasDeep },
  menu: { gap: space.sm },
});
