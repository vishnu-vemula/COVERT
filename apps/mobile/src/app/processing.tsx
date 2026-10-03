import { formatBytes } from '@covert/shared';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { STAGE_LABELS, StageList } from '@/components/processing/stage-list';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TopBar } from '@/components/ui/top-bar';
import { plural } from '@/lib/format';
import { hasInput, useCapture } from '@/stores/capture';
import { useDocuments } from '@/stores/documents';
import { useProcessing } from '@/stores/processing';
import { useSettings } from '@/stores/settings';
import { useScreenReader } from '@/theme/motion';
import { palette, radius, space } from '@/theme/tokens';

export default function ProcessingScreen() {
  const status = useProcessing((state) => state.status);
  const stage = useProcessing((state) => state.stage);
  const upload = useProcessing((state) => state.upload);
  const error = useProcessing((state) => state.error);
  const documentId = useProcessing((state) => state.documentId);
  const audioFeedback = useSettings((state) => state.audioFeedback);
  const speechRate = useSettings((state) => state.speechRate);
  const screenReader = useScreenReader();
  const pageCount = useCapture((state) => (state.pdf ? 0 : state.pages.length));

  /** Announces to screen readers, and speaks aloud when audio feedback is on and no screen reader is. */
  const say = useRef((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  });
  useEffect(() => {
    say.current = (message: string) => {
      AccessibilityInfo.announceForAccessibility(message);
      if (audioFeedback && !screenReader) {
        void Speech.stop();
        Speech.speak(message, { rate: speechRate });
      }
    };
  }, [audioFeedback, screenReader, speechRate]);

  // Opened without a running job (for example after the app restarted): start or leave.
  useEffect(() => {
    if (useProcessing.getState().status !== 'idle') return;
    if (hasInput(useCapture.getState())) useProcessing.getState().start();
    else router.replace('/');
  }, []);

  useEffect(() => {
    if (status === 'running' && stage !== 'ready') say.current(STAGE_LABELS[stage]);
  }, [status, stage]);

  useEffect(() => {
    if (status === 'error' && error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      say.current(error.message);
    }
  }, [status, error]);

  useEffect(() => {
    if (status !== 'ready' || !documentId) return;
    const document = useDocuments.getState().documents[documentId];
    const rows = document?.stats.rowCount ?? 0;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    say.current(`Ready. ${plural(rows, 'record')} extracted.`);
    useCapture.getState().reset();
    useProcessing.getState().reset();
    router.dismissAll();
    router.push(`/document/${documentId}`);
  }, [status, documentId]);

  // Leaving mid-conversion cancels the upload; the server stops when the connection closes.
  useEffect(
    () => () => {
      if (useProcessing.getState().status === 'running') useProcessing.getState().cancel();
    },
    [],
  );

  const failed = status === 'error';
  const title = failed ? 'Couldn’t convert this document' : stage === 'ready' ? 'Ready' : STAGE_LABELS[stage];
  const progress = upload && upload.total > 0 ? upload.sent / upload.total : null;
  const uploadDetail =
    stage === 'uploading' && upload ? `${formatBytes(upload.sent)} of ${formatBytes(upload.total)}` : null;

  return (
    <Screen
      header={
        <TopBar
          backIcon="close"
          backLabel="Cancel conversion"
          label={pageCount > 1 ? plural(pageCount, 'page') : undefined}
          onBack={() => {
            useProcessing.getState().cancel();
            router.back();
          }}
        />
      }
      contentStyle={styles.content}
      footer={
        failed ? (
          <>
            {error?.retryable ? (
              <Button label="Try again" onPress={() => useProcessing.getState().start()} />
            ) : null}
            <Button
              label="Back to review"
              variant={error?.retryable ? 'secondary' : 'primary'}
              onPress={() => {
                useProcessing.getState().reset();
                router.back();
              }}
            />
          </>
        ) : null
      }>
      <View style={styles.heading}>
        <Text
          variant="display"
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={styles.title}>
          {title}
        </Text>
        {progress !== null && stage === 'uploading' ? (
          <View
            style={styles.track}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Upload progress"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        ) : null}
      </View>

      <StageList current={stage} failed={failed} detail={uploadDetail} />

      {failed && error ? <Notice tone="error" icon="alert" title={error.message} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.xl, paddingTop: space.lg },
  heading: { gap: space.md, minHeight: 96 },
  title: { maxWidth: 420 },
  track: { height: 4, borderRadius: radius.sm, backgroundColor: palette.canvasDeep, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: palette.ink },
});
