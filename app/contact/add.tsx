import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { AtSign, ContactRound, MessageCircle, Phone, QrCode, ScanLine, Search, UserPlus, X } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { StandalonePanel } from '@/components/StandalonePanel';
import { people } from '@/data/mock';
import { colors } from '@/lib/theme';

type Mode = 'username' | 'id' | 'qr';

export default function AddContactScreen() {
  const [mode, setMode] = useState<Mode>('username');
  const [query, setQuery] = useState('');
  const [added, setAdded] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const result = useMemo(() => query.trim().length >= 3 ? people.find((person) => `${person.username} ${person.name}`.toLowerCase().includes(query.replace('@', '').toLowerCase())) ?? people[0] : null, [query]);

  const setQrMode = async () => {
    setMode('qr');
    if (!permission?.granted) await requestPermission();
  };

  return (
    <StandalonePanel>
      <View className="flex-1 px-5">
        <View className="mt-2 flex-row items-center justify-between">
          <View><Text className="text-[28px] font-semibold tracking-[-0.5px] text-primary">Add contact</Text><Text className="mt-1 text-sm text-secondary">Find anyone without a phone number</Text></View>
          <Pressable accessibilityLabel="Close" onPress={() => router.back()} className="h-12 w-12 items-center justify-center rounded-2xl bg-surface"><X size={21} color={colors.text} /></Pressable>
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
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={({ data }) => { if (data.includes('callfolk')) { setQuery('maya'); setMode('username'); } }}
                />
                <View pointerEvents="none" className="absolute inset-10 rounded-[28px] border-2 border-accent"><ScanLine className="absolute -top-4 -left-4" size={28} color={colors.accent} /></View>
              </View>
            ) : (
              <View className="mt-14 items-center px-8"><View className="h-16 w-16 items-center justify-center rounded-3xl bg-elevated"><QrCode size={28} color={colors.accent} /></View><Text className="mt-5 text-center text-xl font-semibold text-primary">Camera access needed</Text><Text className="mt-2 text-center leading-6 text-secondary">Allow camera access to scan a personal Callfolk code.</Text><Pressable onPress={requestPermission} className="mt-6 rounded-2xl bg-primary px-6 py-4"><Text className="font-semibold text-ink">Allow camera</Text></Pressable></View>
            )}
            <Text className="mt-5 text-center text-sm text-secondary">Center a Callfolk QR code in the frame</Text>
          </View>
        ) : (
          <>
            <View className="mt-7 h-16 flex-row items-center rounded-[20px] border border-white/[0.08] bg-surface px-4">
              <Search size={20} color={colors.muted} />
              <TextInput
                accessibilityLabel={mode === 'username' ? 'Username' : 'Contact ID'}
                value={query}
                onChangeText={setQuery}
                autoCapitalize={mode === 'id' ? 'characters' : 'none'}
                placeholder={mode === 'username' ? '@username' : 'MKE-7K82-A91'}
                placeholderTextColor={colors.subtle}
                selectionColor={colors.accent}
                className="ml-3 flex-1 text-[17px] text-primary"
              />
            </View>
            {result ? (
              <View className="mt-7 items-center rounded-[28px] border border-white/[0.07] bg-surface px-5 py-7">
                <Avatar initials={result.initials} color={result.color} online={result.online} size={76} />
                <Text className="mt-4 text-[22px] font-semibold text-primary">{result.name}</Text>
                <Text className="mt-1 text-sm text-secondary">@{result.username}</Text>
                <View className="mt-6 w-full flex-row gap-3">
                  <Pressable onPress={() => router.replace({ pathname: '/chat/[id]', params: { id: result.id } })} className="h-12 flex-1 flex-row items-center justify-center rounded-2xl bg-elevated"><MessageCircle size={18} color={colors.text} /><Text className="ml-2 font-semibold text-primary">Message</Text></Pressable>
                  <Pressable onPress={() => router.replace({ pathname: '/call/[id]', params: { id: result.id } })} className="h-12 flex-1 flex-row items-center justify-center rounded-2xl bg-elevated"><Phone size={18} color={colors.text} /><Text className="ml-2 font-semibold text-primary">Call</Text></Pressable>
                </View>
                <Pressable onPress={() => setAdded(true)} className={`mt-3 h-14 w-full flex-row items-center justify-center rounded-[18px] ${added ? 'bg-success/15' : 'bg-accent'}`}><UserPlus size={19} color={added ? colors.success : colors.text} /><Text className={`ml-2 font-semibold ${added ? 'text-success' : 'text-white'}`}>{added ? 'Contact added' : 'Add contact'}</Text></Pressable>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center pb-24"><View className="h-16 w-16 items-center justify-center rounded-3xl bg-elevated"><Search size={28} color={colors.accent} /></View><Text className="mt-5 text-xl font-semibold text-primary">Find your people</Text><Text className="mt-2 max-w-[280px] text-center leading-6 text-secondary">Search by a unique @{mode === 'username' ? 'username' : 'contact ID'} to start talking.</Text></View>
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
