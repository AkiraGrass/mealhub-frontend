import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { mapApiError } from './error-mapper';

type RetryConfig = InternalAxiosRequestConfig & {
  _isRetry?: boolean;
  _authRetry?: boolean;
};

interface InterceptorOptions {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  refreshSession: (refreshToken: string) => Promise<string | null>;
  onRefreshFail: () => void;
}

export const setupHttpInterceptors = (client: AxiosInstance, options: InterceptorOptions): void => {
  client.interceptors.request.use((config) => {
    const url = config.url ?? '';
    const isPublicAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    const token = options.getAccessToken();
    if (token && !isPublicAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      if (response.data?.status === '9999') {
        return Promise.reject({
          message: mapApiError(response.status, response.data?.message),
          response
        });
      }
      return response;
    },
    async (error: AxiosError) => {
      const config = (error.config || {}) as RetryConfig;
      const status = error.response?.status;

      if (status === 401 && !config._authRetry) {
        config._authRetry = true;
        const refreshToken = options.getRefreshToken();
        if (!refreshToken) {
          options.onRefreshFail();
          return Promise.reject(error);
        }
        const newAccessToken = await options.refreshSession(refreshToken);
        if (!newAccessToken) {
          options.onRefreshFail();
          return Promise.reject(error);
        }
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(config);
      }

      const shouldRetry = (!status || status >= 500) && !config._isRetry;
      if (shouldRetry) {
        config._isRetry = true;
        return client(config);
      }

      return Promise.reject({
        ...error,
        userMessage: mapApiError(status, (error.response?.data as { message?: string })?.message)
      });
    }
  );
};
