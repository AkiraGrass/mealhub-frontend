import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/services/api/auth.api', () => ({
  loginApi: vi.fn(async () => ({
    accessToken: 'access',
    refreshToken: 'refresh',
    tokenType: 'Bearer',
    expiresIn: 900
  })),
  refreshApi: vi.fn(async () => ({
    accessToken: 'new-access',
    refreshToken: 'refresh',
    tokenType: 'Bearer',
    expiresIn: 900
  })),
  logoutApi: vi.fn(async () => undefined)
}));

import { useAuthStore } from '@/stores/auth.store';

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('stores tokens after login', async () => {
    const store = useAuthStore();
    await store.login({ email: 'a@b.com', password: 'pass', deviceType: 'WEB' });

    expect(store.isAuthenticated).toBe(true);
    expect(store.accessToken).toBe('access');
    expect(localStorage.getItem('mealhub.refreshToken')).toBe('refresh');
  });

  it('clears tokens on logout', async () => {
    const store = useAuthStore();
    store.setTokens({
      accessToken: 'access',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 900
    });

    await store.logout();
    expect(store.isAuthenticated).toBe(false);
  });
});

