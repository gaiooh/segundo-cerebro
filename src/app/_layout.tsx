import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader/400Regular_Italic';
import { Newsreader_500Medium } from '@expo-google-fonts/newsreader/500Medium';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { CategoriesProvider } from '@/features/categories';
import { PreferencesProvider, usePreferences } from '@/features/settings';
import { ThemeProvider, useTheme } from '@/theme';

/**
 * Root layout: loads fonts and composes global providers
 * (preferences → theme → data) around the navigator.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Newsreader_500Medium,
    Newsreader_400Regular_Italic,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <PreferencesProvider>
      <ThemedApp />
    </PreferencesProvider>
  );
}

function ThemedApp() {
  const { preferences, ready } = usePreferences();
  if (!ready) return null;
  return (
    <ThemeProvider mode={preferences.themeMode} accent={preferences.accent}>
      <CategoriesProvider>
        <Navigator />
      </CategoriesProvider>
    </ThemeProvider>
  );
}

function Navigator() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="folder/[id]" />
      </Stack>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}
