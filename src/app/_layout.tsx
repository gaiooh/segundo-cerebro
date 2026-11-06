import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Root layout: the single entry point for navigation.
 * Global providers (theme, data store, etc.) will wrap the <Stack /> here
 * as features are added.
 */
export default function RootLayout() {
  return (
    <>
      <Stack />
      <StatusBar style="auto" />
    </>
  );
}
