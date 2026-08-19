import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, Check, Eye, LockKeyhole, LogOut, Moon, ShieldCheck, UserRoundX } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { SettingsShell } from '@/components/SettingsShell';
import { readableError, withTimeout } from '@/features/app-data';
import { personFromProfile } from '@/lib/presentation';
import { registerDeviceForPush } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';
import type { Person } from '@/types';

type Preferences = { onlineStatus: boolean; readReceipts: boolean; notifications: boolean };
const defaults: Preferences = { onlineStatus: true, readReceipts: true, notifications: true };
const preferenceKey = 'callfolk.preferences';

export default function SettingsSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  if (section === 'privacy') return <PrivacySettings />;
  if (section === 'notifications') return <NotificationSettings />;
  if (section === 'blocked') return <BlockedUsers />;
  if (section === 'appearance') return <AppearanceSettings />;
  return <AccountSettings />;
}

function usePreferences() {
  const [preferences, setPreferences] = useState(defaults);
  useEffect(() => { AsyncStorage.getItem(preferenceKey).then((value) => { if (value) setPreferences({ ...defaults, ...JSON.parse(value) }); }).catch(() => undefined); }, []);
  const update = (next: Partial<Preferences>) => setPreferences((current) => { const value = { ...current, ...next }; void AsyncStorage.setItem(preferenceKey, JSON.stringify(value)); return value; });
  return { preferences, update };
}

function PrivacySettings() {
  const { preferences, update } = usePreferences();
  return <SettingsShell title="Privacy" subtitle="Choose what people can see about your activity.">
    <SettingsCard><ToggleRow icon={Eye} title="Online status" body="Let contacts know when you are active." value={preferences.onlineStatus} onValueChange={(value) => update({ onlineStatus: value })} /><Divider /><ToggleRow icon={Check} title="Read receipts" body="Show when you have read a message." value={preferences.readReceipts} onValueChange={(value) => update({ readReceipts: value })} /></SettingsCard>
    <InfoCard icon={ShieldCheck} text="These preferences are saved on this device. Blocking a person is enforced by Supabase." />
  </SettingsShell>;
}

function NotificationSettings() {
  const user = useAuthStore((state) => state.user);
  const { preferences, update } = usePreferences();
  const [feedback, setFeedback] = useState<string | null>(null);
  const change = async (enabled: boolean) => {
    update({ notifications: enabled }); setFeedback(null);
    if (enabled && user) try { await registerDeviceForPush(user.id); setFeedback('Notifications enabled on this device.'); } catch (error) { update({ notifications: false }); setFeedback(readableError(error, 'Could not enable notifications.')); }
  };
  return <SettingsShell title="Notifications" subtitle="Control alerts for messages and internet calls.">
    <SettingsCard><ToggleRow icon={Bell} title="Push notifications" body="Receive messages and incoming-call alerts." value={preferences.notifications} onValueChange={change} /></SettingsCard>
    {feedback ? <View className="mt-4 rounded-2xl border border-white/[0.07] bg-surface p-4"><Text className="leading-5 text-secondary">{feedback}</Text></View> : null}
  </SettingsShell>;
}

