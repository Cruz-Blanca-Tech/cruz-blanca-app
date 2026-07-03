import {
  Clock,
  Loader2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  OctagonAlert,
  type LucideIcon,
} from 'lucide-react';
import type { BatchStatus } from '../schemas/batch-status-schema';

/**
 * Presentación de cada estado de lote: etiqueta, icono y clases de color (solo
 * tokens del design system, nunca hex). Centraliza el mapeo que el mockup hacía
 * con `ESTADO_CFG` para reutilizarlo en el badge de estado y en las cards KPI.
 *
 * Notas de mapeo de tokens:
 * - PENDING usa neutros (`muted`); el mockup usaba un slate suelto.
 * - FAILED ("ERROR" del sistema) usa la familia `fault` (ámbar quemado),
 *   distinta del naranja de PROCESSING (`warning`) y del rojo de REJECTED
 *   (`error`); además se diferencia por el icono (octágono) y la etiqueta.
 */
export interface BatchStatusConfig {
  /** Etiqueta del badge de estado (mayúsculas, como en el mockup). */
  label: string;
  /** Etiqueta para los selects/cards (capitalización normal). */
  filterLabel: string;
  icon: LucideIcon;
  /** Clases del badge (fondo + texto). */
  badgeClassName: string;
  /** Clases del recuadro del icono en las cards KPI (fondo + texto). */
  kpiIconClassName: string;
  /** El icono gira (solo PROCESSING). */
  spin: boolean;
}

export const BATCH_STATUS_CONFIG: Record<BatchStatus, BatchStatusConfig> = {
  PENDING: {
    label: 'PENDIENTE',
    filterLabel: 'Pendiente',
    icon: Clock,
    badgeClassName: 'bg-muted text-ink-secondary',
    kpiIconClassName: 'bg-muted text-ink-secondary',
    spin: false,
  },
  PROCESSING: {
    label: 'PROCESANDO',
    filterLabel: 'Procesando',
    icon: Loader2,
    badgeClassName: 'bg-warning-light text-warning-dark',
    kpiIconClassName: 'bg-warning-light text-warning-dark',
    spin: true,
  },
  COMPLETED: {
    label: 'COMPLETADO',
    filterLabel: 'Por revisar',
    icon: ClipboardList,
    badgeClassName: 'bg-brand-200 text-brand-dark',
    kpiIconClassName: 'bg-brand-200 text-brand-dark',
    spin: false,
  },
  FINALIZED: {
    label: 'FINALIZADO',
    filterLabel: 'Finalizado',
    icon: CheckCircle2,
    badgeClassName: 'bg-success-light text-success-dark',
    kpiIconClassName: 'bg-success-light text-success-dark',
    spin: false,
  },
  REJECTED: {
    label: 'RECHAZADO',
    filterLabel: 'Rechazado',
    icon: XCircle,
    badgeClassName: 'bg-error-light text-error-dark',
    kpiIconClassName: 'bg-error-light text-error-dark',
    spin: false,
  },
  FAILED: {
    label: 'ERROR',
    filterLabel: 'Con error',
    icon: OctagonAlert,
    badgeClassName: 'bg-fault-light text-fault-dark',
    kpiIconClassName: 'bg-fault-light text-fault-dark',
    spin: false,
  },
};
