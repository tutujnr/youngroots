import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAnonymous: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.login({ email, password });
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          // Decode role from JWT payload (simple base64 decode, no verification needed client-side)
          const payload = JSON.parse(atob(data.access.split('.')[1]));
          const user = { role: payload.role, display_name: payload.display_name, email };
          set({ user, isAnonymous: false, isLoading: false });
          return { success: true, user };
        } catch (err) {
          const msg = err.response?.data?.detail || 'Invalid email or password.';
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      startAnonymousSession: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.getAnonymousToken();
          localStorage.setItem('anon_token', data.token);
          set({ user: { id: data.user_id, role: 'youth', is_anonymous_user: true }, isAnonymous: true, isLoading: false });
          return { success: true };
        } catch {
          set({ isLoading: false });
          return { success: false };
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('anon_token');
        set({ user: null, isAnonymous: false });
      },

      isAdmin: () => ['admin', 'super_admin'].includes(get().user?.role),
      isSuperAdmin: () => get().user?.role === 'super_admin',
      isAdvocate: () => ['advocate', 'admin', 'super_admin'].includes(get().user?.role),

      loadProfile: async () => {
        try {
          const { data } = await authAPI.getProfile();
          set({ user: data });
        } catch {
          get().logout();
        }
      },
    }),
    { name: 'youngroots-auth', partialize: (s) => ({ user: s.user, isAnonymous: s.isAnonymous }) }
  )
);

export default useAuthStore;
