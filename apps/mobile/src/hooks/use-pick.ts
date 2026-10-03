import { router } from 'expo-router';
import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { pickFile, pickPhotos } from '@/lib/files/pick';
import { FileRejectedError } from '@/lib/files/validate';
import { useCapture } from '@/stores/capture';

export type PickSource = 'photos' | 'files';

/** Opens the photo library or file picker and moves to Review with the result. */
export function usePick(onPicked?: () => void) {
  const [busy, setBusy] = useState<PickSource | null>(null);
  const showToast = useToast((state) => state.show);

  const pick = async (source: PickSource) => {
    setBusy(source);
    try {
      const result = source === 'photos' ? await pickPhotos() : await pickFile();
      if (result.kind === 'cancelled') return;
      const capture = useCapture.getState();
      capture.reset();
      if (result.kind === 'pdf') capture.setPdf(result.pdf);
      else capture.setPages(result.pages);
      setBusy(null);
      onPicked?.();
      router.push('/review');
    } catch (error) {
      showToast(
        error instanceof FileRejectedError
          ? error.message
          : 'That file couldn’t be opened. Try a different one.',
        'error',
      );
    } finally {
      setBusy(null);
    }
  };

  return { pick, busy };
}
