import '../global.css';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { registerDeviceForPush } from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth-store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
});

if (Platform.OS === 'web') {
  (StyleSheet as typeof StyleSheet & { setFlag?: (name: string, value: string) => void }).setFlag?.('darkMode', 'class');
}

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    hydrate();
    let pendingHydration: ReturnType<typeof setTimeout> | undefined;
    const { data } = supabase.auth.onAuthStateChange(() => {
      if (pendingHydration) clearTimeout(pendingHydration);
      pendingHydration = setTimeout(() => { void hydrate(); }, 0);
    });
    return () => {
      if (pendingHydration) clearTimeout(pendingHydration);
      data.subscription.unsubscribe();
    };
  }, [hydrate]);

  useEffect(() => {
    if (user) registerDeviceForPush(user.id).catch(() => undefined);
  }, [user]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink }, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="call/[id]" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
            <Stack.Screen name="contact/add" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
