import { View, Text } from 'react-native';

type Props = {
  initials: string;
  color?: string;
  size?: number;
  online?: boolean;
};

export function Avatar({ initials, color = '#6C63FF', size = 48, online }: Props) {
  return (
    <View className="relative" style={{ width: size, height: size }}>
      <View
        className="items-center justify-center overflow-hidden"
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
      >
        <View className="absolute inset-0 bg-white/10" />
        <Text className="font-semibold text-white" style={{ fontSize: size * 0.32 }}>
          {initials}
        </Text>
      </View>
      {online ? (
        <View
          className="absolute bottom-0 right-0 rounded-full border-[3px] border-ink bg-success"
          style={{ width: Math.max(14, size * 0.28), height: Math.max(14, size * 0.28) }}
        />
      ) : null}
    </View>
  );
}
