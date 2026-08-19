import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, CheckCheck, LockKeyhole, MessageCircle, Mic, Phone, ShieldCheck, Wifi, Zap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Avatar } from '@/components/Avatar';
import { BrandMark } from '@/components/BrandMark';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function WelcomeScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 900;
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(translateY, { toValue: 0, damping: 20, stiffness: 110, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [opacity, translateY]);

  useEffect(() => {
    if (hydrated && user) router.replace('/(tabs)/chats');
  }, [hydrated, user]);

  return (
    <View className="flex-1 bg-ink">
      <AmbientBackground />
      <SafeAreaView className="flex-1">
        <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
          {desktop ? <DesktopWelcome /> : <MobileWelcome />}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function DesktopWelcome() {
  return (
    <View className="flex-1 self-center px-12" style={{ width: '100%', maxWidth: 1320 }}>
      <View className="h-24 flex-row items-center justify-between">
        <BrandMark compact />
        <View className="flex-row items-center rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5">
          <ShieldCheck size={15} color={colors.success} />
          <Text className="ml-2 text-[12px] font-semibold uppercase tracking-[1.4px] text-secondary">Private by default</Text>
        </View>
      </View>

      <View className="flex-1 flex-row items-center gap-16 pb-8">
        <View className="flex-1 py-10">
          <Text className="max-w-[620px] text-[72px] font-semibold leading-[75px] tracking-[-3.8px] text-primary">
            Your people.{"\n"}<Text className="text-accent-soft">One tap away.</Text>
          </Text>
          <Text className="mt-7 max-w-[530px] text-[19px] leading-8 text-secondary">
            Messages and crystal-clear internet calls, built around your identity — not your phone number.
          </Text>

          <View className="mt-8 flex-row flex-wrap gap-3">
            <FeaturePill icon={LockKeyhole} label="No phone number" />
            <FeaturePill icon={Zap} label="Instant setup" />
            <FeaturePill icon={Wifi} label="Wi-Fi or data" />
          </View>

          <View className="mt-11 flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/sign-up')}
              className="h-16 flex-row items-center rounded-[20px] bg-primary px-7 active:opacity-80"
              style={{ shadowColor: '#FFFFFF', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } }}
            >
              <Text className="text-[16px] font-semibold text-ink">Create your identity</Text>
              <ArrowRight className="ml-5" size={19} color={colors.ink} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/sign-in')} className="h-16 justify-center rounded-[20px] px-6 active:bg-white/[0.05]">
              <Text className="text-[16px] font-semibold text-secondary">Sign in</Text>
            </Pressable>
          </View>

        </View>

        <View className="w-[430px] items-center justify-center">
          <PhonePreview />
        </View>
      </View>
    </View>
  );
}

function MobileWelcome() {
  return (
    <View className="flex-1 px-5 pb-3">
      <View className="h-20 flex-row items-center justify-between">
        <BrandMark compact />
        <View className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2">
          <Text className="text-[10px] font-semibold uppercase tracking-[1.3px] text-secondary">Private beta</Text>
        </View>
      </View>

      <View className="flex-1 justify-center pb-4">
        <Text className="text-[51px] font-semibold leading-[54px] tracking-[-2.4px] text-primary">Talk freely.{"\n"}<Text className="text-accent-soft">Stay close.</Text></Text>
        <Text className="mt-5 max-w-[345px] text-[17px] leading-7 text-secondary">Private messages and clear internet calls, built around your identity.</Text>

        <View className="mt-8 flex-row gap-2.5">
          <MiniFeature icon={LockKeyhole} label="Private" />
          <MiniFeature icon={Zap} label="Instant" />
          <MiniFeature icon={Wifi} label="Anywhere" />
        </View>
      </View>

      <View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(auth)/sign-up')}
          className="h-16 flex-row items-center justify-between rounded-[21px] bg-primary px-6 active:opacity-80"
        >
          <Text className="text-[17px] font-semibold text-ink">Create account</Text>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-ink"><ArrowRight size={18} color={colors.text} /></View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/sign-in')} className="mt-2 h-14 items-center justify-center rounded-[18px] active:bg-white/[0.05]">
          <Text className="text-[15px] font-semibold text-secondary">I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PhonePreview() {
  return (
    <View
      className="h-[690px] w-[374px] overflow-hidden rounded-[48px] border border-white/[0.13] bg-canvas p-3"
      style={{ shadowColor: '#756CFF', shadowOpacity: 0.2, shadowRadius: 48, shadowOffset: { width: 0, height: 24 } }}
    >
      <LinearGradient colors={['rgba(117,108,255,0.19)', 'transparent']} className="absolute inset-x-0 top-0 h-64" />
      <View className="mb-2 h-6 items-center"><View className="h-6 w-24 rounded-full bg-black" /></View>
      <View className="flex-1 rounded-[37px] border border-white/[0.055] bg-ink px-5 pt-5">
        <View className="flex-row items-center justify-between">
          <View><Text className="text-[11px] uppercase tracking-[1.4px] text-subtle">Account secure</Text><Text className="mt-1 text-[22px] font-semibold text-primary">Ready</Text></View>
          <Avatar initials="CF" color="#756CFF" online size={44} />
        </View>
        <Text className="mt-7 text-[30px] font-semibold tracking-[-1px] text-primary">Messages</Text>

        <View className="mt-5 flex-row items-center rounded-[18px] border border-white/[0.06] bg-white/[0.045] px-4 py-3.5">
          <MessageCircle size={17} color={colors.subtle} /><Text className="ml-3 text-[13px] text-subtle">Search conversations</Text>
        </View>

        <View className="mt-6 flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/15"><MessageCircle size={20} color={colors.accentSoft} /></View>
          <View className="ml-3.5 flex-1"><Text className="text-[15px] font-semibold text-primary">Private messaging</Text><Text className="mt-1 text-[12px] text-secondary">Real-time encrypted channels</Text></View>
        </View>

        <View className="mt-7 rounded-[24px] border border-accent/20 bg-accent/10 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center"><View className="h-10 w-10 items-center justify-center rounded-full bg-accent/20"><Phone size={17} color={colors.accentSoft} /></View><View className="ml-3"><Text className="text-[13px] font-semibold text-primary">Internet calls</Text><Text className="mt-0.5 text-[11px] text-success">Secure connection</Text></View></View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-success"><Phone size={17} color={colors.ink} /></View>
          </View>
          <View className="mt-4 h-9 flex-row items-center justify-center gap-1 overflow-hidden rounded-xl bg-black/20">
            {[10, 20, 13, 25, 17, 30, 16, 23, 11, 18, 9].map((height, index) => <View key={index} className="w-[3px] rounded-full bg-accent-soft" style={{ height }} />)}
          </View>
        </View>

        <View className="mt-auto mb-5 flex-row items-center rounded-[20px] border border-white/[0.07] bg-surface p-2">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05]"><Mic size={18} color={colors.muted} /></View>
          <Text className="ml-3 flex-1 text-[13px] text-subtle">Type a message…</Text>
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent"><CheckCheck size={18} color="#fff" /></View>
        </View>
      </View>
    </View>
  );
}

function FeaturePill({ icon: Icon, label }: { icon: typeof LockKeyhole; label: string }) {
  return <View className="flex-row items-center rounded-full border border-white/[0.075] bg-white/[0.035] px-4 py-3"><Icon size={15} color={colors.muted} /><Text className="ml-2 text-[13px] font-medium text-secondary">{label}</Text></View>;
}

function MiniFeature({ icon: Icon, label }: { icon: typeof LockKeyhole; label: string }) {
  return <View className="flex-1 items-center rounded-[18px] border border-white/[0.065] bg-white/[0.03] py-4"><Icon size={18} color={colors.accentSoft} /><Text className="mt-2 text-[11px] font-semibold text-secondary">{label}</Text></View>;
}
