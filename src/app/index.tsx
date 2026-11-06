import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Initial route ("/"). Intentionally minimal: it only exists so the
 * navigator has a screen to render. Real screens come in a later stage.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Segundo Cérebro' }} />
      <Text>Segundo Cérebro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
