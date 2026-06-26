/**
 * Tipos mínimos de Google Identity Services (oauth2) y de la Google Picker API.
 *
 * Ambas se cargan en runtime como scripts externos (`accounts.google.com/gsi/client`
 * y `apis.google.com/js/api.js`) y no publican tipos en npm, por lo que se declaran
 * a mano. Solo se modelan los miembros que usa el selector de Drive.
 *
 * `window.google` ya está tipado de forma acotada por el login (solo `accounts.id`),
 * por lo que NO se augmenta globalmente aquí: el componente accede a estas APIs con
 * un cast explícito a `GoogleApi` para evitar conflictos de declaración.
 */

/** Respuesta del flujo de token de Google Identity Services. */
export interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

/** Cliente de token devuelto por `initTokenClient`. */
export interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

/** Configuración de `initTokenClient` (modelo moderno, reemplaza a `gapi.auth`). */
export interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: { type?: string; message?: string }) => void;
}

export interface GoogleOAuth2 {
  initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
}

/** Documento devuelto por el Picker en `response.docs`. */
export interface PickerDocument {
  id: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  url?: string;
}

/** Payload del callback del Picker (google.picker.ResponseObject). */
export interface PickerResponse {
  action: string;
  docs?: PickerDocument[];
}

/** Vista de documentos del Picker (resultado de `new DocsView(...)`). */
export interface PickerView {
  /** Muestra las carpetas para poder navegar dentro de ellas. */
  setIncludeFolders: (include: boolean) => PickerView;
  /** Si es false, las carpetas son navegables pero no seleccionables. */
  setSelectFolderEnabled: (enabled: boolean) => PickerView;
  setOwnedByMe?: (ownedByMe: boolean) => PickerView;
}

/** Builder fluido del Picker. */
export interface PickerBuilder {
  addView: (view: PickerView) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setAppId: (appId: string) => PickerBuilder;
  enableFeature: (feature: string) => PickerBuilder;
  setCallback: (callback: (response: PickerResponse) => void) => PickerBuilder;
  setTitle: (title: string) => PickerBuilder;
  build: () => PickerInstance;
}

export interface PickerInstance {
  setVisible: (visible: boolean) => void;
}

/** Namespace `google.picker` expuesto tras `gapi.load('picker', ...)`. */
export interface GooglePickerNamespace {
  PickerBuilder: new () => PickerBuilder;
  DocsView: new (viewId?: string) => PickerView;
  ViewId: { DOCS: string };
  Feature: { MULTISELECT_ENABLED: string };
  Action: { PICKED: string; CANCEL: string };
}

/** Forma del global `window.google` que necesita el selector de Drive. */
export interface GoogleApi {
  accounts: {
    oauth2: GoogleOAuth2;
  };
  picker: GooglePickerNamespace;
}

/** Cargador de módulos de la librería `gapi` (`apis.google.com/js/api.js`). */
export interface GapiApi {
  load: (apiName: string, callback: () => void) => void;
}

declare global {
  interface Window {
    gapi?: GapiApi;
  }
}
