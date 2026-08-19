import { ScrollView, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Bell, ChevronRight, CircleUserRound, EyeOff, LogOut, Palette, Shield, Share2 } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

const settings = [
  { icon: Shield, label: 'Privacy' },
  { icon: Bell, label: 'Notifications' },
  { icon: EyeOff, label: 'Blocked users' },
  { icon: Palette, label: 'Appearance' },
  { icon: CircleUserRound, label: 'Account' },
];

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const name = user?.displayName ?? 'Mike Evans';
  const username = user?.username ?? 'mike';
  const contactId = user?.contactId ?? 'MKE-7K82-A91';
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2);

  const handleSignOut = async () => { await signOut(); router.replace('/'); };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text className="mb-8 mt-5 text-[34px] font-semibold tracking-[-1px] text-primary">Profile</Text>
        <View className="items-center rounded-[28px] border border-white/[0.07] bg-surface px-5 py-7">
          <Avatar initials={initials} size={84} />
          <Text className="mt-4 text-[24px] font-semibold text-primary">{name}</Text>
          <Text className="mt-1 text-[15px] text-secondary">@{username}</Text>
          <View className="mt-5 rounded-[22px] bg-white p-3">
            <QRCode value={`callfolk://contact/${contactId}`} size={132} color={colors.ink} backgroundColor="#FFFFFF" />
          </View>
          <View className="mt-4 rounded-full border border-white/[0.08] bg-elevated px-4 py-2">
            <Text selectable className="text-[13px] font-semibold tracking-[1.5px] text-primary">{contactId}</Text>
          </View>
          <View className="mt-6 w-full flex-row gap-3">
            <Pressable className="h-12 flex-1 flex-row items-center justify-center rounded-2xl bg-elevated active:opacity-60"><Share2 size={18} color={colors.text} /><Text className="ml-2 font-semibold text-primary">Share</Text></Pressable>
            <Pressable className="h-12 flex-1 items-center justify-center rounded-2xl bg-primary active:opacity-80"><Text className="font-semibold text-ink">Edit profile</Text></Pressable>
          </View>
        </View>
        <View className="mt-6 overflow-hidden rounded-[24px] border border-white/[0.06] bg-surface px-2">
          {settings.map(({ icon: Icon, label }, index) => (
            <Pressable key={label} className={`h-15 min-h-[60px] flex-row items-center px-3 active:bg-white/[0.04] ${index < settings.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-elevated"><Icon size={18} color={colors.muted} /></View>
              <Text className="ml-3 flex-1 text-[15px] font-medium text-primary">{label}</Text>
              <ChevronRight size={18} color={colors.subtle} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={handleSignOut} className="mt-4 h-14 flex-row items-center justify-center rounded-[18px] active:bg-danger/10"><LogOut size={19} color={colors.danger} /><Text className="ml-2 font-semibold text-danger">Sign out</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}
