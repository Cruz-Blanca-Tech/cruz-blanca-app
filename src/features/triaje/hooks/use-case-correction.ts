'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  useBatch,
  useBatchCases,
  useCaseDocuments,
  useEducaCase,
  useSubmitCorrection,
} from './use-triaje-queries';
import { formatBatchDate } from '../lib/format-batch-date';
import {
  buildCorrectionFields,
  deriveFieldValidation,
  matchDiscrepancy,
  type FieldValidation,
} from '../lib/correction-fields';
import { getCaseActionsState } from '../lib/case-actions';
import {
  CORRECTION_GROUPS,
  dossierToFormValues,
  emptyCorrectionValues,
  formValuesToDossier,
  type CorrectionFormValues,
  type CorrectionGroup,
} from '../lib/correction-form';
import { isEducaCaseApproved } from '../schemas/educa-case-schema';
import type {
  EnrichedDiscrepancy,
  SectionIssue,
} from '../components/case-validation-panel';

/** Lote grande para derivar el orden de navegación prev/next sin paginar. */
const NAV_FETCH_LIMIT = 500;

interface UseCaseCorrectionParams {
  batchId: string;
  caseId: string;
  dniReference: string;
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

/**
 * Controlador de la pantalla de corrección de un expediente EDUCA. Concentra todo
 * el estado de servidor (5 queries + mutación), el ciclo de vida del formulario,
 * la cadena de derivaciones de validación, el estado de interacción visor↔campo,
 * la navegación prev/next y el submit. El componente `CaseCorrectionScreen` solo
 * consume este view-model y compone la UI.
 */
export function useCaseCorrection({
  batchId,
  caseId,
  dniReference,
}: UseCaseCorrectionParams) {
  const router = useRouter();

  const caseQuery = useEducaCase(caseId);
  const docsQuery = useCaseDocuments(batchId, dniReference);
  const batchQuery = useBatch(batchId);
  const casesQuery = useBatchCases(batchId, { skip: 0, limit: NAV_FETCH_LIMIT });
  const submitCorrection = useSubmitCorrection(caseId, batchId);

  const caseData = caseQuery.data;
  const isIncomplete = caseData?.status === 'INCOMPLETE';
  // Un expediente ya resuelto no admite correcciones, y sólo admite rechazo
  // mientras su lote no se haya cargado al registro de beneficiarios.
  const caseActions = getCaseActionsState({
    caseStatus: caseData?.status ?? '',
    batchStatus: batchQuery.data?.status,
  });
  const documents = useMemo(() => docsQuery.data?.documents ?? [], [docsQuery.data]);
  const discrepancies = useMemo(() => caseData?.discrepancies ?? [], [caseData]);

  const form = useForm<CorrectionFormValues>({
    defaultValues: emptyCorrectionValues(),
  });

  // Inicializa el formulario una sola vez por expediente (evita clobber en
  // refetches de foco). Tras guardar, el reset se hace explícito en onSuccess.
  const initializedCaseId = useRef<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (caseData && !isIncomplete && initializedCaseId.current !== caseId) {
      form.reset(dossierToFormValues(caseData.dossier_data));
      initializedCaseId.current = caseId;
    }
  }, [caseData, caseId, form, isIncomplete]);

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
    push(dd.related_adults.validation_issues, 'Contactos y Apoderado', 'Adultos relacionados');
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

  // Estado de UI (no de servidor): grupo/campo/documento activos y diálogos.
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
      field.viewerDocCodes ?? (disc?.document_code ? [disc.document_code] : []);
    const doc = candidateCodes.reduce<(typeof documents)[number] | undefined>(
      (found, code) => found ?? documents.find((d) => d.code === code),
      undefined
    );
    if (doc?.id && doc.id !== effectiveDocId) {
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

  const selectDoc = (id: string) => {
    setActiveDocId(id);
    setAutoSwitchHint(false);
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

  const goBackToBatch = () => router.push(`/triaje/${batchId}`);

  const onSubmit = form.handleSubmit((values) => {
    if (!caseData || !caseActions.canEdit) return;
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

  const batchDateLabel = batchQuery.data
    ? formatBatchDate(batchQuery.data.created_at).absolute
    : null;

  return {
    // Estado de carga / error
    isLoading: caseQuery.isLoading,
    isError: caseQuery.isError,
    caseData,
    // Derivados de servidor
    isIncomplete,
    caseActions,
    documents,
    discrepancies,
    batchDateLabel,
    // Formulario + validaciones
    form,
    descriptors,
    validations,
    statuses,
    enrichedDiscrepancies,
    sectionIssues,
    groupIssues,
    onSubmit,
    isSubmitting: submitCorrection.isPending,
    // Interacción visor ↔ campo
    activeGroup,
    setActiveGroup,
    activeFieldId,
    effectiveDocId,
    autoSwitchHint,
    selectDoc,
    focusField,
    jumpToField,
    fieldRefs,
    // Navegación prev/next
    currentIndex,
    totalCases,
    prevCase,
    nextCase,
    goToCase,
    goBackToBatch,
    // Documentos (para el visor) y refetch
    documentsLoading: docsQuery.isLoading,
    documentsError: docsQuery.isError,
    pendingDocuments: docsQuery.data?.pending_documents ?? [],
    refetchCase: caseQuery.refetch,
    // Modales
    isUploadModalOpen,
    setIsUploadModalOpen,
    rejectOpen,
    setRejectOpen,
  };
}
