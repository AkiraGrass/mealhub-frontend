import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerApi } from '@/services/api/auth.api';
import type { RegisterFieldErrors, RegisterFormInput, RegisterPayload } from '@/types/auth';
import { trackEvent } from '@/utils/telemetry';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePayload = (form: RegisterFormInput): RegisterPayload => {
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();

  return {
    firstName,
    lastName,
    password: form.password,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {})
  };
};

const validateForm = (form: RegisterFormInput): RegisterFieldErrors => {
  const errors: RegisterFieldErrors = {};
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();

  if (!firstName) {
    errors.firstName = '請輸入名字';
  }
  if (!lastName) {
    errors.lastName = '請輸入姓氏';
  }
  if (!email && !phone) {
    errors.email = '請輸入 Email 或手機';
    errors.phone = '請輸入 Email 或手機';
  }
  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = 'Email 格式不正確';
  }
  if (form.password.length < 8) {
    errors.password = '密碼至少需要 8 個字元';
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '確認密碼與密碼不一致';
  }

  return errors;
};

const getMessageKey = (error: unknown): string | null => {
  const candidate = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
  return typeof candidate === 'string' ? candidate : null;
};

export const useRegister = () => {
  const router = useRouter();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const fieldErrors = ref<RegisterFieldErrors>({});

  const clearError = (): void => {
    error.value = null;
  };

  const submitRegister = async (form: RegisterFormInput): Promise<boolean> => {
    fieldErrors.value = validateForm(form);
    error.value = null;

    if (Object.keys(fieldErrors.value).length > 0) {
      return false;
    }

    loading.value = true;
    try {
      const payload = normalizePayload(form);
      await registerApi(payload);
      trackEvent('auth_register_success', {
        hasEmail: Boolean(payload.email),
        hasPhone: Boolean(payload.phone)
      });
      const credential = payload.email ?? payload.phone ?? '';
      await router.push({ name: 'login', query: { registered: '1', credential } });
      return true;
    } catch (caught) {
      const messageKey = getMessageKey(caught);
      error.value = (caught as { userMessage?: string }).userMessage ?? '註冊失敗，請稍後再試';
      trackEvent('auth_register_failure', {
        messageKey: messageKey ?? 'unknown'
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    fieldErrors,
    submitRegister,
    clearError
  };
};