function BlockedUsers() {
  const user = useAuthStore((state) => state.user);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const load = async () => {
    if (!user) return;
    setLoading(true); setFeedback(null);
    try {
      const blocks = await withTimeout(supabase.from('blocked_users').select('blocked_id').eq('blocker_id', user.id));
      if (blocks.error) throw blocks.error;
      const ids = (blocks.data ?? []).map((row) => row.blocked_id);
      if (!ids.length) { setPeople([]); return; }
      const profiles = await withTimeout(supabase.from('profiles').select('id, display_name, username, last_seen_at').in('id', ids));
      if (profiles.error) throw profiles.error;
      setPeople((profiles.data ?? []).map(personFromProfile));
    } catch (error) { setFeedback(readableError(error, 'Could not load blocked users.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [user?.id]);
  const unblock = async (personId: string) => {
    if (!user) return;
    const result = await withTimeout(supabase.from('blocked_users').delete().eq('blocker_id', user.id).eq('blocked_id', personId));
    if (result.error) { setFeedback(readableError(result.error, 'Could not unblock this person.')); return; }
    setPeople((current) => current.filter((person) => person.id !== personId));
  };
  return <SettingsShell title="Blocked users" subtitle="Blocked people cannot find or contact you.">
    {feedback ? <View className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 p-4"><Text className="text-danger">{feedback}</Text></View> : null}
    {loading ? <ActivityIndicator className="mt-16" color={colors.accent} /> : people.length ? people.map((person) => <View key={person.id} className="mb-2 flex-row items-center rounded-[20px] border border-white/[0.07] bg-surface p-3"><Avatar initials={person.initials} color={person.color} size={46} /><View className="ml-3 flex-1"><Text className="font-semibold text-primary">{person.name}</Text><Text className="mt-1 text-[13px] text-secondary">@{person.username}</Text></View><Pressable accessibilityLabel={`Unblock ${person.name}`} onPress={() => unblock(person.id)} className="h-11 items-center justify-center rounded-xl bg-elevated px-4 active:opacity-70"><Text className="font-semibold text-primary">Unblock</Text></Pressable></View>) : <EmptyState icon={UserRoundX} title="Nobody blocked" body="People you block will appear here." />}
  </SettingsShell>;
}

function AppearanceSettings() {
  return <SettingsShell title="Appearance" subtitle="Callfolk uses a focused dark interface on every device.">
    <View className="rounded-[22px] border border-accent/30 bg-accent/10 p-5"><View className="flex-row items-center"><View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent/20"><Moon size={22} color={colors.accentSoft} /></View><View className="ml-4 flex-1"><Text className="text-[16px] font-semibold text-primary">Dark mode</Text><Text className="mt-1 text-[13px] leading-5 text-secondary">Optimized for calls and low-light messaging.</Text></View><Check size={21} color={colors.accentSoft} /></View></View>
  </SettingsShell>;
}

function AccountSettings() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [email, setEmail] = useState('');
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')).catch(() => undefined); }, []);
  const leave = async () => { await signOut(); router.replace('/'); };
  return <SettingsShell title="Account" subtitle="Your Callfolk identity and session.">
    <SettingsCard><AccountRow label="Email" value={email || 'Not available'} /><Divider /><AccountRow label="Username" value={user?.username ? `@${user.username}` : 'Not set'} /><Divider /><AccountRow label="Contact ID" value={user?.contactId || 'Not available'} /></SettingsCard>
    <Pressable onPress={leave} className="mt-6 h-14 flex-row items-center justify-center rounded-[18px] border border-danger/20 bg-danger/10 active:opacity-70"><LogOut size={19} color={colors.danger} /><Text className="ml-2 font-semibold text-danger">Sign out</Text></Pressable>
  </SettingsShell>;
}

function SettingsCard({ children }: { children: React.ReactNode }) { return <View className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-surface px-4">{children}</View>; }
function Divider() { return <View className="h-px bg-white/[0.06]" />; }
function ToggleRow({ icon: Icon, title, body, value, onValueChange }: { icon: typeof Eye; title: string; body: string; value: boolean; onValueChange: (value: boolean) => void }) { return <View className="min-h-[82px] flex-row items-center py-3"><View className="h-10 w-10 items-center justify-center rounded-xl bg-elevated"><Icon size={19} color={colors.muted} /></View><View className="ml-3 flex-1 pr-3"><Text className="font-semibold text-primary">{title}</Text><Text className="mt-1 text-[12px] leading-4 text-secondary">{body}</Text></View><Switch accessibilityLabel={title} value={value} onValueChange={onValueChange} trackColor={{ false: colors.elevated, true: colors.accent }} thumbColor={colors.text} /></View>; }
function InfoCard({ icon: Icon, text }: { icon: typeof LockKeyhole; text: string }) { return <View className="mt-4 flex-row rounded-[18px] border border-white/[0.06] bg-surface p-4"><Icon size={18} color={colors.muted} /><Text className="ml-3 flex-1 text-[13px] leading-5 text-secondary">{text}</Text></View>; }
function AccountRow({ label, value }: { label: string; value: string }) { return <View className="min-h-[68px] justify-center py-3"><Text className="text-[12px] text-subtle">{label}</Text><Text selectable className="mt-1 text-[15px] font-medium text-primary">{value}</Text></View>; }
