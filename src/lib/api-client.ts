import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiErrorPayload, RequestOptions } from './types';

export const AUTH_TOKEN_EXPIRED_EVENT = 'auth:token-expired';

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: Error) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

class ApiClient {
  private basePath = '/api/proxy';
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.basePath,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorPayload>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response) {
          const statusCode = error.response.status;
          const errorData = error.response.data;

          if (statusCode === 401 && originalRequest && !originalRequest.url?.includes('/api/auth/refresh') && !originalRequest._retry) {
            if (isRefreshing) {
              try {
                await new Promise<string>((resolve, reject) => {
                  failedQueue.push({ resolve, reject });
                });
                return this.axiosInstance(originalRequest);
              } catch (err) {
                return Promise.reject(err);
              }
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
              await axios.post('/api/auth/refresh', {}, { withCredentials: true });
              isRefreshing = false;
              processQueue(null, 'refreshed');
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              isRefreshing = false;
              processQueue(refreshError as Error, null);
              
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent(AUTH_TOKEN_EXPIRED_EVENT, { detail: { statusCode } })
                );
                setTimeout(() => {
                  window.location.href = '/auth?session_expired=true';
                }, 100);
              }
              throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            }
          }

          let errorMessage =
            statusCode === 403
              ? 'No tienes permisos para realizar esta acción.'
              : 'Error en la solicitud';
          if (errorData?.errors && errorData.errors.length > 0) {
            errorMessage = errorData.errors[0]?.msg ?? errorData.errors[0]?.message ?? errorMessage;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (errorData?.detail) {
            errorMessage = errorData.detail;
          }
          throw new Error(errorMessage);
        } else if (error.request) {
          throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw new Error(error.message || 'Error inesperado');
      }
    );
  }

  async get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
    };
    const response = await this.axiosInstance.get<T>(path, config);
    return response.data;
  }

  async post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
    };
    const response = await this.axiosInstance.post<T>(path, body, config);
    return response.data;
  }

  async put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
    };
    const response = await this.axiosInstance.put<T>(path, body, config);
    return response.data;
  }

  async patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
    };
    const response = await this.axiosInstance.patch<T>(path, body, config);
    return response.data;
  }

  async delete<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
    };
    const response = await this.axiosInstance.delete<T>(path, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
