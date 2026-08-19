import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { MessageCircle, Phone, UserPlus } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { startConversation, useContacts } from '@/features/app-data';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function ContactsScreen() {
  const [search, setSearch] = useState('');
  const user = useAuthStore((state) => state.user);
  const contacts = useContacts(user?.id);
  const filtered = useMemo(() => (contacts.data ?? []).filter((person) => `${person.name} ${person.username}`.toLowerCase().includes(search.toLowerCase())), [contacts.data, search]);
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1024;
  const message = async (personId: string) => {
    if (!user) return;
    const conversationId = await startConversation(user.id, personId);
    router.push({ pathname: '/chat/[id]', params: { id: conversationId, personId } });
  };
  return (
    <Screen>
      <View className="flex-1" style={desktop ? { width: '100%', maxWidth: 980, alignSelf: 'center', paddingHorizontal: 40 } : undefined}>
      <View className="mb-6 mt-5 flex-row items-center justify-between">
        <Text className="text-[34px] font-semibold tracking-[-1px] text-primary">Contacts</Text>
        <IconButton icon={UserPlus} label="Add contact" onPress={() => router.push('/contact/add')} />
      </View>
      <SearchField value={search} onChangeText={setSearch} placeholder="Name, @username or ID" />
      <Text className="mb-3 mt-7 text-[13px] font-semibold uppercase tracking-[1px] text-subtle">{filtered.length} people</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={contacts.isLoading ? <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.accent} /></View> : <EmptyState icon={UserPlus} title={contacts.isError ? 'Could not load contacts' : 'No contacts yet'} body={contacts.isError ? 'Check your connection and try again.' : 'Add someone by username or contact ID.'} />}
        renderItem={({ item }) => (
          <View className="min-h-[76px] flex-row items-center px-2">
            <Avatar initials={item.initials} color={item.color} online={item.online} size={52} />
            <View className="ml-4 flex-1">
              <Text className="text-[16px] font-semibold text-primary">{item.name}</Text>
              <Text className="mt-1 text-[13px] text-secondary">@{item.username}</Text>
            </View>
            <Pressable accessibilityLabel={`Message ${item.name}`} onPress={() => message(item.id)} className="h-11 w-11 items-center justify-center rounded-2xl active:bg-white/5"><MessageCircle size={19} color={colors.muted} /></Pressable>
            <Pressable accessibilityLabel={`Call ${item.name}`} onPress={() => router.push({ pathname: '/call/[id]', params: { id: item.id } })} className="h-11 w-11 items-center justify-center rounded-2xl active:bg-white/5"><Phone size={19} color={colors.accent} /></Pressable>
          </View>
        )}
      />
      </View>
    </Screen>
  );
}
