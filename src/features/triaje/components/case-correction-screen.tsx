'use client';

import { FormProvider } from 'react-hook-form';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Loader2,
  OctagonAlert,
  RefreshCw, Sparkles, UserCheck, Link as LinkIcon, TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

import { useCaseCorrection } from '../hooks/use-case-correction';
import { useRetryCaseSync } from '../hooks/use-triaje-queries';
import { CaseDocViewer } from './case-doc-viewer';
import { CaseFieldsForm } from './case-fields-form';
import { CaseValidationPanel } from './case-validation-panel';
import { CaseCorrectionSkeleton } from './case-correction-skeleton';
import { CaseNotFound } from './case-not-found';
import { CaseCorrectionHeader } from './case-correction-header';
import { IncompleteCasePanel } from './incomplete-case-panel';
import { CaseCorrectionActions } from './case-correction-actions';
import { UploadMissingDocModal } from './upload-missing-doc-modal';
import { useUploadMissingDoc } from '../hooks/use-upload-missing-doc';
import { useReprocessDossier } from '../hooks/use-reprocess-dossier';
import { RejectCaseDialog } from './reject-case-dialog';
import { DossierDocumentChecklist } from './dossier-document-checklist';

interface CaseCorrectionScreenProps {
  batchId: string;
  caseId: string;
  dniReference: string;
}

