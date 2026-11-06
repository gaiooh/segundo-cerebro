import { forwardRef } from 'react';
import { Platform, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

type TextFieldProps = TextInputProps & {
  variant?: 'body' | 'callout' | 'title';
};

/** Unstyled-looking themed input: typography and colors come from the theme. */
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { variant = 'body', style, ...rest },
  ref,
) {
  const theme = useTheme();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={theme.colors.textTertiary}
      selectionColor={theme.colors.accent}
      cursorColor={theme.colors.accent}
      {...rest}
      style={[
        theme.typography[variant],
        { color: theme.colors.text },
        // Removes the default focus ring on web; focus is shown by the container.
        Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
        style,
      ]}
    />
  );
});
