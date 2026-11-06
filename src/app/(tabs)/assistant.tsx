import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { FadeIn, Icon, IconButton, OptionRow, Screen, Sheet, Text } from '@/components';
import {
  ChatComposer,
  HistorySheet,
  MessageItem,
  Suggestions,
  ThinkingIndicator,
  suggestedQuestions,
  useAssistantChat,
} from '@/features/assistant';
import { useCompactLayout } from '@/hooks/useCompactLayout';
import { useTheme } from '@/theme';

export default function AssistantScreen() {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const chat = useAssistantChat();
  const compact = useCompactLayout();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const empty = chat.messages.length === 0;
  const activeTitle = chat.history.find((c) => c.id === chat.activeId)?.title;

  useEffect(() => {
    if (!empty) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
  }, [chat.messages.length, chat.thinking, empty]);

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top bar: history on the left, extra options on the right. */}
        <View style={[styles.topBar, { paddingHorizontal: spacing.md }]}>
          <IconButton
            icon="history"
            accessibilityLabel="Histórico de conversas"
            onPress={() => setHistoryOpen(true)}
            color={colors.textSecondary}
          />
          <Text variant="label" color="secondary" numberOfLines={1} style={styles.topTitle}>
            {empty ? '' : (activeTitle ?? 'Nova conversa')}
          </Text>
          <IconButton icon="more" accessibilityLabel="Mais opções" onPress={() => setMenuOpen(true)} color={colors.textSecondary} />
        </View>

        <ScrollView
          ref={scroll}
          style={styles.fill}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: theme.layout.screenPadding, paddingBottom: spacing.xl, gap: spacing.xl },
            empty && styles.contentEmpty,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {empty ? (
            <FadeIn style={styles.welcome}>
              {compact ? null : (
                <View style={[styles.mark, { backgroundColor: colors.accentSoft, marginBottom: spacing.xl }]}>
                  <Icon name="sparkle" size={26} color={colors.accent} strokeWidth={1.6} />
                </View>
              )}
              <Text variant="title" align="center">
                Converse com seu{'\n'}segundo cérebro
              </Text>
              <Text variant="callout" color="tertiary" align="center" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
                Pergunte sobre suas ideias, notas e os padrões entre elas.
              </Text>
            </FadeIn>
          ) : (
            <>
              {chat.messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
              {chat.thinking ? <ThinkingIndicator /> : null}
            </>
          )}
        </ScrollView>

        <View style={{ paddingHorizontal: theme.layout.screenPadding, paddingBottom: spacing.md }}>
          {empty ? (
            <View style={{ marginBottom: spacing.md }}>
              <Suggestions questions={suggestedQuestions} onPick={chat.send} />
            </View>
          ) : null}
          <ChatComposer onSend={chat.send} disabled={chat.thinking} />
        </View>
      </KeyboardAvoidingView>

      <HistorySheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={chat.history}
        activeId={chat.activeId}
        onOpen={chat.open}
        onNew={chat.startNew}
      />

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <OptionRow
          icon="compose"
          label="Nova conversa"
          onPress={() => {
            chat.startNew();
            setMenuOpen(false);
          }}
        />
        <OptionRow
          icon="trash"
          label="Apagar esta conversa"
          destructive
          onPress={
            empty
              ? undefined
              : () => {
                  chat.deleteActive();
                  setMenuOpen(false);
                }
          }
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', height: 52 },
  topTitle: { flex: 1, textAlign: 'center' },
  content: { flexGrow: 1, paddingTop: 8 },
  contentEmpty: { justifyContent: 'center' },
  welcome: { alignItems: 'center' },
  mark: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
