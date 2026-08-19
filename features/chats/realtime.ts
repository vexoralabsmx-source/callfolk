import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

let activeChannel: RealtimeChannel | null = null;

export function subscribeToInbox(userId: string, onChange: () => void) {
  activeChannel?.unsubscribe();
  activeChannel = supabase
    .channel(`inbox:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
    .subscribe();
  return () => {
    activeChannel?.unsubscribe();
    activeChannel = null;
  };
}

export function sendTyping(conversationId: string, userId: string, typing: boolean) {
  return activeChannel?.send({ type: 'broadcast', event: 'typing', payload: { conversationId, userId, typing } });
}
