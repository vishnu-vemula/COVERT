import type { Cell, Column } from '@covert/shared';
import { LIMITS } from '@covert/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { palette, radius, space } from '@/theme/tokens';

export interface EditTarget {
  tableId: string;
  rowId: string;
  rowIndex: number;
  column: Column;
  cell: Cell;
}

interface CellEditorProps {
  target: EditTarget | null;
  onClose: () => void;
  onSave: (target: EditTarget, value: string) => void;
}

export function CellEditor({ target, onClose, onSave }: CellEditorProps) {
  return (
    <Sheet visible={target !== null} title={target?.column.label || 'Edit value'} onClose={onClose}>
      {target ? (
        <EditorBody
          key={`${target.rowId}-${target.column.id}`}
          target={target}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Sheet>
  );
}

function EditorBody({
  target,
  onClose,
  onSave,
}: { target: EditTarget } & Omit<CellEditorProps, 'target'>) {
  const [value, setValue] = useState(target.cell.value);
  const changed = value !== target.cell.value;
  const { uncertain, sourceText } = target.cell;

  const save = () => {
    if (changed || uncertain) onSave(target, value);
    onClose();
  };

  return (
    <View style={styles.body}>
      <Text variant="footnote" tone="secondary">
        Row {target.rowIndex + 1}
      </Text>
      {uncertain ? (
        <View style={styles.note}>
          <View style={styles.rule} />
          <Text variant="callout" style={styles.noteText}>
            COVERT wasn’t certain about this value.
            {sourceText
              ? ` The document reads “${sourceText}”.`
              : ' Check it against the original.'}
          </Text>
        </View>
      ) : null}
      <TextField
        label="Value"
        value={value}
        onChangeText={setValue}
        autoFocus
        multiline
        maxLength={LIMITS.maxCellLength}
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        onSubmitEditing={save}
      />
      <View style={styles.actions}>
        <Button label="Cancel" variant="tonal" onPress={onClose} style={styles.action} />
        <Button
          label={changed ? 'Save' : uncertain ? 'Confirm' : 'Done'}
          accessibilityHint={!changed && uncertain ? 'Marks this value as checked' : undefined}
          onPress={save}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: palette.reviewWash,
    borderRadius: radius.md,
    padding: space.md,
  },
  rule: { width: 3, borderRadius: 2, backgroundColor: palette.review },
  noteText: { flex: 1 },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1 },
});
