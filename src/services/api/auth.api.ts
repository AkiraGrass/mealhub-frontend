import type { ApiEnvelope } from '@/types/api';
import type { AuthTokens, LoginPayload, RegisterPayload, RegisteredUser } from '@/types/auth';
import { httpClient } from '@/services/http/client';

export const loginApi = async (payload: LoginPayload): Promise<AuthTokens> => {
  const response = await httpClient.post<ApiEnvelope<AuthTokens>>('/auth/login', payload);
  return response.data.data as AuthTokens;
};

export const refreshApi = async (refreshToken: string): Promise<AuthTokens> => {
  const response = await httpClient.post<ApiEnvelope<AuthTokens>>('/auth/refresh', { refreshToken });
  return response.data.data as AuthTokens;
};

export const registerApi = async (payload: RegisterPayload): Promise<RegisteredUser> => {
  const response = await httpClient.post<ApiEnvelope<RegisteredUser>>('/auth/register', payload);
  return response.data.data as RegisteredUser;
};

export const logoutApi = async (refreshToken: string): Promise<void> => {
  await httpClient.post<ApiEnvelope<null>>('/auth/logout', { refreshToken });
};
