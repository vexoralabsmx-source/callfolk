import { Text, View } from 'react-native';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const size = compact ? 38 : 48;
  return (
    <View className="flex-row items-center">
      <View
        className="items-center justify-center bg-accent"
        style={{ width: size, height: size, borderRadius: compact ? 14 : 17, shadowColor: '#756CFF', shadowOpacity: 0.42, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }}
      >
        <View className="h-[15px] w-[22px] rounded-full border-2 border-white" />
        <View className="absolute h-[7px] w-[7px] rotate-45 bg-white" style={{ right: compact ? 7 : 9, bottom: compact ? 8 : 10 }} />
      </View>
      <Text className={`${compact ? 'ml-3 text-[18px]' : 'ml-3.5 text-[21px]'} font-semibold tracking-[-0.6px] text-primary`}>callfolk</Text>
    </View>
  );
}
