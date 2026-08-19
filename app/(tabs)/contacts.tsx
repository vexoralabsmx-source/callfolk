import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock3, Inbox, MessageCircle, Phone, UserPlus, UsersRound, X } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { readableError, respondToContactRequest, startConversation, useContactRequests, useContacts, type ContactRequestView } from '@/features/app-data';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

type ContactTab = 'contacts' | 'requests';

export default function ContactsScreen() {
  const { tab: requestedTab } = useLocalSearchParams<{ tab?: string }>();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ContactTab>(requestedTab === 'requests' ? 'requests' : 'contacts');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const contacts = useContacts(user?.id);
  const requests = useContactRequests(user?.id);
  const queryClient = useQueryClient();
  const filtered = useMemo(() => (contacts.data ?? []).filter((person) => `${person.name} ${person.username}`.toLowerCase().includes(search.toLowerCase())), [contacts.data, search]);
  const incoming = (requests.data ?? []).filter((request) => request.direction === 'incoming');
  const outgoing = (requests.data ?? []).filter((request) => request.direction === 'outgoing');
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1024;

  const message = async (personId: string) => {
    if (!user) return;
    setPendingId(personId);
    setFeedback(null);
    try {
      const conversationId = await startConversation(user.id, personId);
      router.push({ pathname: '/chat/[id]', params: { id: conversationId, personId } });
    } catch (error) {
      setFeedback(readableError(error, 'Could not start the conversation.'));
    } finally {
      setPendingId(null);
    }
  };

  const respond = async (requestId: string, accept: boolean) => {
    setPendingId(requestId);
    setFeedback(null);
    try {
      await respondToContactRequest(requestId, accept);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contact-requests', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['contacts', user?.id] }),
      ]);
    } catch (error) {
      setFeedback(readableError(error, 'Could not update the request.'));
    } finally {
      setPendingId(null);
    }
  };

  const refresh = async () => { await Promise.all([contacts.refetch(), requests.refetch()]); };
  const refreshing = contacts.isRefetching || requests.isRefetching;

  return (
    <Screen>
      <View className="flex-1" style={desktop ? { width: '100%', maxWidth: 980, alignSelf: 'center', paddingHorizontal: 40 } : undefined}>
        <View className="mb-5 mt-5 flex-row items-center justify-between">
          <View><Text className="text-[32px] font-semibold tracking-[-1px] text-primary">People</Text><Text className="mt-1 text-[13px] text-secondary">Contacts and requests</Text></View>
          <IconButton icon={UserPlus} label="Add contact" onPress={() => router.push('/contact/add')} />
        </View>

        <View className="mb-5 flex-row rounded-[18px] border border-white/[0.07] bg-surface p-1.5">
          <TabButton icon={UsersRound} label="Contacts" active={tab === 'contacts'} onPress={() => setTab('contacts')} />
          <TabButton icon={Inbox} label="Requests" badge={incoming.length} active={tab === 'requests'} onPress={() => setTab('requests')} />
        </View>

        {feedback ? <View className="mb-4 flex-row items-center rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3"><Text className="flex-1 text-[13px] leading-5 text-danger">{feedback}</Text><Pressable accessibilityLabel="Dismiss error" onPress={() => setFeedback(null)} className="h-10 w-10 items-center justify-center"><X size={18} color={colors.danger} /></Pressable></View> : null}

        {tab === 'contacts' ? (
          <>
            <SearchField value={search} onChangeText={setSearch} placeholder="Search contacts" />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
              contentContainerStyle={{ paddingTop: 14, paddingBottom: 124, flexGrow: 1 }}
              ListEmptyComponent={contacts.isLoading ? <LoadingState label="Loading contacts…" /> : <EmptyState icon={UserPlus} title={contacts.isError ? 'Could not load contacts' : 'No contacts yet'} body={contacts.isError ? 'Pull down to retry.' : 'Send a request using a username or contact ID.'} />}
              renderItem={({ item }) => (
                <View className="min-h-[78px] flex-row items-center rounded-[20px] px-2 active:bg-white/[0.04]">
                  <Avatar initials={item.initials} color={item.color} online={item.online} size={52} />
                  <View className="ml-3.5 flex-1"><Text className="text-[16px] font-semibold text-primary">{item.name}</Text><Text className="mt-1 text-[13px] text-secondary">@{item.username}</Text></View>
                  {pendingId === item.id ? <View className="h-12 w-12 items-center justify-center"><ActivityIndicator color={colors.accent} /></View> : <Pressable accessibilityLabel={`Message ${item.name}`} onPress={() => message(item.id)} className="h-12 w-12 items-center justify-center rounded-2xl active:bg-white/[0.06]"><MessageCircle size={20} color={colors.muted} /></Pressable>}
                  <Pressable accessibilityLabel={`Call ${item.name}`} onPress={() => router.push({ pathname: '/call/[id]', params: { id: item.id } })} className="h-12 w-12 items-center justify-center rounded-2xl active:bg-white/[0.06]"><Phone size={20} color={colors.accent} /></Pressable>
                </View>
              )}
            />
          </>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />} contentContainerStyle={{ paddingBottom: 124, flexGrow: 1 }}>
            {requests.isLoading ? <LoadingState label="Loading requests…" /> : incoming.length || outgoing.length ? (
              <>
                {incoming.length ? <RequestSection title="Waiting for you" count={incoming.length}>{incoming.map((request) => <RequestCard key={request.id} request={request} loading={pendingId === request.id} onAccept={() => respond(request.id, true)} onDecline={() => respond(request.id, false)} />)}</RequestSection> : null}
                {outgoing.length ? <RequestSection title="Sent" count={outgoing.length}>{outgoing.map((request) => <RequestCard key={request.id} request={request} loading={false} />)}</RequestSection> : null}
              </>
            ) : <EmptyState icon={Inbox} title={requests.isError ? 'Could not load requests' : 'No pending requests'} body={requests.isError ? 'Pull down to retry.' : 'New friend requests will appear here.'} />}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function TabButton({ icon: Icon, label, badge, active, onPress }: { icon: typeof UsersRound; label: string; badge?: number; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} className={`h-12 flex-1 flex-row items-center justify-center rounded-[14px] active:opacity-70 ${active ? 'bg-elevated' : ''}`}><Icon size={18} color={active ? colors.accentSoft : colors.muted} /><Text className={`ml-2 text-[14px] font-semibold ${active ? 'text-primary' : 'text-secondary'}`}>{label}</Text>{badge ? <View className="ml-2 min-w-[20px] items-center rounded-full bg-accent px-1.5 py-0.5"><Text className="text-[10px] font-bold text-white">{badge}</Text></View> : null}</Pressable>;
}

function RequestSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <View className="mt-3"><View className="mb-2 flex-row items-center px-1"><Text className="text-[12px] font-semibold uppercase tracking-[1.1px] text-subtle">{title}</Text><Text className="ml-2 text-[12px] text-subtle">{count}</Text></View>{children}</View>;
}

function RequestCard({ request, loading, onAccept, onDecline }: { request: ContactRequestView; loading: boolean; onAccept?: () => void; onDecline?: () => void }) {
  const incoming = request.direction === 'incoming';
  return (
    <View className="mb-2 rounded-[22px] border border-white/[0.07] bg-surface p-4">
      <View className="flex-row items-center"><Avatar initials={request.person.initials} color={request.person.color} online={request.person.online} size={50} /><View className="ml-3 flex-1"><Text className="text-[16px] font-semibold text-primary">{request.person.name}</Text><Text className="mt-1 text-[13px] text-secondary">@{request.person.username}</Text></View>{!incoming ? <View className="flex-row items-center rounded-full bg-white/[0.05] px-3 py-2"><Clock3 size={13} color={colors.muted} /><Text className="ml-1.5 text-[11px] font-semibold text-secondary">Pending</Text></View> : null}</View>
      {incoming ? <View className="mt-4 flex-row gap-2.5"><Pressable disabled={loading} onPress={onDecline} className="h-12 flex-1 flex-row items-center justify-center rounded-[15px] border border-white/[0.08] bg-elevated active:opacity-70 disabled:opacity-50"><X size={17} color={colors.muted} /><Text className="ml-2 font-semibold text-secondary">Decline</Text></Pressable><Pressable disabled={loading} onPress={onAccept} className="h-12 flex-1 flex-row items-center justify-center rounded-[15px] bg-primary active:opacity-80 disabled:opacity-50">{loading ? <ActivityIndicator color={colors.ink} /> : <><Check size={17} color={colors.ink} /><Text className="ml-2 font-semibold text-ink">Accept</Text></>}</Pressable></View> : null}
    </View>
  );
}

function LoadingState({ label }: { label: string }) {
  return <View className="flex-1 items-center justify-center py-16"><ActivityIndicator color={colors.accent} /><Text className="mt-3 text-sm text-secondary">{label}</Text></View>;
}
