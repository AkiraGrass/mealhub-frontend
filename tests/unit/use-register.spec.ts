import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RegisterFormInput } from '@/types/auth';

const pushMock = vi.fn(async () => undefined);
const registerApiMock = vi.fn();
const trackEventMock = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock('@/services/api/auth.api', () => ({
  registerApi: (...args: unknown[]) => registerApiMock(...args)
}));

vi.mock('@/utils/telemetry', () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args)
}));

import { useRegister } from '@/composables/useRegister';

const validInput: RegisterFormInput = {
  firstName: 'Akira',
  lastName: 'Lin',
  email: 'akira@example.com',
  phone: '',
  password: 'password123',
  confirmPassword: 'password123'
};

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns field errors when input is invalid', async () => {
    const { submitRegister, fieldErrors } = useRegister();
    const result = await submitRegister({
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      phone: '',
      password: '123',
      confirmPassword: '456'
    });

    expect(result).toBe(false);
    expect(fieldErrors.value.firstName).toBe('請輸入名字');
    expect(fieldErrors.value.lastName).toBe('請輸入姓氏');
    expect(fieldErrors.value.email).toBe('Email 格式不正確');
    expect(fieldErrors.value.password).toBe('密碼至少需要 8 個字元');
    expect(fieldErrors.value.confirmPassword).toBe('確認密碼與密碼不一致');
    expect(registerApiMock).not.toHaveBeenCalled();
  });

  it('submits register payload and redirects to login on success', async () => {
    registerApiMock.mockResolvedValue({ id: 1 });
    const { submitRegister } = useRegister();
    const result = await submitRegister({
      ...validInput,
      firstName: ' Akira ',
      lastName: ' Lin '
    });

    expect(result).toBe(true);
    expect(registerApiMock).toHaveBeenCalledWith({
      firstName: 'Akira',
      lastName: 'Lin',
      email: 'akira@example.com',
      password: 'password123'
    });
    expect(trackEventMock).toHaveBeenCalledWith(
      'auth_register_success',
      expect.objectContaining({ hasEmail: true, hasPhone: false })
    );
    expect(pushMock).toHaveBeenCalledWith({
      name: 'login',
      query: { registered: '1', credential: 'akira@example.com' }
    });
  });

  it('captures API failure and tracks register failure event', async () => {
    registerApiMock.mockRejectedValue({
      userMessage: '輸入資料有誤，請檢查後重試',
      response: { data: { message: 'validationError' } }
    });
    const { submitRegister, error } = useRegister();
    const result = await submitRegister(validInput);

    expect(result).toBe(false);
    expect(error.value).toBe('輸入資料有誤，請檢查後重試');
    expect(trackEventMock).toHaveBeenCalledWith(
      'auth_register_failure',
      expect.objectContaining({ messageKey: 'validationError' })
    );
  });
});
