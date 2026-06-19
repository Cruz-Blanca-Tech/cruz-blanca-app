export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  errors?: Array<{ msg?: string; message?: string }>;
}
