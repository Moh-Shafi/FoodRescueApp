import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1B5E20' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'FoodRescue Map' }} />
        <Stack.Screen name="search" options={{ title: 'Search Surplus' }} />
        <Stack.Screen name="listing/[id]" options={{ title: 'Listing Detail' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
