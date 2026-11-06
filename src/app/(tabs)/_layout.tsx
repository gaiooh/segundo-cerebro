import { Tabs } from 'expo-router';

import { TabBar, type TabMeta } from '@/components/TabBar';
import { useTheme } from '@/theme';

// Open the app on the capture screen: it is the main interaction.
export const unstable_settings = { initialRouteName: 'index' };

const meta: Record<string, TabMeta> = {
  categories: { label: 'Categorias', icon: 'folder' },
  links: { label: 'Ligações', icon: 'links' },
  index: { label: 'Falar', icon: 'mic', primary: true },
  assistant: { label: 'Assistente', icon: 'sparkle' },
  settings: { label: 'Ajustes', icon: 'settings' },
};

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} meta={meta} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        animation: 'fade',
      }}>
      <Tabs.Screen name="categories" options={{ title: 'Categorias' }} />
      <Tabs.Screen name="links" options={{ title: 'Ligações' }} />
      <Tabs.Screen name="index" options={{ title: 'Falar' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Assistente' }} />
      <Tabs.Screen name="settings" options={{ title: 'Configurações' }} />
    </Tabs>
  );
}
