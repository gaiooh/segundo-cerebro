import { StyleSheet, View } from 'react-native';

import { FadeIn, Icon, PressableScale, Text } from '@/components';
import { useTheme } from '@/theme';

type SuggestionsProps = {
  questions: string[];
  onPick: (question: string) => void;
};

/** Quiet list of starter questions. */
export function Suggestions({ questions, onPick }: SuggestionsProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  return (
    <View>
      {questions.map((question, index) => (
        <FadeIn key={question} delay={120 + index * 60}>
          <PressableScale
            onPress={() => onPick(question)}
            accessibilityRole="button"
            pressedScale={0.985}
            style={[
              styles.row,
              {
                paddingVertical: spacing.md,
                gap: spacing.md,
                borderTopColor: colors.separator,
                borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth * 2,
              },
            ]}>
            <Text variant="callout" color="secondary" style={styles.flex}>
              {question}
            </Text>
            <Icon name="arrowUp" size={16} color={colors.textTertiary} />
          </PressableScale>
        </FadeIn>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
