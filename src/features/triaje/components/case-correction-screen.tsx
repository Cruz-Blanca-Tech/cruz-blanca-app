'use client';

import { FormProvider } from 'react-hook-form';
import { Lock } from 'lucide-react';

import { useCaseCorrection } from '../hooks/use-case-correction';
import { CaseDocViewer } from './case-doc-viewer';
import { CaseFieldsForm } from './case-fields-form';
import { CaseValidationPanel } from './case-validation-panel';
import { CaseCorrectionSkeleton } from './case-correction-skeleton';
import { CaseNotFound } from './case-not-found';
import { CaseCorrectionHeader } from './case-correction-header';
import { IncompleteCasePanel } from './incomplete-case-panel';
import { CaseCorrectionActions } from './case-correction-actions';
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

  if (vm.isLoading) return <CaseCorrectionSkeleton />;
  if (vm.isError || !vm.caseData) return <CaseNotFound onBack={vm.goBackToBatch} />;

  const { caseActions, isIncomplete } = vm;

  return (
    <div className="flex flex-1 flex-col gap-3 p-6">
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
      <CaseValidationPanel
        statuses={vm.statuses}
        discrepancies={vm.enrichedDiscrepancies}
        sectionIssues={vm.sectionIssues}
        onJumpField={vm.jumpToField}
        onJumpGroup={vm.setActiveGroup}
      />

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
          />
        </div>

        {/* Formulario + acciones */}
        <div className="flex min-h-0 flex-col gap-2.5 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-white p-3 shadow-card">
            {isIncomplete ? (
              <IncompleteCasePanel
                dniReference={dniReference}
                onUpload={() => vm.setIsUploadModalOpen(true)}
                disabled={vm.documentsLoading}
              />
            ) : (
              <>
                {caseActions.lockReason && (
                  <div className="mb-2.5 flex shrink-0 items-start gap-2 rounded-md bg-info-light px-3 py-2">
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-info-dark" />
                    <p className="font-sans text-[12.5px] text-info-dark">
                      {caseActions.lockReason}
                    </p>
                  </div>
                )}
                <FormProvider {...vm.form}>
                  {/* `fieldset[disabled]` alcanza a todos los controles del
                      formulario, así el expediente cerrado se lee pero no se
                      edita. `contents` deja el layout flex intacto. */}
                  <fieldset disabled={!caseActions.canEdit} className="contents">
                    <CaseFieldsForm
                      fields={vm.descriptors}
                      validations={vm.validations}
                      groupIssues={vm.groupIssues}
                      activeGroup={vm.activeGroup}
                      onSelectGroup={vm.setActiveGroup}
                      activeFieldId={vm.activeFieldId}
                      onFocusField={vm.focusField}
                      fieldRefs={vm.fieldRefs}
                    />
                  </fieldset>
                </FormProvider>
              </>
            )}
          </div>

          <CaseCorrectionActions
            onBack={vm.goBackToBatch}
            onReject={() => vm.setRejectOpen(true)}
            onSubmit={vm.onSubmit}
            onNext={() => vm.nextCase && vm.goToCase(vm.nextCase)}
            hasNext={Boolean(vm.nextCase)}
            isSubmitting={vm.isSubmitting}
            isIncomplete={isIncomplete}
            canReject={caseActions.canReject}
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
    </div>
  );
}
