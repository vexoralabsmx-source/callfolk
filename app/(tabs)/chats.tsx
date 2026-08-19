import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Edit3, MessageCircle, MessagesSquare, ShieldCheck } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { useInbox } from '@/features/app-data';
import { colors } from '@/lib/theme';
import { initialsFor } from '@/lib/presentation';
import { useAuthStore } from '@/stores/auth-store';
import type { Conversation } from '@/types';

export default function ChatsScreen() {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1024;
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const inbox = useInbox(user?.id);
  const filtered = useMemo(() => (inbox.data ?? []).filter((item) => `${item.name} ${item.preview}`.toLowerCase().includes(search.toLowerCase())), [inbox.data, search]);

  if (desktop) {
    return (
      <Screen>
        <View className="flex-1 flex-row">
          <View className="w-[410px] border-r border-white/[0.07] bg-canvas px-6 pt-7">
            <View className="mb-6 flex-row items-center justify-between">
              <View><Text className="text-[30px] font-semibold tracking-[-0.8px] text-primary">Messages</Text><Text className="mt-1 text-[13px] text-subtle">Your private conversations</Text></View>
              <IconButton icon={Edit3} label="New conversation" onPress={() => router.push('/contact/add')} />
            </View>
            <SearchField value={search} onChangeText={setSearch} placeholder="Search conversations" />
            <ConversationList data={filtered} loading={inbox.isLoading} error={inbox.isError} compact />
          </View>
          <View className="flex-1 items-center justify-center bg-ink px-12">
            <View className="h-20 w-20 items-center justify-center rounded-[28px] border border-accent/20 bg-accent/10"><MessagesSquare size={34} color={colors.accentSoft} /></View>
            <Text className="mt-7 text-center text-[28px] font-semibold tracking-[-0.6px] text-primary">Start a conversation</Text>
            <Text className="mt-3 max-w-[430px] text-center text-[15px] leading-6 text-secondary">Choose a conversation from the list or find a contact to send your first message.</Text>
            <Pressable onPress={() => router.push('/contact/add')} className="mt-7 h-12 flex-row items-center rounded-[16px] bg-primary px-5 active:opacity-80">
              <Edit3 size={17} color={colors.ink} /><Text className="ml-2 font-semibold text-ink">New message</Text>
            </Pressable>
            <View className="mt-10 flex-row items-center rounded-full border border-white/[0.06] bg-white/[0.025] px-4 py-2.5"><ShieldCheck size={14} color={colors.success} /><Text className="ml-2 text-[12px] text-subtle">Messages are visible only to conversation members</Text></View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mb-6 mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Avatar initials={initialsFor(user?.displayName ?? 'Callfolk')} size={44} />
          <View className="ml-3"><Text className="text-[13px] text-secondary">Messages</Text><Text className="text-[19px] font-semibold text-primary">{user?.displayName ?? 'Your account'}</Text></View>
        </View>
        <IconButton icon={Edit3} label="New conversation" onPress={() => router.push('/contact/add')} />
      </View>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search conversations" />
      <ConversationList data={filtered} loading={inbox.isLoading} error={inbox.isError} />
    </Screen>
  );
}

function ConversationList({ data, loading, error, compact }: { data: Conversation[]; loading: boolean; error: boolean; compact?: boolean }) {
  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.accent} /><Text className="mt-3 text-sm text-subtle">Loading conversations…</Text></View>;
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 18, paddingBottom: compact ? 28 : 120, flexGrow: 1 }}
      ListEmptyComponent={<EmptyState icon={MessageCircle} title={error ? 'Could not load messages' : 'No conversations yet'} body={error ? 'Check your connection and Supabase configuration.' : 'Start a conversation with one of your contacts.'} />}
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" accessibilityLabel={`Open conversation with ${item.name}`} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, personId: item.personId } })} className="min-h-[76px] flex-row items-center rounded-[18px] px-2 active:bg-white/[0.05]">
          <Avatar initials={item.initials} color={item.color} online={item.online} size={compact ? 48 : 54} />
          <View className="ml-3.5 flex-1 border-b border-white/[0.05] py-[17px]">
            <View className="flex-row items-center justify-between"><Text className="text-[15px] font-semibold text-primary">{item.name}</Text><Text className="text-[11px] text-subtle">{item.time}</Text></View>
            <Text numberOfLines={1} className="mt-1 text-[13px] text-secondary">{item.preview}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}
