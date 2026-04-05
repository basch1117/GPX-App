import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { runMigrations } from '@/src/db/migrations';

SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 40, paddingTop: 80, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 12 }}>
            App Error — please screenshot and send to developer
          </Text>
          <ScrollView>
            <Text style={{ fontSize: 12, color: '#333' }}>
              {String(this.state.error)}
              {'\n\n'}
              {(this.state.error as any).stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
