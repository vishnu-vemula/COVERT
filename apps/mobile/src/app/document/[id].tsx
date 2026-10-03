import type { ApiError, Column, Row } from '@covert/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, findNodeHandle, ScrollView, StyleSheet, View } from 'react-native';

import { CellEditor, type EditTarget } from '@/components/result/cell-editor';
import { DataTable } from '@/components/result/data-table';
import { ExportSheet } from '@/components/result/export-sheet';
import { OriginalText } from '@/components/result/original-text';
import { ReaderBar } from '@/components/result/reader-bar';
import { RenameSheet } from '@/components/result/rename-sheet';
import { StatStrip } from '@/components/result/stat-strip';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { TopBar } from '@/components/ui/top-bar';
import { useAfterDismiss } from '@/hooks/use-after-dismiss';
import { useReader } from '@/hooks/use-reader';
import { toApiError } from '@/lib/api/client';
import { confirm } from '@/lib/confirm';
import { fileTypeLabel, formatDateTime, plural } from '@/lib/format';
import { useDocuments } from '@/stores/documents';
import { palette, radius, space } from '@/theme/tokens';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const document = useDocuments((state) => state.documents[id]);
  const showToast = useToast((state) => state.show);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [tableIndex, setTableIndex] = useState(0);
  const [readerOpen, setReaderOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const titleRef = useRef<View>(null);
  const tableTop = useRef(0);
  const rowOffsets = useRef<Record<number, number>>({});

  const tables = document?.tables ?? [];
  const table = tables[Math.min(tableIndex, Math.max(tables.length - 1, 0))];
  const reader = useReader(document, table);
  const menu = useAfterDismiss();

  const load = useCallback(() => {
    useDocuments
      .getState()
      .loadDocument(id)
      .catch((error: unknown) => setLoadError(toApiError(error)));
  }, [id]);

  useEffect(() => {
    if (!useDocuments.getState().documents[id]) load();
  }, [id, load]);

  // Move screen-reader focus to the title once the document is on screen.
  const hasDocument = document !== undefined;
  useEffect(() => {
    if (!hasDocument) return;
    const node = findNodeHandle(titleRef.current);
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  }, [hasDocument]);

  // Keep the row being read in view.
  useEffect(() => {
    if (!readerOpen || reader.mode !== 'table' || !reader.playing) return;
    const offset = rowOffsets.current[reader.row];
    if (offset === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(tableTop.current + offset - 160, 0), animated: true });
  }, [reader.row, reader.mode, reader.playing, readerOpen]);

  if (!document) {
    return (
      <Screen header={<TopBar />} contentStyle={styles.center}>
        {loadError ? (
          <Notice
            tone="error"
            icon="alert"
            title="This document didn’t open"
            message={loadError.message}
            actionLabel={loadError.code === 'NOT_FOUND' ? undefined : 'Try again'}
            onAction={
              loadError.code === 'NOT_FOUND'
                ? undefined
                : () => {
                    setLoadError(null);
                    load();
                  }
            }
          />
        ) : (
          <View style={styles.loading} accessible accessibilityLabel="Opening document">
            <ActivityIndicator color={palette.ink} />
          </View>
        )}
      </Screen>
    );
  }

  const openEditor = (row: Row, rowIndex: number, column: Column) => {
    const cell = row.cells.find((item) => item.columnId === column.id);
    if (!table || !cell) return;
    reader.stop();
    setEditing({ tableId: table.id, rowId: row.id, rowIndex, column, cell });
  };

  const saveCell = (target: EditTarget, value: string) => {
    useDocuments
      .getState()
      .editCell(document.id, {
        tableId: target.tableId,
        rowId: target.rowId,
        columnId: target.column.id,
        value,
      })
      .catch((error: unknown) => {
        const message = toApiError(error).message;
        showToast(`Your change wasn’t saved. ${message}`, 'error');
      });
  };

  /** Opens the next uncertain value, starting with the table on screen. */
  const reviewNext = () => {
    const order = [tableIndex, ...tables.map((_, index) => index).filter((index) => index !== tableIndex)];
    for (const index of order) {
      const candidate = tables[index];
      if (!candidate) continue;
      for (const [rowIndex, row] of candidate.rows.entries()) {
        const cell = row.cells.find((item) => item.uncertain);
        const column = candidate.columns.find((item) => item.id === cell?.columnId);
        if (cell && column) {
          reader.stop();
          setTableIndex(index);
          setEditing({ tableId: candidate.id, rowId: row.id, rowIndex, column, cell });
          return;
        }
      }
    }
  };

  const remove = async () => {
    const confirmed = await confirm({
      title: 'Delete this document?',
      message: 'Its tables and summary will be removed from your history. This can’t be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      reader.stop();
      await useDocuments.getState().remove(document.id);
      showToast('Document deleted');
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    }
  };

  return (
    <Screen
      scrollRef={scrollRef}
      header={
        <TopBar
          label={`${fileTypeLabel(document.fileType)}${document.pageCount > 1 ? ` · ${plural(document.pageCount, 'page')}` : ''}`}
          right={<IconButton icon="more" label="Document actions" onPress={() => setMenuOpen(true)} />}
        />
      }
      contentStyle={styles.content}
      footer={
        readerOpen ? (
          <ReaderBar
            reader={reader}
            table={table}
            onClose={() => {
              reader.stop();
              setReaderOpen(false);
            }}
          />
        ) : null
      }>
      <OfflineBanner />

      <View style={styles.heading}>
        <View ref={titleRef} accessible accessibilityRole="header" accessibilityLabel={document.title}>
          <Text variant="title">{document.title}</Text>
        </View>
        <Text variant="footnote" tone="secondary">
          {formatDateTime(document.createdAt)}
        </Text>
      </View>

      <StatStrip stats={document.stats} onReview={reviewNext} />

      <View style={styles.actions}>
        <Button
          label="Read"
          icon="speaker"
          accessibilityHint="Reads the summary aloud and opens audio controls"
          onPress={() => {
            setReaderOpen(true);
            reader.choose('summary');
          }}
          style={styles.action}
        />
        <Button
          label="Export"
          icon="share"
          variant="secondary"
          onPress={() => {
            reader.stop();
            setExportOpen(true);
          }}
          style={styles.action}
        />
      </View>

      {tables.length > 1 ? (
        <Segmented
          scrollable
          label="Tables"
          options={tables.map((item, index) => ({ value: index, label: item.title }))}
          value={tableIndex}
          onChange={(index) => {
            rowOffsets.current = {};
            setTableIndex(index);
          }}
        />
      ) : null}

      {table ? (
        <View
          style={styles.tableBlock}
          onLayout={(event) => {
            tableTop.current = event.nativeEvent.layout.y;
          }}>
          <View style={styles.tableHeading}>
            <Text variant="heading" accessibilityRole="header" style={styles.tableTitle}>
              {table.title}
            </Text>
            <Text variant="footnote" tone="secondary">
              {plural(table.rows.length, 'row')} · {plural(table.columns.length, 'column')}
            </Text>
          </View>
          <DataTable
            key={table.id}
            table={table}
            activeRow={readerOpen && reader.mode === 'table' ? reader.row : null}
            onEdit={openEditor}
            onRowLayout={(rowIndex, y) => {
              rowOffsets.current[rowIndex] = y + 70;
            }}
          />
          <Text variant="footnote" tone="secondary">
            Tap a value to correct it. Changes save automatically.
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="eyebrow" tone="secondary" accessibilityRole="header">
          Summary
        </Text>
        <Text>{document.summary}</Text>
      </View>

      {document.warnings.length > 0 ? (
        <View style={styles.section}>
          <Text variant="eyebrow" tone="secondary" accessibilityRole="header">
            Check before using
          </Text>
          {document.warnings.map((warning) => (
            <View key={warning} style={styles.warning}>
              <View style={styles.warningRule} />
              <Text variant="callout" style={styles.warningText}>
                {warning}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <OriginalText text={document.ocrText} />

      <CellEditor target={editing} onClose={() => setEditing(null)} onSave={saveCell} />
      <ExportSheet
        key={table?.id}
        document={document}
        initialTableId={table?.id}
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
      />
      <Sheet
        visible={menuOpen}
        title="Document"
        onClose={() => setMenuOpen(false)}
        onDismiss={menu.onDismiss}>
        <View style={styles.menu}>
          <Button
            label="Rename"
            icon="edit"
            variant="secondary"
            onPress={() => {
              setMenuOpen(false);
              menu.schedule(() => setRenameOpen(true));
            }}
          />
          <Button
            label="Delete document"
            icon="trash"
            variant="danger"
            onPress={() => {
              setMenuOpen(false);
              menu.schedule(() => void remove());
            }}
          />
        </View>
      </Sheet>
      <RenameSheet
        visible={renameOpen}
        title={document.title}
        onClose={() => setRenameOpen(false)}
        onSave={(title) => useDocuments.getState().rename(document.id, title)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingTop: space.xs },
  center: { flexGrow: 1, justifyContent: 'center' },
  loading: { paddingVertical: space.xxl, alignItems: 'center' },
  heading: { gap: space.xs },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1 },
  tableBlock: { gap: space.sm },
  tableHeading: { gap: 2 },
  tableTitle: { marginTop: space.xxs },
  section: { gap: space.sm },
  warning: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.reviewWash,
  },
  warningRule: { width: 3, borderRadius: 2, backgroundColor: palette.review },
  warningText: { flex: 1 },
  menu: { gap: space.sm },
});
