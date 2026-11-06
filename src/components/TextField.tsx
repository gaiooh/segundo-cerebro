import { forwardRef, useState } from 'react';
import { Platform, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

type TextFieldProps = TextInputProps & {
  variant?: 'body' | 'callout' | 'title';
  /** Multiline only: grow with the content instead of scrolling inside the field. */
  autoGrow?: boolean;
};

/** Unstyled-looking themed input: typography and colors come from the theme. */
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { variant = 'body', autoGrow = false, style, onContentSizeChange, ...rest },
  ref,
) {
  const theme = useTheme();
  const [height, setHeight] = useState<number | undefined>(undefined);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={theme.colors.textTertiary}
      selectionColor={theme.colors.accent}
      cursorColor={theme.colors.accent}
      {...rest}
      onContentSizeChange={(event) => {
        if (autoGrow) setHeight(Math.ceil(event.nativeEvent.contentSize.height));
        onContentSizeChange?.(event);
      }}
      style={[
        theme.typography[variant],
        { color: theme.colors.text },
        // Removes the default focus ring on web; focus is shown by the container.
        Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
        style,
        // Web: the browser sizes the textarea itself (measured heights never shrink there).
        autoGrow ? (Platform.OS === 'web' ? ({ fieldSizing: 'content' } as object) : height ? { height } : null) : null,
      ]}
    />
  );
});
