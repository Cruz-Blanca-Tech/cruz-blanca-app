import { FileSpreadsheet, FileX, ScanSearch } from 'lucide-react';

import type { ReportDescriptor } from '../types/report';

/**
 * Catálogo de reportes CSV disponibles para descarga. Es la fuente única que
 * recorre `ReportesScreen` para pintar una tarjeta por reporte. El `id` de cada
 * descriptor debe coincidir con las claves de la allowlist del route handler
 * `/api/reporting-export/[report]` (el backend rechaza cualquier otra clave).
 *
 * El orden aquí es el orden de aparición en la grilla.
 */
export const REPORTS_CATALOG: ReportDescriptor[] = [
  {
    id: 'beneficiaries-master',
    label: 'Padrón maestro de beneficiarios',
    description:
      'Listado consolidado de todos los beneficiarios con sus datos demográficos.',
    filename: 'reporte_maestro_beneficiarios.csv',
    icon: FileSpreadsheet,
  },
  {
    id: 'rejected-cases',
    label: 'Casos rechazados',
    description:
      'Expedientes rechazados en el triaje con sus motivos, para análisis operativo.',
    filename: 'operaciones_casos_rechazados.csv',
    icon: FileX,
  },
  {
    id: 'ocr-audit',
    label: 'Auditoría OCR',
    description:
      'Traza del procesamiento OCR por documento para auditar la calidad de la extracción.',
    filename: 'operaciones_auditoria_ocr.csv',
    icon: ScanSearch,
  },
];
