import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { z } from 'zod';
import { SettingsShell } from '@/components/SettingsShell';
import { FormField } from '@/components/FormField';
import { readableError, withTimeout } from '@/features/app-data';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Use at least 2 characters').max(40, 'Use at most 40 characters'),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, 'Use 3–20 letters, numbers or underscores'),
});

export default function EditProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const save = async () => {
    const parsed = profileSchema.safeParse({ displayName, username });
    if (!parsed.success) { setFeedback(parsed.error.issues[0]?.message ?? 'Check your profile details.'); return; }
    if (!user) return;
    setLoading(true); setFeedback(null);
    try {
      const { error } = await withTimeout(supabase.from('profiles').update({ display_name: parsed.data.displayName, username: parsed.data.username, updated_at: new Date().toISOString() }).eq('id', user.id));
      if (error) throw error;
      await hydrate();
      setFeedback('Profile updated.');
    } catch (error) { setFeedback(readableError(error, 'Could not update your profile.')); }
    finally { setLoading(false); }
  };

  return <SettingsShell title="Edit profile" subtitle="Change how other people see you on Callfolk.">
    <FormField label="Display name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
    <FormField label="Username" value={username} onChangeText={(value) => setUsername(value.replace(/^@/, '').toLowerCase())} autoCapitalize="none" />
    {feedback ? <View className={`mb-4 rounded-2xl border p-4 ${feedback === 'Profile updated.' ? 'border-success/20 bg-success/10' : 'border-danger/20 bg-danger/10'}`}><Text className={feedback === 'Profile updated.' ? 'text-success' : 'text-danger'}>{feedback}</Text></View> : null}
    <Pressable disabled={loading} onPress={save} accessibilityRole="button" className="h-14 items-center justify-center rounded-[18px] bg-primary active:opacity-80 disabled:opacity-50">{loading ? <ActivityIndicator color={colors.ink} /> : <Text className="font-semibold text-ink">Save changes</Text>}</Pressable>
  </SettingsShell>;
}
