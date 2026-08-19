import { useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCheck, Mic, Paperclip, Phone, Send, Smile } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { StandalonePanel } from '@/components/StandalonePanel';
import { people } from '@/data/mock';
import { colors } from '@/lib/theme';

type Message = { id: string; text: string; mine: boolean; time: string; pending?: boolean };

const initialMessages: Message[] = [
  { id: '1', text: 'Hey! Did you see the new prototype?', mine: false, time: '9:36 PM' },
  { id: '2', text: 'Just opened it. The call screen feels so clean.', mine: true, time: '9:38 PM' },
  { id: '3', text: 'Right? I especially like how quiet the whole interface feels.', mine: false, time: '9:40 PM' },
  { id: '4', text: 'That sounds perfect. Call later?', mine: false, time: '9:42 PM' },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const person = useMemo(() => people.find((item) => item.id === id) ?? people[0], [id]);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const next: Message = { id: Date.now().toString(), text, mine: true, time: 'Now', pending: true };
    setMessages((current) => [...current, next]);
    setDraft('');
    setTimeout(() => setMessages((current) => current.map((message) => message.id === next.id ? { ...message, pending: false } : message)), 650);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <StandalonePanel>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="h-[70px] flex-row items-center border-b border-white/[0.05] px-4">
          <IconButton icon={ArrowLeft} label="Go back" variant="ghost" onPress={() => router.back()} />
          <Avatar initials={person.initials} color={person.color} online={person.online} size={42} />
          <View className="ml-3 flex-1">
            <Text className="text-[16px] font-semibold text-primary">{person.name}</Text>
            <Text className={`mt-0.5 text-[12px] ${person.online ? 'text-success' : 'text-secondary'}`}>{person.online ? 'Online' : `@${person.username}`}</Text>
          </View>
          <IconButton icon={Phone} label={`Call ${person.name}`} variant="ghost" onPress={() => router.push({ pathname: '/call/[id]', params: { id: person.id } })} />
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<View className="mb-8 items-center"><Avatar initials={person.initials} color={person.color} size={72} /><Text className="mt-3 text-lg font-semibold text-primary">{person.name}</Text><Text className="mt-1 text-sm text-secondary">@{person.username} · Your messages are private</Text></View>}
          renderItem={({ item, index }) => {
            const grouped = index > 0 && messages[index - 1].mine === item.mine;
            return (
              <View className={`${item.mine ? 'items-end' : 'items-start'} ${grouped ? 'mt-1' : 'mt-4'}`}>
                <View className={`max-w-[82%] rounded-[20px] px-4 py-3 ${item.mine ? 'rounded-br-md bg-accent' : 'rounded-bl-md bg-elevated'}`}>
                  <Text className="text-[16px] leading-[22px] text-primary">{item.text}</Text>
                </View>
                {!grouped || index === messages.length - 1 ? (
                  <View className="mt-1.5 flex-row items-center px-1"><Text className="text-[11px] text-subtle">{item.pending ? 'Sending…' : item.time}</Text>{item.mine && !item.pending ? <CheckCheck className="ml-1" size={14} color={colors.accent} /> : null}</View>
                ) : null}
              </View>
            );
          }}
        />
        <View className="flex-row items-end border-t border-white/[0.05] px-3 pb-1 pt-2">
          <IconButton icon={Paperclip} label="Attach file" variant="ghost" />
          <View className="mx-1 min-h-[50px] flex-1 flex-row items-end rounded-[20px] bg-surface px-4 py-1">
            <TextInput
              accessibilityLabel="Message"
              value={draft}
              onChangeText={setDraft}
              placeholder="Message…"
              placeholderTextColor={colors.subtle}
              selectionColor={colors.accent}
              multiline
              maxLength={4000}
              className="max-h-28 min-h-[42px] flex-1 py-2.5 text-[16px] text-primary"
            />
            <Pressable accessibilityLabel="Add emoji" className="h-11 w-10 items-center justify-center"><Smile size={20} color={colors.muted} /></Pressable>
          </View>
          <IconButton icon={draft.trim() ? Send : Mic} label={draft.trim() ? 'Send message' : 'Record voice note'} variant={draft.trim() ? 'accent' : 'ghost'} onPress={draft.trim() ? send : undefined} />
        </View>
      </KeyboardAvoidingView>
    </StandalonePanel>
  );
}
