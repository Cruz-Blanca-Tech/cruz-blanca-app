'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  OctagonAlert,
  Save,
  XCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useBatch,
  useBatchCases,
  useCaseDocuments,
  useEducaCase,
  useSubmitCorrection,
} from '../hooks/use-triaje-queries';
import { formatBatchDate } from '../lib/format-batch-date';
import {
  buildCorrectionFields,
  deriveFieldValidation,
  matchDiscrepancy,
  type FieldValidation,
} from '../lib/correction-fields';
import {
  CORRECTION_GROUPS,
  dossierToFormValues,
  formValuesToDossier,
  type CorrectionFormValues,
  type CorrectionGroup,
} from '../lib/correction-form';
import { isEducaCaseApproved } from '../schemas/educa-case-schema';
import { CaseDocViewer } from './case-doc-viewer';
import { CaseFieldsForm } from './case-fields-form';
import {
  CaseValidationPanel,
  type EnrichedDiscrepancy,
  type SectionIssue,
} from './case-validation-panel';
import { RejectCaseDialog } from './reject-case-dialog';

interface CaseCorrectionScreenProps {
  batchId: string;
  caseId: string;
  dniReference: string;
}

/** Lote grande para derivar el orden de navegación prev/next sin paginar. */
const NAV_FETCH_LIMIT = 500;

const CASE_STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING_REVIEW: {
    label: 'Pendiente de revisión',
    className: 'bg-warning-light text-warning-dark',
  },
  IN_REVIEW: { label: 'En revisión', className: 'bg-info-light text-info-dark' },
  APPROVED: { label: 'Aprobado', className: 'bg-success-light text-success-dark' },
  REJECTED: { label: 'Rechazado', className: 'bg-error-light text-error-dark' },
};

