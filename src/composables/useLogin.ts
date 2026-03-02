import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { trackEvent } from '@/utils/telemetry';

export const useLogin = () => {
  const authStore = useAuthStore();
  const router = useRouter();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const submitLogin = async (credential: string, password: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const payload = credential.includes('@')
        ? { email: credential, password, deviceType: 'WEB' as const }
        : { phone: credential, password, deviceType: 'WEB' as const };

      await authStore.login(payload);
      await router.push({ name: 'restaurants-list' });
    } catch {
      error.value = '登入失敗，請檢查帳號密碼';
      trackEvent('auth_login_failure');
    } finally {
      loading.value = false;
    }
  };

  const clearError = (): void => {
    error.value = null;
  };

  return {
    loading,
    error,
    submitLogin,
    clearError
  };
};
