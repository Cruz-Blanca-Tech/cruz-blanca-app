import {
  Zap,
  TriangleAlert,
  UserCheck,
  UserX,
  type LucideIcon,
} from 'lucide-react';

/**
 * Veredictos de triaje que se muestran como chips de desglose de expedientes.
 * Las claves coinciden con el enum `TriageVerdict` del backend
 * (data_quality_triage/.../triage_status.py): los conteos llegan en
 * `triage_summary.verdicts` con estas mismas claves.
 *
 * El desglose recorre SOLO estas claves conocidas; cualquier clave ausente se
 * trata como 0 y cualquier clave desconocida del backend se ignora (el record
 * es abierto), de modo que la UI nunca rompe ante un veredicto nuevo.
 */
export const TRIAGE_VERDICT_KEYS = [
  'AUTO_APPROVED',
  'REQUIRES_TRIAGE',
  'MANUALLY_APPROVED',
  'MANUALLY_REJECTED',
] as const;

export type TriageVerdictKey = (typeof TRIAGE_VERDICT_KEYS)[number];

export interface TriageVerdictConfig {
  key: TriageVerdictKey;
  /** Texto descriptivo (tooltip del chip y etiqueta de la leyenda). */
  label: string;
  icon: LucideIcon;
  /** Clases del chip (fondo + texto), solo tokens del design system. */
  chipClassName: string;
  /** Clase de color del icono en la leyenda. */
  legendIconClassName: string;
}

export const TRIAGE_VERDICT_CONFIG: Record<TriageVerdictKey, TriageVerdictConfig> = {
  AUTO_APPROVED: {
    key: 'AUTO_APPROVED',
    label: 'Aprobado automático',
    icon: Zap,
    chipClassName: 'bg-success-light text-success-dark',
    legendIconClassName: 'text-success-dark',
  },
  REQUIRES_TRIAGE: {
    key: 'REQUIRES_TRIAGE',
    label: 'Requiere triaje',
    icon: TriangleAlert,
    chipClassName: 'bg-warning-light text-warning-dark',
    legendIconClassName: 'text-warning-dark',
  },
  MANUALLY_APPROVED: {
    key: 'MANUALLY_APPROVED',
    label: 'Aprobado manual',
    icon: UserCheck,
    chipClassName: 'bg-brand-200 text-brand-dark',
    legendIconClassName: 'text-brand-dark',
  },
  MANUALLY_REJECTED: {
    key: 'MANUALLY_REJECTED',
    label: 'Rechazado manual',
    icon: UserX,
    chipClassName: 'bg-error-light text-error-dark',
    legendIconClassName: 'text-error-dark',
  },
};

export const TRIAGE_VERDICT_LIST: TriageVerdictConfig[] =
  TRIAGE_VERDICT_KEYS.map((key) => TRIAGE_VERDICT_CONFIG[key]);
