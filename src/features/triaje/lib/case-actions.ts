/**
 * Qué se puede hacer con un expediente según su estado y el de su lote.
 *
 * La frontera de irreversibilidad es la CARGA AL REGISTRO DE BENEFICIARIOS, no la
 * aprobación: aprobar por sí solo no cierra nada, porque la carga es sincrónica y
 * si falla el expediente queda con `sync_status = FAILED`, editable y reintentable.
 * Lo que cierra el expediente es que el beneficiario ya exista en MDM.
 *
 * Espeja `DossierStatusValidator.validate_can_be_corrected` y
 * `DossierStatusValidator.validate_can_be_rejected` del backend. Si cambia allá,
 * cambia acá: esto es UX (no ofrecer acciones que van a rebotar), la guarda real
 * vive en el servidor.
 */
import type { BatchStatus } from '../schemas/batch-status-schema';

/** Estados de expediente que ya cerraron una decisión y no admiten reprocesado. */
const FINALIZED_CASE_STATUSES: readonly string[] = ['APPROVED', 'REJECTED'];

/**
 * Estados de lote en los que la carga a beneficiarios ya ocurrió, o ya no va a
 * ocurrir. `SYNC_FAILED` NO va acá a propósito: ese estado significa "alguien no
 * llegó al MDM y hay que reintentar", así que el expediente que falló tiene que
 * seguir siendo editable. Espeja `is_batch_completed` del backend.
 */
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
  /** El expediente no admite reprocesado con IA. */
  canReprocess: boolean;
  /** Por qué está bloqueado, listo para mostrarle al operador. `null` si no lo está. */
  lockReason: string | null;
}

export function getCaseActionsState({
  caseStatus,
  syncStatus,
  batchStatus,
}: {
  caseStatus: string;
  syncStatus?: string;
  batchStatus?: BatchStatus;
}): CaseActionsState {
  // El expediente está en MDM: cerrado para todo. Ni corregir, ni rechazar, ni
  // reprocesar. Si un dato está mal se corrige en la ficha del beneficiario.
  const cargadoEnMdm = syncStatus === 'SYNCED';

  if (cargadoEnMdm) {
    return {
      canEdit: false,
      canReject: false,
      canReprocess: false,
      lockReason:
        'Este expediente ya está cargado en el registro de beneficiarios y no admite más cambios desde triaje. Si algún dato está mal, corríalo en la ficha del beneficiario.',
    };
  }

  if (caseStatus === 'REJECTED') {
    return {
      canEdit: false,
      canReject: false,
      canReprocess: false,
      lockReason: 'Este expediente fue rechazado y ya no admite cambios.',
    };
  }

  // Decidido pero sin llegar al MDM: el expediente sigue abierto a propósito.
  // Si el MDM falló por un dato, el operador lo corrige acá; si fue un detalle
  // pasajero, reintenta con el botón de sincronización. Cerrarlo lo dejaba sin
  // salida. Reprocesar con IA tampoco: la decisión ya está tomada.
  if (caseStatus === 'APPROVED') {
    return {
      canEdit: true,
      canReject: true,
      canReprocess: false,
      lockReason: null,
    };
  }

  if (!isCaseFinalized(caseStatus)) {
    return { canEdit: true, canReject: true, canReprocess: true, lockReason: null };
  }

  if (batchStatus === 'SYNCING') {
    return {
      canEdit: false,
      canReject: false,
      canReprocess: false,
      lockReason:
        'El lote se encuentra sincronizando con el registro de beneficiarios. Por favor espere.',
    };
  }

  // Si el lote ya se cargó / finalizó en MDM, ya no admite cambios ni rechazos.
  if (isBatchLoaded(batchStatus)) {
    return {
      canEdit: false,
      canReject: false,
      canReprocess: false,
      lockReason:
        'Este expediente pertenece a un lote que ya fue cargado al registro de beneficiarios. Para corregir un dato, edite la ficha del beneficiario.',
    };
  }

  return { canEdit: true, canReject: true, canReprocess: true, lockReason: null };
}
