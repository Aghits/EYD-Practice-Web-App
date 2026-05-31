import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const isDevMode = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

export const useAuthStore = create((set, get) => ({
  user: isDevMode ? { id: 'dev-user', email: 'dev@local.com', email_confirmed_at: new Date().toISOString() } : null,
  profile: null,
  loading: !isDevMode,
  isPremium: isDevMode,
  isDevMode,

  initialize: () => {
    if (isDevMode) {
      set({ loading: false, isPremium: true });
      return;
    }

    set({ loading: true });

    // Handle initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        set({ user: session.user });
        get().fetchProfile();
      } else {
        // Only reset to null if user is not already set to 'guest' by guest button
        set((state) => ({
          user: state.user === 'guest' ? 'guest' : null,
          profile: null,
          isPremium: false,
          loading: false
        }));
      }
    });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        set({ user: session.user });
        get().fetchProfile();
      } else {
        if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, isPremium: false, loading: false });
        }
      }
    });
  },

  signInWithGoogle: async () => {
    if (isDevMode) return;
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      console.error('Google Sign In Error:', error.message);
      set({ loading: false });
    }
  },

  signOut: async () => {
    if (isDevMode) return;
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, isPremium: false, loading: false });
  },

  fetchProfile: async () => {
    if (isDevMode) return;
    const { user } = get();
    if (!user || user === 'guest') {
      set({ loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Fetch profile error:', error.message);
        set({ profile: null, isPremium: false, loading: false });
      } else {
        const isPremiumActive = data?.premium_until && new Date(data.premium_until) > new Date();
        set({
          profile: data,
          isPremium: !!isPremiumActive,
          loading: false
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      set({ loading: false });
    }
  },

  refreshPremiumStatus: async () => {
    await get().fetchProfile();
  },

  setGuestMode: () => {
    if (isDevMode) return;
    set({ user: 'guest', profile: null, isPremium: false, loading: false });
  }
}));
