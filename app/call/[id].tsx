import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AudioLines, ChevronDown, Mic, MicOff, PhoneOff, Speaker, Volume2 } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { StandalonePanel } from '@/components/StandalonePanel';
import { people } from '@/data/mock';
import { useLiveKitCall } from '@/features/calls/use-livekit-call';
import { colors } from '@/lib/theme';
import { useCallStore } from '@/stores/call-store';

function formatDuration(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const person = useMemo(() => people.find((item) => item.id === id) ?? people[0], [id]);
  const { status, muted, speaker, toggleMuted, toggleSpeaker } = useCallStore();
  const { end } = useLiveKitCall(person.id);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (status !== 'connected') return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const endCall = async () => { await end(); router.back(); };

  return (
    <StandalonePanel>
      <LinearGradient colors={['rgba(108,99,255,0.25)', '#08090B', '#08090B']} locations={[0, 0.48, 1]} className="absolute inset-0" />
      <View className="flex-1 px-5 pb-6">
        <View className="mt-2 flex-row items-center justify-between">
          <Pressable accessibilityLabel="Minimize call" onPress={() => router.back()} className="h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.07]"><ChevronDown size={22} color={colors.text} /></Pressable>
          <View className="flex-row items-center rounded-full bg-white/[0.07] px-4 py-2"><AudioLines size={15} color={colors.success} /><Text className="ml-2 text-[12px] font-semibold uppercase tracking-[1px] text-primary">Encrypted call</Text></View>
          <View className="h-12 w-12" />
        </View>
        <View className="flex-1 items-center justify-center pb-12">
          <View className="rounded-full border border-white/10 p-4"><View className="rounded-full border border-white/5 p-4"><Avatar initials={person.initials} color={person.color} size={132} /></View></View>
          <Text className="mt-8 text-[32px] font-semibold tracking-[-1px] text-primary">{person.name}</Text>
          <Text className="mt-3 text-[15px] font-medium text-secondary">{status === 'connected' ? formatDuration(seconds) : status === 'connecting' ? 'Connecting…' : status}</Text>
        </View>
        <View className="rounded-[30px] border border-white/[0.08] bg-white/[0.055] p-5">
          <View className="flex-row justify-around">
            <CallControl icon={muted ? MicOff : Mic} label={muted ? 'Unmute' : 'Mute'} active={muted} onPress={toggleMuted} />
            <CallControl icon={speaker ? Volume2 : Speaker} label="Speaker" active={speaker} onPress={toggleSpeaker} />
            <CallControl icon={AudioLines} label="Audio" onPress={() => undefined} />
            <CallControl icon={PhoneOff} label="End" danger onPress={endCall} />
          </View>
        </View>
      </View>
    </StandalonePanel>
  );
}

function CallControl({ icon: Icon, label, onPress, active, danger }: { icon: typeof Mic; label: string; onPress: () => void; active?: boolean; danger?: boolean }) {
  return <View className="items-center"><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="h-14 w-14 items-center justify-center rounded-full active:opacity-60" style={{ backgroundColor: danger ? colors.danger : active ? colors.text : 'rgba(255,255,255,0.09)' }}><Icon size={22} color={active ? colors.ink : colors.text} /></Pressable><Text className="mt-2 text-[11px] text-secondary">{label}</Text></View>;
}
