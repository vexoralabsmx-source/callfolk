import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
});

export async function registerDeviceForPush(userId: string) {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!Device.isDevice || !projectId || !isSupabaseConfigured) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('calls', {
      name: 'Incoming calls',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { error } = await supabase.from('devices').upsert(
    { user_id: userId, expo_push_token: token, platform: Platform.OS, last_active_at: new Date().toISOString() },
    { onConflict: 'expo_push_token' },
  );
  if (error) throw error;
  return token;
}
