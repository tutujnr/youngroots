/**
 * YoungRoots — Auth Store (Zustand)
 * Manages authentication state, anonymous sessions, and role checks.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      isAnonymous:  false,
      isLoading:    false,
      error:        null,

      // ── Login ──────────────────────────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.login({ email, password });
          localStorage.setItem('access_token',  data.access);
          localStorage.setItem('refresh_token', data.refresh);
          set({ user: data.user, isAnonymous: false, isLoading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      // ── Anonymous Session ──────────────────────────────────────────────────
      startAnonymousSession: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.getAnonymousToken();
          localStorage.setItem('anon_token', data.token);
          set({
            user:        { id: data.user_id, role: 'youth', is_anonymous_user: true },
            isAnonymous: true,
            isLoading:   false,
          });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false };
        }
      },

      // ── Logout ─────────────────────────────────────────────────────────────
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('anon_token');
        set({ user: null, isAnonymous: false });
      },

      // ── Role helpers ───────────────────────────────────────────────────────
      isAdmin:    () => ['admin', 'super_admin'].includes(get().user?.role),
      isAdvocate: () => ['advocate', 'admin', 'super_admin'].includes(get().user?.role),
      isYouth:    () => get().user?.role === 'youth',

      // ── Load profile ───────────────────────────────────────────────────────
      loadProfile: async () => {
        try {
          const { data } = await authAPI.getProfile();
          set({ user: data });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name:    'youngroots-auth',
      partialize: (state) => ({ user: state.user, isAnonymous: state.isAnonymous }),
    }
  )
);

export default useAuthStore;
