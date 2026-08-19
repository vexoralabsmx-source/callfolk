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

export function readableError(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: string; details?: string; hint?: string };
    return candidate.message || candidate.details || candidate.hint || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function isMissingRpc(error: unknown) {
  const message = readableError(error, '').toLowerCase();
  return message.includes('schema cache') || message.includes('could not find the function') || message.includes('does not exist');
}

export async function sendContactRequest(targetUserId: string) {
  const rpc = await withTimeout(supabase.rpc('send_contact_request', { target_user: targetUserId }));
  if (!rpc.error) return rpc.data as string;
  if (!isMissingRpc(rpc.error)) throw rpc.error;

  const { data: auth } = await withTimeout(supabase.auth.getUser());
  if (!auth.user) throw new Error('Your session expired. Sign in again.');
  const existing = await withTimeout(supabase.from('contact_requests').select('id, status').eq('sender_id', auth.user.id).eq('receiver_id', targetUserId).maybeSingle());
  if (existing.error) throw existing.error;
  if (existing.data?.status === 'pending') return existing.data.id;
  if (existing.data) throw new Error('This request was already answered. The database update is required before sending it again.');
  const inserted = await withTimeout(supabase.from('contact_requests').insert({ sender_id: auth.user.id, receiver_id: targetUserId }).select('id').single());
  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

export async function respondToContactRequest(requestId: string, accept: boolean) {
  const rpc = await withTimeout(supabase.rpc('respond_to_contact_request', { request_id: requestId, accept_request: accept }));
  if (!rpc.error) return;
  if (!isMissingRpc(rpc.error)) throw rpc.error;

  const { data: auth } = await withTimeout(supabase.auth.getUser());
  if (!auth.user) throw new Error('Your session expired. Sign in again.');
  const request = await withTimeout(supabase.from('contact_requests').select('sender_id').eq('id', requestId).eq('receiver_id', auth.user.id).single());
  if (request.error) throw request.error;
  const updated = await withTimeout(supabase.from('contact_requests').update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() }).eq('id', requestId));
  if (updated.error) throw updated.error;
  if (accept) {
    const contact = await withTimeout(supabase.from('contacts').upsert({ owner_id: auth.user.id, contact_id: request.data.sender_id }, { onConflict: 'owner_id,contact_id' }));
    if (contact.error) throw contact.error;
  }
}

export async function startConversation(_userId: string, personId: string) {
  const { data, error } = await withTimeout(supabase.rpc('create_direct_conversation', { target_user: personId }));
  if (error) {
    if (isMissingRpc(error)) throw new Error('Chat setup is not installed in Supabase yet. Apply migration 004_core_workflow_fixes.sql.');
    throw error;
  }
  if (!data) throw new Error('Supabase did not return a conversation.');
  return data as string;
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
      const [contacts, accepted] = await Promise.all([
        withTimeout(supabase.from('contacts').select('contact_id').eq('owner_id', userId!)),
        withTimeout(supabase.from('contact_requests').select('sender_id, receiver_id').eq('status', 'accepted').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)),
      ]);
      if (contacts.error) throw contacts.error;
      if (accepted.error) throw accepted.error;
      const ids = new Set((contacts.data ?? []).map((row) => row.contact_id));
      for (const request of accepted.data ?? []) ids.add(request.sender_id === userId ? request.receiver_id : request.sender_id);
      const map = await profilesByIds([...ids]);
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
