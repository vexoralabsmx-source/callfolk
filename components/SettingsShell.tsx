import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { StandalonePanel } from '@/components/StandalonePanel';
import { colors } from '@/lib/theme';

export function SettingsShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <StandalonePanel>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>
        <View className="mb-7 mt-2 flex-row items-center">
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} className="h-12 w-12 items-center justify-center rounded-2xl bg-surface active:opacity-70">
            <ArrowLeft size={21} color={colors.text} />
          </Pressable>
          <View className="ml-4 flex-1"><Text className="text-[26px] font-semibold tracking-[-0.5px] text-primary">{title}</Text>{subtitle ? <Text className="mt-1 text-[13px] leading-5 text-secondary">{subtitle}</Text> : null}</View>
        </View>
        {children}
      </ScrollView>
    </StandalonePanel>
  );
}
