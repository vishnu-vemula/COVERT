import Constants from 'expo-constants';
import { Children, Fragment, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Scallop } from '@/components/ui/shapes';
import { Mark } from '@/components/ui/wordmark';
import { Screen } from '@/components/ui/screen';
import { CircleChoice } from '@/components/ui/circle-choice';
import { SwitchRow } from '@/components/ui/switch-row';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { TopBar } from '@/components/ui/top-bar';
import { toApiError } from '@/lib/api/client';
import { signOut, useAuth } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { useDocuments } from '@/stores/documents';
import { rateLabel, SPEECH_RATES, useSettings } from '@/stores/settings';
import { useColors } from '@/theme/contrast';
import { palette, radius, scene, space } from '@/theme/tokens';

export default function SettingsScreen() {
  const { user } = useAuth();
  const settings = useSettings();
  const showToast = useToast((state) => state.show);
  const [clearing, setClearing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const version = Constants.expoConfig?.version ?? '—';

  const clearHistory = async () => {
    const confirmed = await confirm({
      title: 'Clear history?',
      message:
        'Every saved conversion and its tables will be deleted from your account. This can’t be undone.',
      confirmLabel: 'Clear history',
      destructive: true,
    });
    if (!confirmed) return;
    setClearing(true);
    try {
      await useDocuments.getState().clearAll();
      showToast('History cleared');
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    } finally {
      setClearing(false);
    }
  };

  const leave = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
      showToast('Signing out didn’t work. Try again.', 'error');
    }
  };

  return (
    <Screen background={scene.settings} header={<TopBar />} contentStyle={styles.content}>
      <Text variant="title" accessibilityRole="header">
        Settings
      </Text>

      <Section title="Account">
        <View style={styles.row}>
          <Text variant="footnote" tone="secondary">
            Email
          </Text>
          <Text selectable>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Button
            label="Sign out"
            variant="tonal"
            size="medium"
            loading={signingOut}
            onPress={() => void leave()}
          />
        </View>
      </Section>

      <Section title="Audio">
        <View style={styles.row}>
          <Text>Default speech speed</Text>
          <CircleChoice
            label="Default speech speed"
            options={SPEECH_RATES.map((rate) => ({
              value: rate,
              label: rateLabel(rate),
              accessibilityLabel: `${rate} times speed`,
            }))}
            value={settings.speechRate}
            onChange={settings.setSpeechRate}
          />
        </View>
        <SwitchRow
          label="Read column names"
          description="Say each column’s name before its value."
          value={settings.readColumnNames}
          onChange={settings.setReadColumnNames}
        />
        <SwitchRow
          label="Audio feedback"
          description="Speak progress and confirm with haptics while converting."
          value={settings.audioFeedback}
          onChange={settings.setAudioFeedback}
        />
      </Section>

      <Section title="Data">
        <View style={styles.row}>
          <Text variant="callout" tone="secondary">
            Delete every saved conversion from your account.
          </Text>
          <Button
            label="Clear history"
            variant="danger"
            size="medium"
            loading={clearing}
            onPress={() => void clearHistory()}
          />
        </View>
      </Section>

      <Section title="About">
        <View style={[styles.row, styles.about]}>
          <Scallop size={56} color={palette.blueDeep} petals={9}>
            <Mark size={24} />
          </Scallop>
          <View style={styles.aboutCopy}>
            <Text variant="headline">COVERT {version}</Text>
            <Text variant="footnote" tone="secondary">
              Capture · OCR · Validate · Extract · Read · Tabulate
            </Text>
          </View>
        </View>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text variant="eyebrow" tone="secondary" accessibilityRole="header">
        {title}
      </Text>
      <View
        style={[styles.card, colors.increased && { borderWidth: 1, borderColor: colors.border }]}>
        {Children.toArray(children).map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            ) : null}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingTop: space.xs },
  section: { gap: space.sm },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  row: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm },
  divider: { height: StyleSheet.hairlineWidth * 2, marginHorizontal: space.lg },
  about: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  aboutCopy: { flex: 1, gap: 2 },
});
