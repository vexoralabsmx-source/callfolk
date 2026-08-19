import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/lib/theme';

type Props = TextInputProps & { label: string; error?: string; secure?: boolean };

export function FormField({ label, error, secure, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="mb-2 ml-1 text-[13px] font-medium text-secondary">{label}</Text>
      <View className={`h-14 flex-row items-center rounded-[18px] border bg-surface px-4 ${error ? 'border-danger/60' : 'border-white/[0.07]'}`}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          secureTextEntry={secure && !visible}
          placeholderTextColor={colors.subtle}
          selectionColor={colors.accent}
          className="flex-1 text-[16px] text-primary"
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((value) => !value)}
            className="h-11 w-11 items-center justify-center"
          >
            {visible ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="mt-2 ml-1 text-[13px] text-danger">{error}</Text> : null}
    </View>
  );
}
