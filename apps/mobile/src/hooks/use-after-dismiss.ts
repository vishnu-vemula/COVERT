import { useRef } from 'react';
import { Platform } from 'react-native';

/**
 * iOS cannot present a picker, share sheet, alert or another modal while a
 * sheet is still animating away. `schedule` defers the action to the sheet's
 * `onDismiss`; other platforms run it straight away.
 */
export function useAfterDismiss() {
  const pending = useRef<(() => void) | null>(null);
  return {
    schedule: (action: () => void) => {
      if (Platform.OS === 'ios') pending.current = action;
      else action();
    },
    onDismiss: () => {
      const action = pending.current;
      pending.current = null;
      action?.();
    },
  };
}
