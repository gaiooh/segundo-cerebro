import { useEffect, useRef } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { IconButton, TextField } from '@/components';
import { useTheme } from '@/theme';

type TextComposerProps = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
};

/** Free-writing field for the text capture mode. */
export function TextComposer({ value, onChange, onSubmit, autoFocus }: TextComposerProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const input = useRef<TextInputInstance>(null);
  const canSend = value.trim().length > 0;

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => input.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: theme.radius.xl,
          padding: spacing.lg,
          paddingBottom: spacing.md,
        },
      ]}>
      <TextField
        ref={input}
        value={value}
        onChangeText={onChange}
        placeholder="Escreva o que estiver pensando…"
        multiline
        textAlignVertical="top"
        accessibilityLabel="Texto do registro"
        style={styles.input}
      />
      <View style={styles.footer}>
        <IconButton
          icon="arrowUp"
          variant={canSend ? 'accent' : 'tonal'}
          size={40}
          disabled={!canSend}
          onPress={onSubmit}
          accessibilityLabel="Enviar registro"
          color={canSend ? colors.onAccent : colors.textTertiary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', borderWidth: StyleSheet.hairlineWidth },
  input: { minHeight: 120, maxHeight: 220 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
});
