import { describe, expect, it } from 'vitest';
import { getCaseActionsState, isBatchLoaded, isCaseFinalized } from './case-actions';

describe('estado del expediente y del lote', () => {
  it('APPROVED y REJECTED son decisiones finales', () => {
    expect(isCaseFinalized('APPROVED')).toBe(true);
    expect(isCaseFinalized('REJECTED')).toBe(true);
    expect(isCaseFinalized('PENDING')).toBe(false);
  });

  it('SYNC_FAILED no cuenta como lote cargado (debe poder reintentarse)', () => {
    expect(isBatchLoaded('FINALIZED')).toBe(true);
    expect(isBatchLoaded('REJECTED')).toBe(true);
    expect(isBatchLoaded('SYNC_FAILED')).toBe(false);
    expect(isBatchLoaded(undefined)).toBe(false);
  });
});

describe('getCaseActionsState', () => {
  it('un expediente ya cargado en el MDM queda cerrado', () => {
    const s = getCaseActionsState({ caseStatus: 'APPROVED', syncStatus: 'SYNCED' });
    expect(s).toMatchObject({ canEdit: false, canReject: false, canReprocess: false });
    expect(s.lockReason).toContain('ya está cargado');
  });

  it('un expediente rechazado no admite cambios', () => {
    const s = getCaseActionsState({ caseStatus: 'REJECTED' });
    expect(s).toMatchObject({ canEdit: false, canReject: false, canReprocess: false });
    expect(s.lockReason).not.toBeNull();
  });

  it('aprobado pero no sincronizado: se puede corregir, pero no reprocesar con IA', () => {
    expect(getCaseActionsState({ caseStatus: 'APPROVED', syncStatus: 'FAILED' })).toEqual({
      canEdit: true,
      canReject: true,
      canReprocess: false,
      lockReason: null,
    });
  });

  it('un expediente pendiente admite todas las acciones', () => {
    expect(getCaseActionsState({ caseStatus: 'PENDING', batchStatus: 'COMPLETED' })).toEqual({
      canEdit: true,
      canReject: true,
      canReprocess: true,
      lockReason: null,
    });
  });
});
