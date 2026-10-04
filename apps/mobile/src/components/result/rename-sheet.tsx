import { LIMITS } from '@covert/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { space } from '@/theme/tokens';

interface RenameSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}

export function RenameSheet({ visible, title, onClose, onSave }: RenameSheetProps) {
  return (
    <Sheet visible={visible} title="Rename" onClose={onClose}>
      {visible ? <RenameBody title={title} onClose={onClose} onSave={onSave} /> : null}
    </Sheet>
  );
}

function RenameBody({ title, onClose, onSave }: Omit<RenameSheetProps, 'visible'>) {
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = value.trim();
    if (!next) {
      setError('Enter a name.');
      return;
    }
    if (next === title) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      onClose();
    } catch {
      setError('The new name couldn’t be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.body}>
      <TextField
        label="Name"
        tinted
        value={value}
        onChangeText={(text) => {
          setValue(text);
          setError(undefined);
        }}
        error={error}
        autoFocus
        maxLength={LIMITS.maxTitleLength}
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        selectTextOnFocus
      />
      <Button label="Save" onPress={() => void save()} loading={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md },
});
