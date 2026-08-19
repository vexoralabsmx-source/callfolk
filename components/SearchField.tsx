import { Search, X } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import { colors } from '@/lib/theme';

type Props = {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, placeholder = 'Search' }: Props) {
  return (
    <View className="h-14 flex-row items-center rounded-[18px] border border-white/[0.06] bg-surface px-4">
      <Search size={20} color={colors.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        selectionColor={colors.accent}
        className="ml-3 flex-1 text-[16px] text-primary"
        autoCapitalize="none"
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText?.('')} className="p-2">
          <X size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
