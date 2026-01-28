import type { UserInfo } from '@hermit/protocol/types.js';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  setAuth: (token: string, refreshToken: string, user: UserInfo) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      isAuthenticated: () => get().token !== null,
    }),
    { name: 'hermit-auth' },
  ),
);
