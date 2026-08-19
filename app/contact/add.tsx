import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { AtSign, ContactRound, QrCode, ScanLine, Search, UserPlus, X } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { StandalonePanel } from '@/components/StandalonePanel';
import { personFromProfile } from '@/lib/presentation';
import { sendContactRequest, withTimeout } from '@/features/app-data';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';
import type { Person } from '@/types';

type Mode = 'username' | 'id' | 'qr';

export default function AddContactScreen() {
  const user = useAuthStore((state) => state.user);
  const [mode, setMode] = useState<Mode>('username');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (mode === 'qr' || query.trim().length < 3) {
      setResult(null);
      setFeedback(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setFeedback(null);
      setSent(false);
      const normalized = query.replace(/^@/, '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
      let request = supabase.from('profiles').select('id, display_name, username, last_seen_at').neq('id', user?.id ?? '').limit(1);
      request = mode === 'username' ? request.ilike('username', `%${normalized.toLowerCase()}%`) : request.ilike('contact_id', `%${normalized.toUpperCase()}%`);
      try {
        const { data, error } = await withTimeout(request.maybeSingle());
        if (error) {
          setFeedback('Could not search right now. Check your connection.');
          return;
        }
        setResult(data ? personFromProfile(data) : null);
        if (!data) setFeedback('No Callfolk account matches that search.');
      } catch (error) {
        setResult(null);
        setFeedback(error instanceof Error ? error.message : 'Could not search right now.');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [mode, query, user?.id]);

  const setQrMode = async () => {
    if (Platform.OS === 'web') {
      setFeedback('QR scanning is available in the mobile app.');
      return;
    }
    setMode('qr');
    if (!permission?.granted) await requestPermission();
  };

  const sendRequest = async () => {
    if (!user || !result) return;
    setLoading(true);
    setFeedback(null);
    try {
      await sendContactRequest(result.id);
      setSent(true);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not send the request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StandalonePanel>
      <View className="flex-1 px-5">
        <View className="mt-2 flex-row items-center justify-between">
          <View><Text className="text-[28px] font-semibold tracking-[-0.5px] text-primary">Add contact</Text><Text className="mt-1 text-sm text-secondary">Find a real Callfolk account</Text></View>
          <Pressable accessibilityLabel="Close" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/contacts')} className="h-12 w-12 items-center justify-center rounded-2xl bg-surface"><X size={21} color={colors.text} /></Pressable>
        </View>
        <View className="mt-8 flex-row gap-2">
          <ModeButton icon={AtSign} label="Username" active={mode === 'username'} onPress={() => setMode('username')} />
          <ModeButton icon={ContactRound} label="Contact ID" active={mode === 'id'} onPress={() => setMode('id')} />
          <ModeButton icon={QrCode} label="QR code" active={mode === 'qr'} onPress={setQrMode} />
        </View>
        {mode === 'qr' ? (
          <View className="mt-7 flex-1 items-center">
            {permission?.granted ? (
              <View className="aspect-square w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/10">
                <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { const id = data.split('/').pop(); if (id) { setQuery(id); setMode('id'); } }} />
                <View className="absolute inset-10 rounded-[28px] border-2 border-accent" style={{ pointerEvents: 'none' }}><ScanLine className="absolute -left-4 -top-4" size={28} color={colors.accent} /></View>
              </View>
            ) : (
              <View className="mt-14 items-center px-8"><View className="h-16 w-16 items-center justify-center rounded-3xl bg-elevated"><QrCode size={28} color={colors.accent} /></View><Text className="mt-5 text-center text-xl font-semibold text-primary">Camera access needed</Text><Text className="mt-2 text-center leading-6 text-secondary">Allow camera access to scan a Callfolk contact code.</Text><Pressable onPress={requestPermission} className="mt-6 rounded-2xl bg-primary px-6 py-4"><Text className="font-semibold text-ink">Allow camera</Text></Pressable></View>
            )}
          </View>
        ) : (
          <>
            <View className="mt-7 h-16 flex-row items-center rounded-[20px] border border-white/[0.08] bg-surface px-4">
              <Search size={20} color={colors.muted} />
              <TextInput accessibilityLabel={mode === 'username' ? 'Username' : 'Contact ID'} value={query} onChangeText={setQuery} autoCapitalize={mode === 'id' ? 'characters' : 'none'} placeholder={mode === 'username' ? '@username' : 'Contact ID'} placeholderTextColor={colors.subtle} selectionColor={colors.accent} className="ml-3 flex-1 text-[17px] text-primary" />
              {loading ? <ActivityIndicator color={colors.accent} /> : null}
            </View>
            {result ? (
              <View className="mt-7 items-center rounded-[28px] border border-white/[0.07] bg-surface px-5 py-7">
                <Avatar initials={result.initials} color={result.color} online={result.online} size={76} />
                <Text className="mt-4 text-[22px] font-semibold text-primary">{result.name}</Text>
                <Text className="mt-1 text-sm text-secondary">@{result.username}</Text>
                {feedback ? <Text className="mt-4 text-center text-[13px] leading-5 text-danger">{feedback}</Text> : null}
                <Pressable disabled={loading || sent} onPress={sendRequest} className={`mt-6 h-14 w-full flex-row items-center justify-center rounded-[18px] active:opacity-80 disabled:opacity-60 ${sent ? 'bg-success/15' : 'bg-accent'}`}>{loading ? <ActivityIndicator color={colors.text} /> : <><UserPlus size={19} color={sent ? colors.success : colors.text} /><Text className={`ml-2 font-semibold ${sent ? 'text-success' : 'text-white'}`}>{sent ? 'Request sent' : 'Send friend request'}</Text></>}</Pressable>
                {sent ? <Pressable onPress={() => router.replace({ pathname: '/(tabs)/contacts', params: { tab: 'requests' } })} className="mt-2 h-12 items-center justify-center rounded-[16px] active:bg-white/[0.05]"><Text className="font-semibold text-secondary">View requests</Text></Pressable> : null}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center pb-24"><View className="h-16 w-16 items-center justify-center rounded-3xl bg-elevated"><Search size={28} color={colors.accent} /></View><Text className="mt-5 text-xl font-semibold text-primary">Find a contact</Text><Text className="mt-2 max-w-[300px] text-center leading-6 text-secondary">Enter at least three characters from a username or contact ID.</Text>{feedback ? <Text className="mt-4 text-center text-sm text-danger">{feedback}</Text> : null}</View>
            )}
          </>
        )}
      </View>
    </StandalonePanel>
  );
}

function ModeButton({ icon: Icon, label, active, onPress }: { icon: typeof AtSign; label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} className={`h-[70px] flex-1 items-center justify-center rounded-[20px] border ${active ? 'border-accent/40 bg-accent/15' : 'border-white/[0.06] bg-surface'}`}><Icon size={20} color={active ? colors.accent : colors.muted} /><Text className={`mt-2 text-[11px] font-semibold ${active ? 'text-primary' : 'text-secondary'}`}>{label}</Text></Pressable>;
}
