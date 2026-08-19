import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '@/lib/theme';

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8 pb-24">
      <View className="mb-5 h-16 w-16 items-center justify-center rounded-3xl bg-elevated">
        <Icon color={colors.accent} size={28} />
      </View>
      <Text className="text-center text-xl font-semibold text-primary">{title}</Text>
      <Text className="mt-2 text-center text-[15px] leading-6 text-secondary">{body}</Text>
    </View>
  );
}
