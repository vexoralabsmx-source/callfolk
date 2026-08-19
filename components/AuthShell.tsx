import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BrandMark } from '@/components/BrandMark';

export function AuthShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 768;
  return (
    <View className="flex-1 bg-ink">
      <AmbientBackground />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: desktop ? 'center' : 'flex-start', paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            <View
              className={desktop ? 'w-full rounded-[32px] border border-white/[0.08] bg-surface/95 p-9' : 'w-full'}
              style={desktop ? { maxWidth: 520, shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 36, shadowOffset: { width: 0, height: 18 } } : undefined}
            >
              <View className="mt-2 flex-row items-center justify-between">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={() => router.back()}
                  className="h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-elevated active:opacity-60"
                >
                  <ArrowLeft size={21} color={colors.text} />
                </Pressable>
                {desktop ? <BrandMark compact /> : null}
              </View>
              <View className="mt-10 mb-9">
                <Text className="text-[38px] font-semibold tracking-[-1.4px] text-primary">{title}</Text>
                <Text className="mt-3 max-w-[390px] text-[16px] leading-6 text-secondary">{subtitle}</Text>
              </View>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
