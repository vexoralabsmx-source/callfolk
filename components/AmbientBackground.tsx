import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

export function AmbientBackground() {
  return (
    <View className="absolute inset-0 overflow-hidden bg-ink" style={{ pointerEvents: 'none' }}>
      <LinearGradient
        colors={['rgba(117,108,255,0.30)', 'rgba(117,108,255,0.03)', 'transparent']}
        className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full"
      />
      <LinearGradient
        colors={['rgba(82,217,138,0.10)', 'transparent']}
        className="absolute -bottom-48 -left-40 h-[480px] w-[480px] rounded-full"
      />
      <View className="absolute inset-0 opacity-[0.18]" style={{ backgroundColor: 'rgba(255,255,255,0.008)' }} />
    </View>
  );
}
