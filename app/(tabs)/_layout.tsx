import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (hydrated && !user) router.replace('/(auth)/sign-in');
  }, [hydrated, user]);

  if (!hydrated || !user) return <View className="flex-1 items-center justify-center bg-ink"><ActivityIndicator color={colors.accent} /></View>;

  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#08090B' } }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="calls" options={{ title: 'Calls' }} />
      <Tabs.Screen name="contacts" options={{ title: 'Contacts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
