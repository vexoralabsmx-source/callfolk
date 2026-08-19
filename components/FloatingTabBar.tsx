import { BlurView } from 'expo-blur';
import { MessageCircle, Phone, UserRound, UsersRound } from 'lucide-react-native';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { BrandMark } from '@/components/BrandMark';
import { useContactRequests } from '@/features/app-data';
import { colors } from '@/lib/theme';
import { initialsFor } from '@/lib/presentation';
import { useAuthStore } from '@/stores/auth-store';

const icons = { chats: MessageCircle, calls: Phone, contacts: UsersRound, profile: UserRound };

type FloatingTabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: { navigate: (name: string) => void };
};

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1024;
  const user = useAuthStore((store) => store.user);
  const requests = useContactRequests(user?.id);
  const requestCount = (requests.data ?? []).filter((request) => request.direction === 'incoming').length;
  if (desktop) {
    return (
      <View className="absolute bottom-0 left-0 top-0 w-[248px] border-r border-white/[0.07] bg-canvas px-4 pb-5 pt-6">
        <View className="px-2"><BrandMark compact /></View>
        <Text className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[1.4px] text-subtle">Workspace</Text>
        <View className="gap-1">
          {state.routes.map((route: { key: string; name: string }, index: number) => {
            const focused = state.index === index;
            const label = (descriptors[route.key].options.title ?? route.name) as string;
            const Icon = icons[route.name as keyof typeof icons];
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                onPress={() => navigation.navigate(route.name)}
                className={`h-12 flex-row items-center rounded-[15px] px-3 active:bg-white/[0.07] ${focused ? 'bg-white/[0.075]' : ''}`}
              >
                <Icon size={20} color={focused ? colors.accentSoft : colors.muted} strokeWidth={focused ? 2.3 : 2} />
                <Text className={`ml-3 text-[14px] font-semibold ${focused ? 'text-primary' : 'text-secondary'}`}>{label}</Text>
                {route.name === 'contacts' && requestCount ? <View className="ml-auto min-w-[20px] items-center rounded-full bg-accent px-1.5 py-0.5"><Text className="text-[10px] font-bold text-white">{requestCount}</Text></View> : focused ? <View className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" /> : null}
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => navigation.navigate('profile')} className="mt-auto flex-row items-center rounded-[18px] border border-white/[0.07] bg-surface p-3 active:bg-elevated">
          <Avatar initials={initialsFor(user?.displayName ?? 'Callfolk')} size={38} />
          <View className="ml-3 flex-1">
            <Text numberOfLines={1} className="text-[13px] font-semibold text-primary">{user?.displayName ?? 'Account'}</Text>
            <Text numberOfLines={1} className="mt-0.5 text-[11px] text-subtle">{user?.username ? `@${user.username}` : 'View profile'}</Text>
          </View>
        </Pressable>
      </View>
    );
  }
  return (
    <View className="absolute bottom-0 left-0 right-0 items-center px-4" style={{ paddingBottom: Math.max(insets.bottom, 12), pointerEvents: 'box-none' }}>
      <BlurView
        intensity={70}
        tint="dark"
        className="h-[74px] w-full overflow-hidden rounded-[27px] border border-white/[0.11] bg-elevated/80"
        style={{ maxWidth: desktop ? 520 : undefined, shadowColor: '#000', shadowOpacity: 0.38, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } }}
      >
        <View className="flex-1 flex-row items-center px-2">
          {state.routes.map((route: { key: string; name: string }, index: number) => {
            const focused = state.index === index;
            const label = (descriptors[route.key].options.title ?? route.name) as string;
            const Icon = icons[route.name as keyof typeof icons];
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                onPress={() => navigation.navigate(route.name)}
                className={`h-14 flex-1 items-center justify-center rounded-[20px] active:bg-white/[0.07] ${focused ? 'bg-white/[0.045]' : ''}`}
              >
                <Icon size={21} color={focused ? colors.text : colors.subtle} strokeWidth={focused ? 2.4 : 2} />
                <Text className={`mt-1 text-[11px] font-medium ${focused ? 'text-primary' : 'text-subtle'}`}>{label}</Text>
                {route.name === 'contacts' && requestCount ? <View className="absolute right-4 top-1 min-w-[18px] items-center rounded-full bg-accent px-1 py-0.5"><Text className="text-[9px] font-bold text-white">{requestCount}</Text></View> : null}
                {focused ? <View className="absolute bottom-0 h-[3px] w-6 rounded-full bg-accent" /> : null}
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
