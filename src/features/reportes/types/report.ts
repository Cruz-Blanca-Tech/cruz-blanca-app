import type { LucideIcon } from 'lucide-react';

/**
 * Descriptor de un reporte CSV descargable. Es la unidad que recorre la pantalla
 * de Reportes para pintar una tarjeta por exportación disponible.
 *
 * - `id`: clave del reporte; coincide con el segmento del route handler de
 *   descarga (`/api/reporting-export/[report]`) y con la allowlist del backend.
 * - `filename`: nombre con el que el navegador guarda el archivo (atributo
 *   `download` del `<a>` temporal). Nombres legibles en español.
 * - `label` / `description`: textos legibles de la tarjeta.
 * - `icon`: icono de `lucide-react` representativo del reporte.
 */
export interface ReportDescriptor {
  id: string;
  label: string;
  description: string;
  filename: string;
  icon: LucideIcon;
}
