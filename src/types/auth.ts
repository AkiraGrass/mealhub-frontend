export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthSession {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  lastRefreshAt: string | null;
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password: string;
  deviceType: 'WEB';
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterFormInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterFormInput, string>>;

export interface RegisteredUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}
