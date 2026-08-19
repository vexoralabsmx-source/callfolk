import type { PropsWithChildren } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/AmbientBackground';

export function StandalonePanel({ children, edges = ['top', 'bottom'], wide = false }: PropsWithChildren<{ edges?: Edge[]; wide?: boolean }>) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1024;
  return (
    <View className="flex-1 bg-ink">
      <AmbientBackground />
      <SafeAreaView
        className="flex-1 overflow-hidden bg-ink"
        edges={edges}
        style={desktop ? {
          width: '100%',
          maxWidth: wide ? 1120 : 900,
          alignSelf: 'center',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(255,255,255,0.065)',
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 18 },
        } : undefined}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}
