import { Stack } from 'expo-router';

export default function LogbookLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#2D6A4F',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F5F5F5' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'TrailLog' }} />
      <Stack.Screen name="[id]" options={{ title: 'Entry Detail' }} />
    </Stack>
  );
}
