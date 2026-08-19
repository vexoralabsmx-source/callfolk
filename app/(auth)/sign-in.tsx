import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { z } from 'zod';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

const schema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(8, 'Enter your password') });
type Values = z.infer<typeof schema>;

export default function SignInScreen() {
  const signInDemo = useAuthStore((state) => state.signInDemo);
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema), defaultValues: { email: '', password: '' },
  });
  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) { setServerError(error.message); return; }
    }
    await signInDemo();
    router.replace('/(tabs)/chats');
  });

  const continueLocally = async () => {
    setServerError(null);
    await signInDemo();
    router.replace('/(tabs)/chats');
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in with your email. No phone number, ever.">
      <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Email" placeholder="you@example.com" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Password" placeholder="Your password" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secure />
      )} />
      {serverError ? (
        <View className="mt-3 rounded-2xl border border-danger/25 bg-danger/10 p-4">
          <Text className="text-sm leading-5 text-danger">{serverError}</Text>
          {__DEV__ ? (
            <Pressable accessibilityRole="button" onPress={continueLocally} className="mt-3 h-12 items-center justify-center rounded-xl bg-white/[0.08] active:opacity-70">
              <Text className="font-semibold text-primary">Continue in demo mode</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => undefined} className="self-end p-2"><Text className="font-medium text-accent">Forgot password?</Text></Pressable>
      <Pressable disabled={isSubmitting} onPress={onSubmit} className="mt-5 h-16 items-center justify-center rounded-[20px] bg-accent active:opacity-80 disabled:opacity-50">
        {isSubmitting ? <ActivityIndicator color={colors.text} /> : <Text className="text-[17px] font-semibold text-white">Sign in</Text>}
      </Pressable>
      {!isSupabaseConfigured ? <Text className="mt-4 text-center text-xs text-subtle">Demo mode · any valid email and password will work</Text> : null}
    </AuthShell>
  );
}
