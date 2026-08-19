import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCheck, Mic, Paperclip, Phone, Send, Smile } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { StandalonePanel } from '@/components/StandalonePanel';
import { usePerson } from '@/features/app-data';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

type Message = { id: string; body: string | null; sender_id: string; created_at: string };

function clientId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export default function ChatScreen() {
  const { id, personId } = useLocalSearchParams<{ id: string; personId?: string }>();
  const user = useAuthStore((state) => state.user);
  const person = usePerson(personId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.from('messages').select('id, body, sender_id, created_at').eq('conversation_id', id).is('deleted_at', null).order('created_at');
      if (active) { setMessages(data ?? []); setLoading(false); }
    }
    load();
    const channel = supabase.channel(`conversation:${id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
      setMessages((current) => current.some((item) => item.id === payload.new.id) ? current : [...current, payload.new as Message]);
    }).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [id]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !user || sending) return;
    setSending(true);
    const { data, error } = await supabase.from('messages').insert({ conversation_id: id, sender_id: user.id, kind: 'text', body: text, client_id: clientId() }).select('id, body, sender_id, created_at').single();
    setSending(false);
    if (error) return;
    setDraft('');
    setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats');
  const displayName = person.data?.name ?? 'Conversation';

  return (
    <StandalonePanel>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="h-[70px] flex-row items-center border-b border-white/[0.05] px-4">
          <IconButton icon={ArrowLeft} label="Go back" variant="ghost" onPress={goBack} />
          {person.data ? <Avatar initials={person.data.initials} color={person.data.color} online={person.data.online} size={42} /> : null}
          <View className="ml-3 flex-1"><Text className="text-[16px] font-semibold text-primary">{displayName}</Text><Text className="mt-0.5 text-[12px] text-secondary">{person.data?.online ? 'Online' : person.data?.username ? `@${person.data.username}` : 'Private conversation'}</Text></View>
          {person.data ? <IconButton icon={Phone} label={`Call ${displayName}`} variant="ghost" onPress={() => router.push({ pathname: '/call/[id]', params: { id: person.data!.id } })} /> : null}
        </View>
        {loading ? <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.accent} /></View> : (
          <FlatList ref={listRef} data={messages} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false} ListEmptyComponent={<View className="flex-1 items-center justify-center"><Text className="text-lg font-semibold text-primary">No messages yet</Text><Text className="mt-2 text-sm text-secondary">Send the first message in this conversation.</Text></View>} renderItem={({ item, index }) => {
            const mine = item.sender_id === user?.id;
            const grouped = index > 0 && messages[index - 1].sender_id === item.sender_id;
            return <View className={`${mine ? 'items-end' : 'items-start'} ${grouped ? 'mt-1' : 'mt-4'}`}><View className={`max-w-[82%] rounded-[20px] px-4 py-3 ${mine ? 'rounded-br-md bg-accent' : 'rounded-bl-md bg-elevated'}`}><Text className="text-[16px] leading-[22px] text-primary">{item.body}</Text></View><View className="mt-1.5 flex-row items-center px-1"><Text className="text-[11px] text-subtle">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>{mine ? <CheckCheck className="ml-1" size={14} color={colors.accent} /> : null}</View></View>;
          }} />
        )}
        <View className="flex-row items-end border-t border-white/[0.05] px-3 pb-1 pt-2">
          <IconButton icon={Paperclip} label="Attach file" variant="ghost" />
          <View className="mx-1 min-h-[50px] flex-1 flex-row items-end rounded-[20px] bg-surface px-4 py-1"><TextInput accessibilityLabel="Message" value={draft} onChangeText={setDraft} placeholder="Message…" placeholderTextColor={colors.subtle} selectionColor={colors.accent} multiline maxLength={4000} className="max-h-28 min-h-[42px] flex-1 py-2.5 text-[16px] text-primary" /><Pressable accessibilityLabel="Add emoji" className="h-11 w-10 items-center justify-center"><Smile size={20} color={colors.muted} /></Pressable></View>
          <IconButton icon={draft.trim() ? Send : Mic} label={draft.trim() ? 'Send message' : 'Record voice note'} variant={draft.trim() ? 'accent' : 'ghost'} onPress={draft.trim() ? send : undefined} active={sending} />
        </View>
      </KeyboardAvoidingView>
    </StandalonePanel>
  );
}
