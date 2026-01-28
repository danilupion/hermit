import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      user: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have initial state with null values', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should return false for isAuthenticated when no token', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated()).toBe(false);
  });

  it('should set auth state correctly', () => {
    const { setAuth } = useAuthStore.getState();
    const user = { id: 'user-1', email: 'test@example.com' };

    setAuth('access-token', 'refresh-token', user);

    const state = useAuthStore.getState();
    expect(state.token).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated()).toBe(true);
  });

  it('should clear auth state on logout', () => {
    const { setAuth, logout } = useAuthStore.getState();
    const user = { id: 'user-1', email: 'test@example.com' };

    setAuth('access-token', 'refresh-token', user);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);

    logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });
});
