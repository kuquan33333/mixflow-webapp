import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

type AuthState = {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  init: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const user = { id: session.user.id, email: session.user.email || '' };
      set({ user });
      await get().refreshProfile();
    }
    set({ initialized: true });

    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' && session) {
          set({ user: { id: session.user.id, email: session.user.email || '' } });
          await get().refreshProfile();
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null });
        }
      })();
    });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      throw error;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ user: { id: session.user.id, email: session.user.email || '' } });
      await get().refreshProfile();
    }
    set({ loading: false });
  },

  signUp: async (email, password, username, displayName) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false });
      throw error;
    }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        display_name: displayName,
        bio: '',
        avatar_url: '',
        cover_url: '',
      });
      if (profileError) {
        set({ loading: false });
        throw profileError;
      }
      set({ user: { id: data.user.id, email } });
      await get().refreshProfile();
    }
    set({ loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
