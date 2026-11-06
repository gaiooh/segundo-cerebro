import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { IconButton, TextField } from '@/components';
import { useTheme } from '@/theme';

type ChatComposerProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: theme.radius.xl,
          paddingLeft: spacing.lg,
          paddingRight: 6,
        },
      ]}>
      <TextField
        value={text}
        onChangeText={setText}
        placeholder="Faça uma pergunta"
        multiline
        {...webSingleRow}
        onSubmitEditing={submit}
        submitBehavior="submit"
        returnKeyType="send"
        accessibilityLabel="Mensagem para o assistente"
        style={styles.input}
      />
      <IconButton
        icon="arrowUp"
        size={38}
        variant={canSend ? 'accent' : 'plain'}
        disabled={!canSend}
        onPress={submit}
        accessibilityLabel="Enviar"
        color={canSend ? colors.onAccent : colors.textTertiary}
        style={styles.send}
      />
    </View>
  );
}

// Web renders multiline inputs as a 2-row textarea; start at one row like native.
const webSingleRow = Platform.OS === 'web' ? ({ rows: 1 } as object) : {};

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: StyleSheet.hairlineWidth, minHeight: 52 },
  input: { flex: 1, maxHeight: 120, paddingTop: 15, paddingBottom: 14 },
  send: { marginBottom: 7 },
});
