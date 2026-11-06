import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useCompactLayout } from '@/hooks/useCompactLayout';

import { FadeIn, Icon, Screen, Text } from '@/components';
import {
  CaptureOrb,
  formatDuration,
  LiveWaveform,
  ModeToggle,
  RecentCaptures,
  TextComposer,
  useCaptureSimulation,
  useRecentCaptures,
  type CaptureMode,
} from '@/features/voice-capture';
import { useNotes } from '@/features/notes';
import { useTheme } from '@/theme';

const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * Falar — the capture screen. Voice and text share one stage: switching
 * modes swaps the central control instead of adding a second one.
 * Text captures are saved as real notes (the typed text becomes the note's
 * original). Voice recording is still a visual simulation in this stage.
 */
export default function SpeakScreen() {
  const theme = useTheme();
  const { spacing } = theme;
  const compact = useCompactLayout();
  const [mode, setMode] = useState<CaptureMode>('voice');
  const [draft, setDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const { recents, addSimulated } = useRecentCaptures();
  const { create } = useNotes();
  const [saveError, setSaveError] = useState<string | null>(null);

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const capture = useCaptureSimulation((duration) => {
    addSimulated({ title: `Gravação de ${formatDuration(duration)}`, source: 'voice' });
    flashSaved();
  });

  const busy = capture.status !== 'idle';

  const sendText = async () => {
    if (!draft.trim()) return;
    setSaveError(null);
    try {
      // Saved exactly as typed: the original is never trimmed or reformatted.
      await create({ text: draft, source: 'text' });
      setDraft('');
      Keyboard.dismiss();
      flashSaved();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar.');
    }
  };

  const switchMode = (next: CaptureMode) => {
    if (next === 'voice') Keyboard.dismiss();
    setMode(next);
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Taps on empty space dismiss the keyboard (keyboardShouldPersistTaps="handled"). */}
          <View style={styles.fill}>
            <FadeIn style={{ paddingHorizontal: theme.layout.screenPadding, paddingTop: compact ? spacing.md : spacing.xl }}>
              <Text variant="overline" color="tertiary">
                {capitalize(weekday.format(new Date()))}
              </Text>
              <Text variant="display" style={{ marginTop: spacing.sm }} accessibilityRole="header">
                O que está na{'\n'}sua mente?
              </Text>
              <Text variant="prompt" color="secondary" style={{ marginTop: spacing.sm }}>
                {mode === 'voice' ? 'Fale livremente, sem filtro.' : 'Escreva livremente, sem filtro.'}
              </Text>
            </FadeIn>

            <View style={[styles.stage, { paddingHorizontal: theme.layout.screenPadding, minHeight: compact ? 230 : 300 }]}>
              {mode === 'voice' ? (
                <FadeIn key="voice" offset={10} style={styles.center}>
                  <CaptureOrb size={compact ? 96 : 132} status={capture.status} onPress={capture.status === 'recording' ? capture.stop : capture.start} />
                  <View style={[styles.status, { marginTop: spacing.sm }]}>
                    <StatusLine
                      status={capture.status}
                      elapsed={capture.elapsed}
                      levels={capture.levels}
                      saved={savedFlash}
                    />
                  </View>
                </FadeIn>
              ) : (
                <FadeIn key="text" offset={10} style={styles.composer}>
                  <TextComposer value={draft} onChange={setDraft} onSubmit={sendText} autoFocus />
                  <View style={[styles.textStatus, { marginTop: spacing.md }]}>
                    {saveError ? (
                      <Text variant="label" color="danger">
                        {saveError}
                      </Text>
                    ) : savedFlash ? (
                      <SavedLabel />
                    ) : null}
                  </View>
                </FadeIn>
              )}
            </View>

            <View style={[styles.toggleRow, { marginBottom: compact ? spacing.lg : spacing.xl }]}>
              <ModeToggle mode={mode} onChange={switchMode} disabled={busy} />
            </View>
          </View>

          <View style={{ paddingBottom: spacing.xl }}>
            <RecentCaptures items={recents} onOpen={(id) => router.push({ pathname: '/note/[id]', params: { id } })} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function StatusLine({
  status,
  elapsed,
  levels,
  saved,
}: {
  status: ReturnType<typeof useCaptureSimulation>['status'];
  elapsed: number;
  levels: number[];
  saved: boolean;
}) {
  const theme = useTheme();
  if (status === 'recording') {
    return (
      <View style={styles.center}>
        <LiveWaveform levels={levels} active />
        <Text variant="label" color="secondary" style={{ marginTop: theme.spacing.sm, fontVariant: ['tabular-nums'] }}>
          Ouvindo · {formatDuration(elapsed)}
        </Text>
      </View>
    );
  }
  if (status === 'saving') {
    return <PulsingLabel text="Guardando seu pensamento…" />;
  }
  if (saved) return <SavedLabel />;
  return (
    <Text variant="label" color="tertiary">
      Toque para começar
    </Text>
  );
}

function SavedLabel() {
  const theme = useTheme();
  return (
    <FadeIn offset={4} style={styles.savedRow}>
      <Icon name="check" size={16} color={theme.colors.accent} strokeWidth={2.2} />
      <Text variant="label" color="accent">
        Registrado
      </Text>
    </FadeIn>
  );
}

function PulsingLabel({ text }: { text: string }) {
  const opacity = useAnimatedValue(0.4);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View style={{ opacity }}>
      <Text variant="label" color="secondary">
        {text}
      </Text>
    </Animated.View>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  stage: { flex: 1, justifyContent: 'center' },
  center: { alignItems: 'center' },
  status: { height: 64, alignItems: 'center', justifyContent: 'flex-start' },
  composer: { width: '100%' },
  textStatus: { height: 20, alignItems: 'center' },
  toggleRow: { alignItems: 'center' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
