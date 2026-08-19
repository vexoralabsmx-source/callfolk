import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { personFromProfile, shortTime } from '@/lib/presentation';
import type { CallRecord, Conversation, Person } from '@/types';

type ProfileRow = { id: string; display_name: string; username: string; last_seen_at: string | null };

export type ContactRequestView = {
  id: string;
  person: Person;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
};

export function withTimeout<T>(operation: PromiseLike<T>, timeoutMs = 12_000) {
  return Promise.race([
    Promise.resolve(operation),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The request took too long. Check your connection and try again.')), timeoutMs)),
  ]);
}

export async function sendContactRequest(targetUserId: string) {
  const { data, error } = await withTimeout(supabase.rpc('send_contact_request', { target_user: targetUserId }));
  if (error) throw error;
  return data as string;
}

export async function respondToContactRequest(requestId: string, accept: boolean) {
  const { error } = await withTimeout(supabase.rpc('respond_to_contact_request', { request_id: requestId, accept_request: accept }));
  if (error) throw error;
}

export async function startConversation(userId: string, personId: string) {
  const conversationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
  const { error } = await withTimeout(supabase.from('conversations').insert({ id: conversationId, created_by: userId }));
  if (error) throw error;
  const { error: membersError } = await withTimeout(supabase.from('conversation_members').insert([
    { conversation_id: conversationId, user_id: userId },
    { conversation_id: conversationId, user_id: personId },
  ]));
  if (membersError) throw membersError;
  return conversationId;
}

async function profilesByIds(ids: string[]) {
  if (!ids.length) return new Map<string, Person>();
  const { data, error } = await withTimeout(supabase.from('profiles').select('id, display_name, username, last_seen_at').in('id', ids));
  if (error) throw error;
  return new Map((data as ProfileRow[]).map((profile) => [profile.id, personFromProfile(profile)]));
}

export function useInbox(userId?: string) {
  return useQuery({
    queryKey: ['inbox', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Conversation[]> => {
      const { data: memberships, error } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', userId!);
      if (error) throw error;
      const conversationIds = [...new Set((memberships ?? []).map((row) => row.conversation_id))];
      if (!conversationIds.length) return [];
      const [{ data: members, error: membersError }, { data: messages, error: messagesError }] = await Promise.all([
        supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', conversationIds).neq('user_id', userId!),
        supabase.from('messages').select('conversation_id, body, created_at').in('conversation_id', conversationIds).is('deleted_at', null).order('created_at', { ascending: false }),
      ]);
      if (membersError) throw membersError;
      if (messagesError) throw messagesError;
      const profileMap = await profilesByIds((members ?? []).map((row) => row.user_id));
      const latest = new Map<string, { body: string | null; created_at: string }>();
      for (const message of messages ?? []) if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
      return (members ?? []).flatMap((member) => {
        const person = profileMap.get(member.user_id);
        if (!person) return [];
        const message = latest.get(member.conversation_id);
        return [{ ...person, id: member.conversation_id, personId: person.id, preview: message?.body ?? 'Conversation started', time: shortTime(message?.created_at) }];
      });
    },
  });
}

export function useContacts(userId?: string) {
  return useQuery({
    queryKey: ['contacts', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Person[]> => {
      const { data, error } = await supabase.from('contacts').select('contact_id').eq('owner_id', userId!);
      if (error) throw error;
      const map = await profilesByIds((data ?? []).map((row) => row.contact_id));
      return [...map.values()];
    },
  });
}

export function useContactRequests(userId?: string) {
  return useQuery({
    queryKey: ['contact-requests', userId],
    enabled: Boolean(userId),
    refetchInterval: 10_000,
    queryFn: async (): Promise<ContactRequestView[]> => {
      const { data, error } = await withTimeout(supabase
        .from('contact_requests')
        .select('id, sender_id, receiver_id, created_at')
        .eq('status', 'pending')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false }));
      if (error) throw error;
      const profileMap = await profilesByIds((data ?? []).map((request) => request.sender_id === userId ? request.receiver_id : request.sender_id));
      return (data ?? []).flatMap((request) => {
        const incoming = request.receiver_id === userId;
        const person = profileMap.get(incoming ? request.sender_id : request.receiver_id);
        return person ? [{ id: request.id, person, direction: incoming ? 'incoming' : 'outgoing', createdAt: request.created_at }] : [];
      });
    },
  });
}

export function useCalls(userId?: string) {
  return useQuery({
    queryKey: ['calls', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<CallRecord[]> => {
      const { data, error } = await supabase.from('calls').select('id, caller_id, callee_id, status, started_at, answered_at, ended_at').or(`caller_id.eq.${userId},callee_id.eq.${userId}`).order('started_at', { ascending: false });
      if (error) throw error;
      const profileMap = await profilesByIds((data ?? []).map((call) => call.caller_id === userId ? call.callee_id : call.caller_id));
      return (data ?? []).flatMap((call) => {
        const incoming = call.callee_id === userId;
        const person = profileMap.get(incoming ? call.caller_id : call.callee_id);
        if (!person) return [];
        const duration = call.answered_at && call.ended_at ? `${Math.max(1, Math.round((new Date(call.ended_at).getTime() - new Date(call.answered_at).getTime()) / 60_000))} min` : undefined;
        return [{ ...person, recordId: call.id, direction: call.status === 'missed' ? 'missed' : incoming ? 'incoming' : 'outgoing', time: shortTime(call.started_at), duration }];
      });
    },
  });
}

export function usePerson(personId?: string) {
  return useQuery({
    queryKey: ['person', personId],
    enabled: Boolean(personId),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, display_name, username, last_seen_at').eq('id', personId!).single();
      if (error) throw error;
      return personFromProfile(data as ProfileRow);
    },
  });
}
