import { create } from 'zustand';
import { sessionStorage } from '@/lib/session-storage';

export type AppUser = {
  id: string;
  displayName: string;
  username: string;
  contactId: string;
};

type AuthState = {
  user: AppUser | null;
  hydrated: boolean;
  signInDemo: (user?: Partial<AppUser>) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
};

const demoUser: AppUser = {
  id: '0c05e14f-c3fb-41d1-ae59-07859b53eb94',
  displayName: 'Mike Evans',
  username: 'mike',
  contactId: 'MKE-7K82-A91',
};

const STORAGE_KEY = 'callfolk.session';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  async signInDemo(input) {
    const user = { ...demoUser, ...input };
    await sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user });
  },
  async signOut() {
    await sessionStorage.removeItem(STORAGE_KEY);
    set({ user: null });
  },
  async hydrate() {
    const raw = await sessionStorage.getItem(STORAGE_KEY);
    set({ user: raw ? (JSON.parse(raw) as AppUser) : null, hydrated: true });
  },
}));
