# cruz-blanca-app — Frontend (Next.js) de Cruz Blanca

Aplicación web del sistema de gestión documental de la Asociación Cruz Blanca
(proyecto de tesis). Consume el backend (FastAPI, repo `backend-api`) y cubre
los flujos de **carga de lotes + OCR**, **triaje y corrección manual** de
expedientes y la gestión/monitoreo del maestro de beneficiarios (MDM).

## Requisitos

- Node.js 20+ (el Dockerfile usa `node:20-alpine`)
- Backend corriendo localmente (`backend-api`) o una URL base remota

## Puesta en marcha local

```bash
npm ci
npm run dev
```

Abrir `http://localhost:3000`.

La URL del backend se configura por variable de entorno
(`NEXT_PUBLIC_BACKEND_BASE_URL`; en local el frontend usa un proxy
`/api/proxy` hacia el backend) y se inyecta como build-arg en el despliegue.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (Next.js) |
| `npm run start` | Servir el build de producción |
| `npm run lint` | ESLint (debe dar 0 errores; los warnings no bloquean) |
| `npm run typecheck` | `tsc --noEmit` (typecheck estricto) |

## Módulos principales

- **`src/features/triaje`** — pantalla de corrección de expedientes EDUCA:
  match con el maestro (MDM) al escribir el DNI (spinner "Buscando en MDM…"),
  campos de identidad protegidos ante match, sección de sugerencias IA
  (AI_INSIGHT) y banners de agrupación/errores. Los endpoints están en
  `src/features/triaje/services/*`.
- **`src/features/carga-datos`** — subida de lotes desde Google Drive y OCR.
- **`src/shared` / `src/components/ui`** — infraestructura compartida
  (cliente API, parseo zod, hooks) y kit de UI.

## Despliegue y automatización

- **CI** (`.github/workflows/ca-cruzblanca-frontend-AutoDeployTrigger.yml`):
  job `quality` (`typecheck` + `lint`) + job `build-and-deploy` (Docker →
  Azure Container Apps `ca-cruzblanca-frontend`).
- **Flujo de ramas**: `feat/*` → PR a `develop` → PR a `master`; el push a
  `main`/`master` dispara el deploy automático.