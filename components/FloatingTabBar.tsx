import { BlurView } from 'expo-blur';
import { MessageCircle, Phone, UserRound, UsersRound } from 'lucide-react-native';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

const icons = { chats: MessageCircle, calls: Phone, contacts: UsersRound, profile: UserRound };

type FloatingTabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: { navigate: (name: string) => void };
};

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 768;
  return (
    <View pointerEvents="box-none" className="absolute bottom-0 left-0 right-0 items-center px-4" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
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
                {focused ? <View className="absolute bottom-0 h-[3px] w-6 rounded-full bg-accent" /> : null}
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