function titleCase(value: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** Valor por dot-path dentro de los valores observados del formulario. */
function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function emptyCorrectionValues(): CorrectionFormValues {
  return {
    beneficiary: {
      dni: '',
      first_name: '',
      last_name: '',
      birth_date: '',
      gender: '',
      address: '',
    },
    education: {
      school: '',
      grade: '',
      knows_read: false,
      knows_write: false,
      repeated_grade: false,
      learning_difficulties: false,
    },
    medical: {
      allergies: [],
      diseases: [],
      insurance: [],
      has_been_operated: false,
      operation_reason: '',
      has_been_hospitalized: false,
      hospitalization_reason: '',
      vaccines: [],
      medications: [],
    },
    religion: { baptized: null, first_communion: null },
    permissions: { haircut_permission: null, medical_exams_permission: null },
    adults: [],
    guardian_ref: '',
    emergency_contact_ref: '',
  };
}

/** Orquestador de la corrección de un expediente (/triaje/[batchId]/[caseId]). */
export function CaseCorrectionScreen({
  batchId,
  caseId,
  dniReference,
}: CaseCorrectionScreenProps) {
  const router = useRouter();

  const caseQuery = useEducaCase(caseId);
  const docsQuery = useCaseDocuments(batchId, dniReference);
  const batchQuery = useBatch(batchId);
  const casesQuery = useBatchCases(batchId, { skip: 0, limit: NAV_FETCH_LIMIT });
  const submitCorrection = useSubmitCorrection(caseId, batchId);

  const caseData = caseQuery.data;
  const documents = useMemo(() => docsQuery.data?.documents ?? [], [docsQuery.data]);
  const discrepancies = useMemo(
    () => caseData?.discrepancies ?? [],
    [caseData]
  );

  const form = useForm<CorrectionFormValues>({
    defaultValues: emptyCorrectionValues(),
  });

  // Inicializa el formulario una sola vez por expediente (evita clobber en
  // refetches de foco). Tras guardar, el reset se hace explícito en onSuccess.
  const initializedCaseId = useRef<string | null>(null);
  useEffect(() => {
    if (caseData && initializedCaseId.current !== caseId) {
      form.reset(dossierToFormValues(caseData.dossier_data));
      initializedCaseId.current = caseId;
    }
  }, [caseData, caseId, form]);

  const descriptors = useMemo(
    () => (caseData ? buildCorrectionFields(caseData) : []),
    [caseData]
  );

  const watched = useWatch({ control: form.control });

  const validations = useMemo(() => {
    const map = new Map<string, FieldValidation>();
    for (const field of descriptors) {
      const value = field.name ? getByPath(watched, field.name) : undefined;
      map.set(field.id, deriveFieldValidation(field, value, discrepancies));
    }
    return map;
  }, [descriptors, watched, discrepancies]);

  const statuses = useMemo(
    () => descriptors.map((f) => validations.get(f.id)?.status ?? 'ok'),
    [descriptors, validations]
  );

  const enrichedDiscrepancies = useMemo<EnrichedDiscrepancy[]>(
    () =>
      discrepancies.map((d) => {
        const target = descriptors.find((f) => matchDiscrepancy(f, [d]));
        return { ...d, fieldId: target?.id ?? null };
      }),
    [discrepancies, descriptors]
  );

  const sectionIssues = useMemo<SectionIssue[]>(() => {
    if (!caseData) return [];
    const dd = caseData.dossier_data;
    const issues: SectionIssue[] = [];
    const push = (arr: string[], group: CorrectionGroup, section: string) => {
      for (const text of arr) if (text) issues.push({ text, group, section });
    };
    push(dd.beneficiary.validation_issues, 'Beneficiario', 'Beneficiario');
    push(dd.related_adults.validation_issues, 'Apoderado', 'Adultos relacionados');
    push(dd.religion.validation_issues, 'Religión y permisos', 'Religión');
    push(dd.permissions.validation_issues, 'Religión y permisos', 'Permisos');
    return issues;
  }, [caseData]);

  const groupIssues = useMemo(() => {
    const base = Object.fromEntries(
      CORRECTION_GROUPS.map((g) => [g, 0])
    ) as Record<CorrectionGroup, number>;
    for (const field of descriptors) {
      const status = validations.get(field.id)?.status;
      if (status === 'warning' || status === 'error') base[field.group] += 1;
    }
    for (const issue of sectionIssues) base[issue.group] += 1;
    return base;
  }, [descriptors, validations, sectionIssues]);

  // Estado de UI (no de servidor): grupo/campo/documento activos y diálogo.
  const [activeGroup, setActiveGroup] = useState<CorrectionGroup>('Beneficiario');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [autoSwitchHint, setAutoSwitchHint] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Documento activo efectivo: el elegido o, por defecto, el primero (sin efecto
  // ni estado extra: `null` significa "el primero disponible").
  const effectiveDocId = activeDocId ?? documents[0]?.id ?? null;

  const focusField = (id: string) => {
    setActiveFieldId(id);
    const field = descriptors.find((f) => f.id === id);
    if (!field) return;
    setActiveGroup(field.group);
    // Auto-cambio de documento al enfocar el campo. Se prefiere el mapeo ESTABLE
    // del descriptor (`viewerDocCodes`: DNI del niño → DNIBE, DNI de un adulto →
    // DNIAP) y solo si el campo no lo declara se cae al `document_code` de su
    // discrepancia. Esto evita que el visor salte al documento donde se DETECTÓ el
    // conflicto (a menudo la ficha, la primera pestaña) en vez del documento a
    // revisar. Solo se cambia si el documento objetivo existe en el expediente; si
    // no, el visor se queda donde está (no vuelve al primero).
    const disc = matchDiscrepancy(field, discrepancies);
    const candidateCodes =
      field.viewerDocCodes ??
      (disc?.document_code ? [disc.document_code] : []);
    const doc = candidateCodes.reduce<(typeof documents)[number] | undefined>(
      (found, code) => found ?? documents.find((d) => d.code === code),
      undefined
    );
    if (doc && doc.id !== effectiveDocId) {
      setActiveDocId(doc.id);
      setAutoSwitchHint(true);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setAutoSwitchHint(false), 3500);
    }
  };

  const jumpToField = (id: string) => {
    focusField(id);
    setTimeout(() => {
      const el = fieldRefs.current[id];
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      el?.querySelector<HTMLElement>('input, textarea, button')?.focus();
    }, 60);
  };

  // Orden de navegación prev/next desde los casos del lote.
  const orderedCases = casesQuery.data?.items ?? [];
  const currentIndex = orderedCases.findIndex((c) => c.id === caseId);
  const totalCases = casesQuery.data?.total ?? orderedCases.length;
  const prevCase = currentIndex > 0 ? orderedCases[currentIndex - 1] : undefined;
  const nextCase =
    currentIndex >= 0 && currentIndex < orderedCases.length - 1
      ? orderedCases[currentIndex + 1]
      : undefined;

  const goToCase = (target: { id: string; dni_reference: string }) => {
    router.push(
      `/triaje/${batchId}/${target.id}?dni=${encodeURIComponent(target.dni_reference)}`
    );
  };

  const onSubmit = form.handleSubmit((values) => {
    if (!caseData) return;
    const payload = formValuesToDossier(values, caseData.dossier_data);
    submitCorrection.mutate(payload, {
      onSuccess: (res) => {
        // La respuesta del PATCH es la fuente fresca: re-siembra el formulario y
        // deja que el panel/estado se actualicen con res.status + res.discrepancies.
        form.reset(dossierToFormValues(res.dossier_data));
        if (isEducaCaseApproved(res)) {
          toast.success('Expediente aprobado. No quedan observaciones.');
        } else {
          toast.success('Correcciones guardadas.');
        }
      },
      onError: (error) => {
        toast.error(error.message || 'No se pudieron guardar las correcciones.');
      },
    });
  });

  const goBackToBatch = () => router.push(`/triaje/${batchId}`);

  // ── Estados de carga / error ────────────────────────────────────────────
  if (caseQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3.5 lg:grid-cols-[45%_55%]">
          <Skeleton className="h-[440px] w-full" />
          <Skeleton className="h-[440px] w-full" />
        </div>
      </div>
    );
  }

  if (caseQuery.isError || !caseData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <OctagonAlert className="size-9 text-error" />
        <h1 className="font-heading text-2xl font-bold text-ink-primary">
          Expediente no encontrado
        </h1>
        <p className="max-w-md font-data text-sm text-ink-muted">
          No se pudo cargar el expediente solicitado. Puede que ya no exista o que
          haya un problema de conexión.
        </p>
        <Button variant="outline" onClick={goBackToBatch}>
          <ArrowLeft />
          Volver al lote
        </Button>
      </div>
    );
  }

  const beneficiary = caseData.dossier_data.beneficiary;
  const beneficiaryName =
    `${titleCase(beneficiary.first_name)} ${titleCase(beneficiary.last_name)}`.trim() ||
    dniReference;
  const statusMeta = CASE_STATUS_META[caseData.status];
  const batchDate = batchQuery.data
    ? formatBatchDate(batchQuery.data.created_at)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-3 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-data text-xs text-ink-muted">
        <Link
          href="/triaje"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Inbox className="size-3" />
          Triaje
        </Link>
        <ChevronRight className="size-3 text-ink-disabled" />
        <Link
          href={`/triaje/${batchId}`}
          className="text-primary hover:underline"
        >
          {batchDate ? `Lote ${batchDate.absolute}` : 'Lote'}
        </Link>
        <ChevronRight className="size-3 text-ink-disabled" />
        <span className="font-medium text-ink-primary">{beneficiaryName}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold text-ink-primary">
              {beneficiaryName}
            </h1>
            {statusMeta ? (
              <Badge
                className={cn(
                  'gap-1.5 rounded-sm px-2 py-0.5 font-data text-[10.5px] font-semibold',
                  statusMeta.className
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {statusMeta.label}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-sm px-2 py-0.5 font-data text-[10.5px] font-semibold"
              >
                {caseData.status}
              </Badge>
            )}
          </div>
          <p className="mt-1 font-sans text-sm text-ink-muted">
            DNI {beneficiary.dni ?? dniReference} · Verifica los campos contra los
            documentos escaneados y resuelve las observaciones.
          </p>
        </div>

        {/* Navegación Registro N de M */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => prevCase && goToCase(prevCase)}
            disabled={!prevCase}
            aria-label="Registro anterior"
          >
            <ChevronLeft />
          </Button>
          <span className="font-data text-xs text-ink-muted">
            {currentIndex >= 0 ? (
              <>
                Registro{' '}
                <strong className="text-ink-primary">{currentIndex + 1}</strong> de{' '}
                {totalCases}
              </>
            ) : (
              'Registro'
            )}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => nextCase && goToCase(nextCase)}
            disabled={!nextCase}
            aria-label="Registro siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* Panel de validación */}
      <CaseValidationPanel
        statuses={statuses}
        discrepancies={enrichedDiscrepancies}
        sectionIssues={sectionIssues}
        onJumpField={jumpToField}
        onJumpGroup={setActiveGroup}
      />

      {/* Dos columnas */}
      <div className="grid min-h-[460px] gap-3.5 lg:h-[calc(100vh-360px)] lg:grid-cols-[45%_55%]">
        {/* Visor de documentos */}
        <div className="flex min-h-[440px] flex-col overflow-hidden rounded-lg border border-border bg-white p-3 shadow-card">
          <CaseDocViewer
            documents={documents}
            isLoading={docsQuery.isLoading}
            isError={docsQuery.isError}
            activeDocId={effectiveDocId}
            onSelectDoc={(id) => {
              setActiveDocId(id);
              setAutoSwitchHint(false);
            }}
            autoSwitchHint={autoSwitchHint}
            batchId={batchId}
            dniReference={dniReference}
          />
        </div>

        {/* Formulario + acciones */}
        <div className="flex min-h-0 flex-col gap-2.5 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-white p-3 shadow-card">
            <FormProvider {...form}>
              <CaseFieldsForm
                fields={descriptors}
                validations={validations}
                groupIssues={groupIssues}
                activeGroup={activeGroup}
                onSelectGroup={setActiveGroup}
                activeFieldId={activeFieldId}
                onFocusField={focusField}
                fieldRefs={fieldRefs}
              />
            </FormProvider>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={goBackToBatch}
              className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-secondary hover:text-ink-primary"
            >
              <ArrowLeft className="size-3.5" />
              Volver al lote
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="border-error text-error-dark hover:bg-error-light"
                onClick={() => setRejectOpen(true)}
                disabled={submitCorrection.isPending}
              >
                <XCircle />
                Rechazar expediente
              </Button>
              {nextCase && (
                <Button variant="outline" onClick={() => goToCase(nextCase)}>
                  Siguiente registro
                  <ArrowRight />
                </Button>
              )}
              <Button onClick={onSubmit} disabled={submitCorrection.isPending}>
                {submitCorrection.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save />
                )}
                Guardar correcciones
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RejectCaseDialog
        caseId={caseId}
        batchId={batchId}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onRejected={goBackToBatch}
      />
    </div>
  );
}
