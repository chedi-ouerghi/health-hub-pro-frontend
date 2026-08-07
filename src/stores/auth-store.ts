import { create } from "zustand";
import type { User } from "../types/auth.types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (user: User, accessToken: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  setSession: (user: User, accessToken: string, refreshToken?: string) =>
    set({
      user,
      accessToken,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
    }),

  setTokens: (accessToken: string, refreshToken: string) =>
    set({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
    }),

  setAccessToken: (accessToken: string) =>
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken),
    }),

  setRefreshToken: (refreshToken: string) =>
    set({
      refreshToken,
    }),

  setUser: (user: User | null) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),

  clearSession: () =>
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    }),
}));
