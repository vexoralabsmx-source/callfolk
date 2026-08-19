import type { PropsWithChildren } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/AmbientBackground';

export function Screen({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 768;
  return (
    <View className="flex-1 bg-ink">
      <AmbientBackground />
      <SafeAreaView
        className="flex-1 overflow-hidden bg-ink"
        edges={['top']}
        style={desktop ? {
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(255,255,255,0.065)',
          shadowColor: '#000',
          shadowOpacity: 0.55,
          shadowRadius: 38,
          shadowOffset: { width: 0, height: 18 },
        } : undefined}
      >
        <View className="flex-1 px-5">{children}</View>
      </SafeAreaView>
    </View>
  );
}
