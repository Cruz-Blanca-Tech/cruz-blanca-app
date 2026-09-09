/**
 * Qué se puede hacer con un expediente según su estado y el de su lote.
 *
 * La frontera de irreversibilidad NO es la aprobación del expediente sino la
 * carga del lote al registro de beneficiarios: hasta ese momento un aprobado
 * todavía se puede revertir, porque no hay ningún beneficiario escrito en MDM
 * que haya que compensar. Después, sí.
 *
 * Espeja `RejectDossierUseCase._ensure_rejectable` y
 * `BatchStatusValidatorAdapter.is_batch_completed` del backend. Si cambia allá,
 * cambia acá: esto es UX (no ofrecer acciones que van a rebotar), la guarda real
 * vive en el servidor.
 */
import type { BatchStatus } from '../schemas/batch-status-schema';

/** Estados de expediente que ya cerraron una decisión (espeja `TriageCase.is_finalized`). */
const FINALIZED_CASE_STATUSES: readonly string[] = ['APPROVED', 'REJECTED'];

/** Estados de lote en los que la carga a beneficiarios ya ocurrió, o ya no va a ocurrir. */
const LOADED_BATCH_STATUSES: readonly BatchStatus[] = [
  'FINALIZED',
  'FAILED',
  'REJECTED',
];

export function isCaseFinalized(caseStatus: string): boolean {
  return FINALIZED_CASE_STATUSES.includes(caseStatus);
}

export function isBatchLoaded(batchStatus: BatchStatus | undefined): boolean {
  return batchStatus !== undefined && LOADED_BATCH_STATUSES.includes(batchStatus);
}

export interface CaseActionsState {
  /** Los campos del expediente admiten edición y el guardado tiene sentido. */
  canEdit: boolean;
  /** El expediente todavía admite rechazo. */
  canReject: boolean;
  /** Por qué está bloqueado, listo para mostrarle al operador. `null` si no lo está. */
  lockReason: string | null;
}

export function getCaseActionsState({
  caseStatus,
  batchStatus,
}: {
  caseStatus: string;
  batchStatus?: BatchStatus;
}): CaseActionsState {
  if (!isCaseFinalized(caseStatus)) {
    return { canEdit: true, canReject: true, lockReason: null };
  }

  if (caseStatus === 'REJECTED') {
    return {
      canEdit: false,
      canReject: false,
      lockReason: 'Este expediente fue rechazado y ya no admite cambios.',
    };
  }

  if (batchStatus === 'SYNCING') {
    return {
      canEdit: false,
      canReject: false,
      lockReason:
        'El lote se encuentra sincronizando con el registro de beneficiarios. Por favor espere.',
    };
  }

  // Si el lote ya se cargó / finalizó en MDM, ya no admite cambios ni rechazos.
  if (isBatchLoaded(batchStatus)) {
    return {
      canEdit: false,
      canReject: false,
      lockReason:
        'Este expediente pertenece a un lote que ya fue cargado al registro de beneficiarios. Para corregir un dato, edite la ficha del beneficiario.',
    };
  }

  // Si el expediente está aprobado pero el lote todavía está abierto (no finalizado en MDM),
  // SÍ se permite editar y guardar correcciones, y también rechazarlo si fuera necesario.
  if (caseStatus === 'APPROVED') {
    return {
      canEdit: true,
      canReject: true,
      lockReason: null,
    };
  }

  return { canEdit: true, canReject: true, lockReason: null };
}
