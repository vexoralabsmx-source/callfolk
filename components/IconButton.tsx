import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { colors } from '@/lib/theme';

type Props = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  size?: number;
  variant?: 'surface' | 'accent' | 'danger' | 'ghost';
  active?: boolean;
};

export function IconButton({ icon: Icon, label, onPress, size = 20, variant = 'surface', active }: Props) {
  const backgroundColor =
    variant === 'accent' ? colors.accent : variant === 'danger' ? colors.danger : variant === 'ghost' ? 'transparent' : colors.elevated;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-12 w-12 items-center justify-center rounded-2xl active:opacity-60"
      style={{ backgroundColor: active ? 'rgba(108,99,255,0.18)' : backgroundColor }}
      hitSlop={4}
    >
      <Icon size={size} color={active ? colors.accent : colors.text} strokeWidth={2} />
    </Pressable>
  );
}