/** Orquestador de la corrección de un expediente (/triaje/[batchId]/[caseId]). */
export function CaseCorrectionScreen({
  batchId,
  caseId,
  dniReference,
}: CaseCorrectionScreenProps) {
  const vm = useCaseCorrection({ batchId, caseId, dniReference });
  const retryCaseSync = useRetryCaseSync(caseId, batchId);
  const reprocessMutation = useReprocessDossier(batchId, dniReference, caseId);
  const [showWarningModal, setShowWarningModal] = useState(false);

  if (vm.isLoading) return <CaseCorrectionSkeleton />;
  if (vm.isError || !vm.caseData) return <CaseNotFound onBack={vm.goBackToBatch} />;

  const { caseActions, isIncomplete } = vm;
  const isApproved = vm.caseData?.status === 'APPROVED';
  const isRejected = vm.caseData?.status === 'REJECTED';
  const isSyncFailed = vm.caseData?.sync_status === 'FAILED';
  const aiInsightDiscrepancy = vm.enrichedDiscrepancies.find(d => d.severity === 'AI_INSIGHT' && d.fieldId === 'beneficiary.dni');
  const isReprocessing = reprocessMutation.isPending;
  const canEditForm = caseActions.canEdit && !isReprocessing;
  const displayLockReason = isReprocessing ? 'Reprocesando expediente con Inteligencia Artificial. Por favor, espere unos segundos...' : caseActions.lockReason;

  const handleValidationClick = async () => {
    // 1. Validar reglas de la interfaz primero (campos vacíos, formatos incorrectos)
    const isClientValid = await vm.form.trigger();
    if (!isClientValid) {
      // Si el formulario está roto en la pantalla, dejamos que onSubmit muestre los textos rojos y NO sacamos el modal.
      vm.onSubmit();
      return;
    }

    const hasWarnings = vm.enrichedDiscrepancies.some((d) => d.severity === 'WARNING' || d.severity === 'AI_INSIGHT');
    const hasErrors = vm.enrichedDiscrepancies.some((d) => d.severity === 'ERROR');
    
    // Si la base de datos nos dice que no hay errores pero sí advertencias, y aún no está aprobado...
    if (!hasErrors && hasWarnings && !isApproved) {
      setShowWarningModal(true);
    } else {
      vm.onSubmit();
    }
  };

  const handleRetrySync = () => {
    retryCaseSync.mutate(undefined, {
      onSuccess: (res) => {
        toast.success(res.message || 'Expediente sincronizado con éxito.');
      },
      onError: (err) => {
        toast.error(err.message || 'Fallo al sincronizar con Beneficiarios.');
      },
    });
  };

  return (
    <div className="relative flex flex-1 flex-col gap-3 p-6">
      {/* Overlay de Carga (IA Reprocesando) local al área de trabajo */}
      {(isReprocessing || vm.pendingDocuments.length > 0) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-2xl">
            <Loader2 className="size-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-ink-primary">
                El expediente se está procesando por la IA
              </h3>
              <p className="mt-1 text-sm text-ink-secondary">
                {vm.pendingDocuments.length > 0 ? `Analizando ${vm.pendingDocuments.length} documento(s) en progreso...` : 'Enviando solicitud a la IA. Por favor espere...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <CaseCorrectionHeader
        caseData={vm.caseData}
        dniReference={dniReference}
        batchId={batchId}
        batchDateLabel={vm.batchDateLabel}
        currentIndex={vm.currentIndex}
        totalCases={vm.totalCases}
        prevCase={vm.prevCase}
        nextCase={vm.nextCase}
        onNavigate={vm.goToCase}
      />

      {/* Panel de validación */}
      {aiInsightDiscrepancy && (
        <div className="flex flex-col gap-2 rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-purple-600" />
              <div>
                <h4 className="font-heading text-sm font-bold text-purple-900">
                  Sugerencia de Inteligencia Artificial (Posible Duplicado)
                </h4>
                <p className="mt-0.5 font-data text-xs leading-relaxed text-purple-800">
                  {aiInsightDiscrepancy.rule_description}
                </p>
              </div>
            </div>
            {caseActions.canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-purple-300 bg-white text-purple-700 hover:bg-purple-100 hover:text-purple-800"
                onClick={() => {
                  vm.form.setValue('beneficiary.dni', aiInsightDiscrepancy.expected_pattern || '', { shouldValidate: true, shouldDirty: true });
                  toast.success('DNI actualizado con sugerencia de IA');
                }}
              >
                <LinkIcon className="mr-2 size-4" />
                Vincular (DNI: {aiInsightDiscrepancy.expected_pattern})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Banner: beneficiario ya registrado en el maestro (MDM) — identidad y
              familiares bloqueados con los valores del maestro */}
      {vm.mdmMatch && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-info/30 bg-info-light px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <UserCheck className="mt-0.5 size-5 shrink-0 text-info-dark" />
            <div>
              <h4 className="font-heading text-sm font-bold text-info-dark">
                Beneficiario ya registrado en MDM
              </h4>
              <p className="mt-0.5 font-data text-xs leading-relaxed text-info-dark/90">
                El DNI <span className="font-bold">{vm.mdmMatch.dni}</span> corresponde a{' '}
                <span className="font-bold">
                  {vm.mdmMatch.first_name} {vm.mdmMatch.last_name}
                </span>
                , ya inscrito en el registro maestro. Los campos de identidad y los familiares
                (padre/madre) se rellenaron desde el MDM y están bloqueados: al aprobar solo se
                actualizarán los datos operativos de la actividad. Puedes añadir un tutor adicional.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner: el DNI del beneficiario no coincide con el DNI de agrupación del
              lote — el revisor corrigió/devinculó el DNI y la agrupación quedó distinta */}
      {vm.dniGroupMismatch && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-warning/40 bg-warning-light px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning-dark" />
            <div>
              <h4 className="font-heading text-sm font-bold text-warning-dark">
                El DNI del beneficiario no coincide con el DNI de agrupación del lote
              </h4>
              <p className="mt-0.5 font-data text-xs leading-relaxed text-warning-dark/90">
                Este expediente fue agrupado con el DNI{' '}
                <span className="font-bold">{dniReference}</span>, pero el beneficiario ahora registra{' '}
                <span className="font-bold">{vm.beneficiaryDni || dniReference}</span>. Verifica que el
                DNI corregido corresponda a la misma persona; si lo guardas así, el expediente quedará
                vinculado a una agrupación distinta en el lote.
              </p>
            </div>
          </div>
        </div>
      )}

      <CaseValidationPanel
        statuses={vm.statuses}
        discrepancies={vm.enrichedDiscrepancies}
        sectionIssues={vm.sectionIssues}
        onJumpField={vm.jumpToField}
        onJumpGroup={vm.setActiveGroup}
        isApproved={isApproved}
      />

      {/* Banner de error de sincronización */}
      {isSyncFailed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fault/50 bg-fault-light px-4 py-3 text-fault-dark shadow-sm">
          <div className="flex items-start gap-2.5">
            <OctagonAlert className="size-5 shrink-0 text-fault-dark mt-0.5" />
            <div>
              <p className="font-heading text-sm font-bold text-fault-dark">
                ⚠️ Aprobado (Error de sincronización con Beneficiarios)
              </p>
              <p className="font-data text-xs text-fault-dark/90 mt-0.5">
                El expediente fue validado por el revisor, pero no se pudo registrar en la base de beneficiarios.
              </p>
              {vm.caseData.sync_error && (
                <p className="mt-1.5 rounded bg-white/70 px-2.5 py-1 font-data text-xs border border-fault/30 text-ink-primary">
                  <strong>Motivo:</strong> {vm.caseData.sync_error}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetrySync}
              disabled={retryCaseSync.isPending}
              className="bg-white hover:bg-fault-light border-fault/50 text-fault-dark font-medium shadow-sm gap-1.5"
            >
              {retryCaseSync.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Reintentar sincronización
            </Button>
          </div>
        </div>
      )}

      {/* Banner de estado informativo para expediente aprobado */}
      {isApproved && !isSyncFailed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/30 bg-success-light px-4 py-3 text-success-dark">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <div>
              <p className="font-heading text-sm font-bold text-success-dark">
                Expediente Aprobado
              </p>
              <p className="font-data text-xs text-success-dark/80">
                {caseActions.canEdit
                  ? 'Este expediente se encuentra aprobado. Puede realizar correcciones adicionales antes de completar el lote.'
                  : 'Este expediente ya fue validado y su lote fue procesado. No requiere más correcciones.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vm.nextCase ? (
              <Button size="sm" onClick={() => vm.nextCase && vm.goToCase(vm.nextCase)}>
                Siguiente registro
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={vm.goBackToBatch}>
                <ArrowLeft className="size-3.5" />
                Volver al lote para registrar
              </Button>
            )}
          </div>
        </div>
      )}
      {isRejected && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/30 bg-error-light px-4 py-3 text-error-dark">
          <div className="flex items-center gap-2.5">
            <OctagonAlert className="size-5 shrink-0 text-error" />
            <div>
              <p className="font-heading text-sm font-bold text-error-dark">
                Expediente Rechazado
              </p>
              <p className="font-data text-xs text-error-dark/80">
                Este expediente ha sido rechazado y no admite modificaciones.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vm.nextCase ? (
              <Button size="sm" onClick={() => vm.nextCase && vm.goToCase(vm.nextCase)}>
                Siguiente registro
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={vm.goBackToBatch}>
                <ArrowLeft className="size-3.5" />
                Volver al lote
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Dos columnas */}
      <div className="grid min-h-[460px] gap-3.5 lg:h-[calc(100vh-360px)] lg:grid-cols-[45%_55%]">
        {/* Visor de documentos */}
        <div className="flex min-h-[440px] flex-col overflow-hidden rounded-lg border border-border bg-white p-3 shadow-card">
          <CaseDocViewer
            documents={vm.documents}
            isLoading={vm.documentsLoading}
            isError={vm.documentsError}
            activeDocId={vm.effectiveDocId}
            onSelectDoc={vm.selectDoc}
            autoSwitchHint={vm.autoSwitchHint}
            batchId={batchId}
            dniReference={dniReference}
            discrepancies={vm.discrepancies}
            pendingDocuments={vm.pendingDocuments}
            onDocumentUploaded={() => {
              void vm.refetchCase();
            }}
            isIncomplete={isIncomplete}
            onOpenUploadModal={() => vm.setIsUploadModalOpen(true)}
            
              onOpenReplaceModal={(code, name, skipOcr) => vm.setReplaceDocTarget({ code, name, skipOcr })}
              
              

          />
        </div>

        {/* Formulario + acciones */}
        <div className="flex min-h-0 flex-col gap-2.5 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-white p-3 shadow-card">
            {isIncomplete ? (
              <IncompleteCasePanel
                dniReference={dniReference}
                pendingDocuments={vm.pendingDocuments}
                onUpload={() => vm.setIsUploadModalOpen(true)}
                disabled={vm.documentsLoading}
              />
            ) : (
              <>
                {displayLockReason && (
                  <div className="mb-2.5 flex shrink-0 items-start gap-2 rounded-md bg-info-light px-3 py-2">
                    {isReprocessing ? (
                      <Loader2 className="mt-0.5 size-3.5 shrink-0 text-info-dark animate-spin" />
                    ) : (
                      <Lock className="mt-0.5 size-3.5 shrink-0 text-info-dark" />
                    )}
                    <p className="font-sans text-[12.5px] text-info-dark">
                      {displayLockReason}
                    </p>
                  </div>
                )}
                <FormProvider {...vm.form}>
                  {/* `fieldset[disabled]` alcanza a todos los controles del
                      formulario, así el expediente cerrado se lee pero no se
                      edita. `contents` deja el layout flex intacto. */}
                  <fieldset disabled={!canEditForm} className="contents">
                    <CaseFieldsForm
                      fields={vm.descriptors}
                      validations={vm.validations}
                      groupIssues={vm.groupIssues}
                      activeGroup={vm.activeGroup}
                      onSelectGroup={vm.setActiveGroup}
                      activeFieldId={vm.activeFieldId}
                      onFocusField={vm.focusField}
                      fieldRefs={vm.fieldRefs}
                        lockedFieldIds={vm.mdmLockedFieldIds}
                        parentsLocked={Boolean(vm.mdmMatch)}
                    />
                  </fieldset>
                </FormProvider>
              </>
            )}
          </div>

          <CaseCorrectionActions
            onBack={vm.goBackToBatch}
            onReject={() => vm.setRejectOpen(true)}
            onSubmit={handleValidationClick}
            onNext={() => vm.nextCase && vm.goToCase(vm.nextCase)}
            hasNext={Boolean(vm.nextCase)}
            isSubmitting={vm.isSubmitting}
            isIncomplete={isIncomplete}
            canReject={caseActions.canReject}
              onReprocess={() => {
                  reprocessMutation.mutate(undefined, {
                      onSuccess: () => {
                        // El toast de éxito real se muestra ahora cuando el polling termina
                        void vm.refetchCase();
                      }
                    });
                }}
              isReprocessing={reprocessMutation.isPending}
            canEdit={caseActions.canEdit}
          />
        </div>
      </div>

      <RejectCaseDialog
        caseId={caseId}
        batchId={batchId}
        open={vm.rejectOpen}
        onOpenChange={vm.setRejectOpen}
        onRejected={vm.goBackToBatch}
      />

      <DossierDocumentChecklist
        isOpen={vm.isUploadModalOpen}
        onClose={() => vm.setIsUploadModalOpen(false)}
        batchId={batchId}
        caseId={caseId}
        dniReference={dniReference}
        pendingDocuments={vm.pendingDocuments}
        onSuccess={() => {
          vm.setIsUploadModalOpen(false);
          void vm.refetchCase();
        }}
      />

      {vm.replaceDocTarget && (
        <UploadMissingDocModal
          isOpen={!!vm.replaceDocTarget}
          onClose={() => {
            vm.setReplaceDocTarget(null);
            void vm.refetchCase();
          }}
          batchId={batchId}
          dniReference={dniReference}
          fixedDocumentCode={vm.replaceDocTarget.code}
          fixedDocumentName={vm.replaceDocTarget.name}
        />
      )}

      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
          <div className="flex flex-col items-center gap-2 pt-8 px-6 text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-warning-light border border-warning/20">
              <TriangleAlert className="size-7 text-warning-dark" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-heading text-ink-primary">
                Advertencias Pendientes
              </DialogTitle>
              <DialogDescription className="text-center font-data text-sm text-ink-secondary mt-1 mb-4">
                El expediente no tiene errores bloqueantes, pero aún mantiene <strong>algunas sugerencias o advertencias menores</strong>.
                <br /><br />
                ¿¿Deseas continuar y validar el expediente de todos modos?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex bg-muted/30 px-6 py-4 flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowWarningModal(false)} className="w-full sm:w-auto font-sans font-semibold">
              Revisar de nuevo
            </Button>
            <Button
              className="w-full sm:w-auto bg-emerald-600 font-sans font-semibold text-white hover:bg-emerald-700"
              onClick={() => {
                setShowWarningModal(false);
                vm.onSubmit();
              }}
            >
              Sí, validar expediente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}