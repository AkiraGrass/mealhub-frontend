import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { loginApi, logoutApi, refreshApi } from '@/services/api/auth.api';
import type { AuthTokens, LoginPayload } from '@/types/auth';
import { trackEvent } from '@/utils/telemetry';

const REFRESH_TOKEN_KEY = 'mealhub.refreshToken';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  const tokenType = ref<'Bearer' | null>(null);
  const expiresIn = ref<number | null>(null);
  const lastRefreshAt = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(accessToken.value));

  const setTokens = (tokens: AuthTokens): void => {
    accessToken.value = tokens.accessToken;
    refreshToken.value = tokens.refreshToken;
    tokenType.value = tokens.tokenType;
    expiresIn.value = tokens.expiresIn;
    lastRefreshAt.value = new Date().toISOString();
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  };

  const clearTokens = (): void => {
    accessToken.value = null;
    refreshToken.value = null;
    tokenType.value = null;
    expiresIn.value = null;
    lastRefreshAt.value = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  const login = async (payload: LoginPayload): Promise<void> => {
    const tokens = await loginApi(payload);
    setTokens(tokens);
    trackEvent('auth_login_success');
  };

  const refreshSession = async (): Promise<string | null> => {
    if (!refreshToken.value) {
      return null;
    }
    try {
      const tokens = await refreshApi(refreshToken.value);
      setTokens(tokens);
      return tokens.accessToken;
    } catch {
      clearTokens();
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    const token = refreshToken.value;
    try {
      if (token) {
        await logoutApi(token);
      }
    } finally {
      clearTokens();
      trackEvent('auth_logout');
    }
  };

  const bootstrap = async (): Promise<void> => {
    if (refreshToken.value && !accessToken.value) {
      await refreshSession();
    }
  };

  return {
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
    lastRefreshAt,
    isAuthenticated,
    setTokens,
    clearTokens,
    login,
    refreshSession,
    logout,
    bootstrap
  };
});

