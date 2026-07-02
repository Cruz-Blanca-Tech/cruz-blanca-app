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
  /**
   * Detalle de un lote en el contexto de Triaje (casos del lote, aprobación y
   * rechazo masivos). OJO: aquí el prefijo es SIMPLE (`/api/v1/triage/batch`),
   * a diferencia del doble `/api/v1` de `batches`. El `batch_router` del triaje
   * (`APIRouter(prefix="/batch")`, singular) se incluye SIN prefijo extra en el
   * `triage_app`, que se monta en `{API_V1_STR}/triage` (ver src/main.py:103 y
   * data_quality_triage/presentation/api/routes.py). Lo consume `triaje`.
   */
  batch: '/api/v1/triage/batch',
  /**
   * Corrección de un expediente EDUCA en el contexto de Triaje (lectura del
   * expediente, guardado de correcciones y rechazo). Prefijo SIMPLE, igual que
   * `batch`: el `educa_router` (`APIRouter(prefix="/educa")`) se incluye SIN
   * prefijo extra en el `triage_app`, montado en `{API_V1_STR}/triage` (ver
   * src/main.py:103, data_quality_triage/presentation/api/__init__.py:15 y
   * educa_router.py:20). Lo consume la pantalla TriajeCorreccion.
   */
  educa: '/api/v1/triage/educa',
  /**
   * Contexto Core Beneficiary Management (MDM — Master Data Management).
   * El `beneficiary_router` (`APIRouter(prefix="/beneficiaries")`) se incluye SIN
   * prefijo extra en el `beneficiary_app`, que se monta en `{API_V1_STR}/mdm`
   * (ver src/main.py:104, core_beneficiary_management/presentation/api/routes.py:24
   * y beneficiary_router.py:16). Prefijo SIMPLE. Lo consume el feature `beneficiarios`.
   */
  beneficiaries: '/api/v1/mdm/beneficiaries',
  /**
   * Contexto Reporting & Analytics. El `reporting_app` se monta en
   * `{API_V1_STR}/reporting` (ver src/main.py), y sus routers (`operations`,
   * `demographics`) se incluyen SIN prefijo extra, así que las rutas reales son
   * la composición `/api/v1/reporting/<router>/<métrica>`. Prefijo SIMPLE. Lo
   * consume el feature `dashboard` (las 5 métricas de analítica). Los `/exports/*`
   * (feature `reportes`) NO pasan por aquí.
   */
  reporting: '/api/v1/reporting',
  /**
   * Gestión de usuarios (contexto de seguridad/autenticación). El `security_app`
   * se monta en `/auth` y el `user_router` (`APIRouter(prefix="/users")`) se
   * incluye SIN prefijo extra, así que la ruta real es la composición
   * `/auth/users`. Prefijo SIMPLE. Lo consume el feature `usuarios` (listado en
   * `GET /auth/users/` y cambio de rol en `PATCH /auth/users/{id}/role`).
   */
  users: '/auth/users',
} as const;
