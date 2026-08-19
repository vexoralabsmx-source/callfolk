import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, Text } from 'react-native';
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
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema), defaultValues: { email: '', password: '' },
  });
  const onSubmit = handleSubmit(async (values) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) { setError('email', { message: error.message }); return; }
    }
    await signInDemo();
    router.replace('/(tabs)/chats');
  });

  return (
    <AuthShell title="Welcome back" subtitle="Sign in with your email. No phone number, ever.">
      <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Email" placeholder="you@example.com" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Password" placeholder="Your password" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secure />
      )} />
      <Pressable accessibilityRole="button" onPress={() => undefined} className="self-end p-2"><Text className="font-medium text-accent">Forgot password?</Text></Pressable>
      <Pressable disabled={isSubmitting} onPress={onSubmit} className="mt-5 h-16 items-center justify-center rounded-[20px] bg-accent active:opacity-80 disabled:opacity-50">
        {isSubmitting ? <ActivityIndicator color={colors.text} /> : <Text className="text-[17px] font-semibold text-white">Sign in</Text>}
      </Pressable>
      {!isSupabaseConfigured ? <Text className="mt-4 text-center text-xs text-subtle">Demo mode · any valid email and password will work</Text> : null}
    </AuthShell>
  );
}
