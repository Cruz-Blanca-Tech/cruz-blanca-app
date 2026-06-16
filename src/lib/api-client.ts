import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiErrorPayload, RequestOptions } from './types';

export const AUTH_TOKEN_EXPIRED_EVENT = 'auth:token-expired';

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
      (error: AxiosError<ApiErrorPayload>) => {
        if (error.response) {
          const statusCode = error.response.status;
          const errorData = error.response.data;

          if (statusCode === 401 || statusCode === 403) {
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

          let errorMessage = 'Error en la solicitud';
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
