import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Edit3, MessageCircle } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { conversations } from '@/data/mock';
import { useAuthStore } from '@/stores/auth-store';

export default function ChatsScreen() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => conversations.filter((item) => `${item.name} ${item.preview}`.toLowerCase().includes(search.toLowerCase())), [search]);

  return (
    <Screen>
      <View className="mb-6 mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Avatar initials={(user?.displayName ?? 'Mike Evans').split(' ').map((part) => part[0]).join('').slice(0, 2)} size={44} />
          <View className="ml-3">
            <Text className="text-[13px] text-secondary">Good evening</Text>
            <Text className="text-[19px] font-semibold text-primary">{user?.displayName?.split(' ')[0] ?? 'Mike'}</Text>
          </View>
        </View>
        <IconButton icon={Edit3} label="New conversation" onPress={() => router.push('/contact/add')} />
      </View>
      <Text className="mb-5 text-[34px] font-semibold tracking-[-1px] text-primary">Messages</Text>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search conversations" />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 120, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon={MessageCircle} title="No messages found" body="Try another search or start a new conversation." />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open conversation with ${item.name}`}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
            className="min-h-[76px] flex-row items-center rounded-[20px] px-2 active:bg-white/[0.04]"
          >
            <Avatar initials={item.initials} color={item.color} online={item.online} size={54} />
            <View className="ml-4 flex-1 border-b border-white/[0.05] py-[17px]">
              <View className="flex-row items-center justify-between">
                <Text className="text-[16px] font-semibold text-primary">{item.name}</Text>
                <Text className="text-[12px] text-subtle">{item.time}</Text>
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text numberOfLines={1} className={`mr-4 flex-1 text-[14px] ${item.typing ? 'font-medium text-success' : item.unread ? 'text-primary' : 'text-secondary'}`}>{item.preview}</Text>
                {item.unread ? <View className="min-w-[22px] items-center rounded-full bg-accent px-1.5 py-0.5"><Text className="text-[11px] font-semibold text-white">{item.unread}</Text></View> : null}
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
