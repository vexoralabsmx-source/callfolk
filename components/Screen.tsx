import type { PropsWithChildren } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/AmbientBackground';

export function Screen({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1024;
  return (
    <View className="flex-1 bg-ink">
      {!desktop ? <AmbientBackground /> : null}
      <SafeAreaView
        className="flex-1 overflow-hidden bg-ink"
        edges={['top']}
        style={desktop ? {
          marginLeft: 248,
          borderLeftWidth: 1,
          borderColor: 'rgba(255,255,255,0.065)',
        } : undefined}
      >
        <View className={desktop ? 'flex-1' : 'flex-1 px-5'}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
