import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { z } from 'zod';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

const schema = z.object({
  displayName: z.string().trim().min(2, 'Enter at least 2 characters').max(40),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, 'Use 3–20 letters, numbers or underscores'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
});

type Values = z.infer<typeof schema>;

export default function SignUpScreen() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', username: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    if (!isSupabaseConfigured) {
      setServerError('Authentication is not configured. Add the Supabase environment variables before creating accounts.');
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { display_name: values.displayName, username: values.username } },
    });
    if (error) {
      const databaseTriggerFailed = error.message.toLowerCase().includes('database error saving new user');
      setServerError(databaseTriggerFailed
        ? 'Supabase could not create your profile. Apply migration 002_fix_profile_signup.sql to repair the database trigger.'
        : error.message);
      return;
    }
    if (!data.session) {
      setConfirmationSent(true);
      return;
    }
    await hydrate();
    router.replace('/(tabs)/chats');
  });

  if (confirmationSent) {
    return (
      <AuthShell title="Check your email" subtitle="We sent you a confirmation link. Open it to activate your Callfolk account.">
        <View className="items-center rounded-[24px] border border-success/20 bg-success/10 px-6 py-8">
          <MailCheck size={36} color={colors.success} />
          <Text className="mt-4 text-center text-[15px] leading-6 text-secondary">Once confirmed, return here and sign in with your email and password.</Text>
        </View>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')} className="mt-5 h-14 items-center justify-center rounded-[18px] bg-primary active:opacity-80">
          <Text className="font-semibold text-ink">Go to sign in</Text>
        </Pressable>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Your username is all people need to find you.">
      <Controller control={control} name="displayName" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Display name" placeholder="Your name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.displayName?.message} autoCapitalize="words" />
      )} />
      <Controller control={control} name="username" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Username" placeholder="@mike" value={value} onChangeText={(text) => onChange(text.replace('@', '').toLowerCase())} onBlur={onBlur} error={errors.username?.message} autoCapitalize="none" />
      )} />
      <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Email" placeholder="you@example.com" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Password" placeholder="At least 8 characters" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secure />
      )} />
      {serverError ? (
        <View className="mt-3 rounded-2xl border border-danger/25 bg-danger/10 p-4">
          <Text className="text-sm leading-5 text-danger">{serverError}</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSubmitting }}
        disabled={isSubmitting}
        onPress={onSubmit}
        className="mt-3 h-16 items-center justify-center rounded-[20px] bg-accent active:opacity-80 disabled:opacity-50"
      >
        {isSubmitting ? <ActivityIndicator color={colors.text} /> : <Text className="text-[17px] font-semibold text-white">Create account</Text>}
      </Pressable>
      <Text className="mt-5 text-center text-[12px] leading-5 text-subtle">By continuing you agree to our Terms and Privacy Policy.</Text>
    </AuthShell>
  );
}
