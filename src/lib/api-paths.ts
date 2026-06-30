/**
 * Prefijos de URL de los contextos del backend que se resuelven contra el proxy
 * (`/api/proxy`, el `baseURL` del `apiClient`, que inyecta el Bearer).
 *
 * Sobre el slash final: las rutas del backend usan slash final (`/programs/`,
 * `/activities/`, …), pero Next redirige para quitar el slash final por defecto
 * (`trailingSlash: false`). Lo omitimos en los services y dejamos que el
 * `redirect_slashes` de FastAPI lo resuelva del lado del servidor (307 → ruta
 * con slash).
 */
export const API_PATHS = {
  /**
   * Contexto Document Intake & OCR.
   * En el backend `intake_app` se monta en `{API_V1_STR}/intake` (ver src/main.py).
   */
  intake: '/api/v1/intake',
  /**
   * Batches de extracción. El doble `/api/v1` no es un error: el `batch_router`
   * se registró con prefijo absoluto `/api/v1/batches` DENTRO de `intake_app`
   * (montada en `/api/v1/intake`), así que la ruta real es la composición de
   * ambos. Lo consumen `carga-datos` (creación) y `triaje` (lecturas: summary,
   * statuses, listado), por eso se centraliza aquí en vez de repetir el literal.
   */
  batches: '/api/v1/intake/api/v1/batches',
} as const;
