import { SQLiteProvider } from 'expo-sqlite';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { runMigrations } from '@/src/db/migrations';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SQLiteProvider
      databaseName="traillog.db"
      onInit={async (db) => {
        try {
          await runMigrations(db);
        } catch (e) {
          console.error('Migration failed:', e);
        }
      }}
    >
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SQLiteProvider>
  );
}
