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

const schema = z.object({
  displayName: z.string().trim().min(2, 'Enter at least 2 characters').max(40),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, 'Use 3–20 letters, numbers or underscores'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
});

type Values = z.infer<typeof schema>;

function makeContactId(name: string) {
  const prefix = name.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  const random = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${random()}-${random().slice(0, 3)}`;
}

export default function SignUpScreen() {
  const signInDemo = useAuthStore((state) => state.signInDemo);
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', username: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    if (isSupabaseConfigured) {
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
      await signInDemo({ id: data.user?.id, displayName: values.displayName, username: values.username, contactId: makeContactId(values.displayName) });
    } else {
      await signInDemo({ displayName: values.displayName, username: values.username, contactId: makeContactId(values.displayName) });
    }
    router.replace('/(tabs)/chats');
  });

  const continueLocally = handleSubmit(async (values) => {
    setServerError(null);
    await signInDemo({ displayName: values.displayName, username: values.username, contactId: makeContactId(values.displayName) });
    router.replace('/(tabs)/chats');
  });

  return (
    <AuthShell title="Create your account" subtitle="Your username is all people need to find you.">
      <Controller control={control} name="displayName" render={({ field: { onChange, onBlur, value } }) => (
        <FormField label="Display name" placeholder="Mike Evans" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.displayName?.message} autoCapitalize="words" />
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
          {__DEV__ ? (
            <Pressable accessibilityRole="button" onPress={continueLocally} className="mt-3 h-12 items-center justify-center rounded-xl bg-white/[0.08] active:opacity-70">
              <Text className="font-semibold text-primary">Continue locally for now</Text>
            </Pressable>
          ) : null}
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
