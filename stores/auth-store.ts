import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type AppUser = {
  id: string;
  displayName: string;
  username: string;
  contactId: string;
};

type AuthState = {
  user: AppUser | null;
  hydrated: boolean;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
};

async function resolveUser(authUser: User): Promise<AppUser> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, username, contact_id')
    .eq('id', authUser.id)
    .maybeSingle();

  return {
    id: authUser.id,
    displayName: data?.display_name ?? authUser.user_metadata?.display_name ?? authUser.email?.split('@')[0] ?? 'Callfolk user',
    username: data?.username ?? authUser.user_metadata?.username ?? '',
    contactId: data?.contact_id ?? '',
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  async signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    set({ user: null, hydrated: true });
  },
  async hydrate() {
    if (!isSupabaseConfigured) {
      set({ user: null, hydrated: true });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ? await resolveUser(data.session.user) : null;
    set({ user, hydrated: true });
  },
}));
