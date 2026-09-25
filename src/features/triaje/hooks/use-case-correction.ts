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
import { useMdmBeneficiaryMatch } from './use-mdm-match';
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
import {
  isBeneficiaryMinor,
  isValidDni,
  validateAdultsOnSubmit,
} from '@/lib/domain/beneficiary-rules';
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
 * Género del maestro (MDM) → valor del select del formulario de corrección.
 * El maestro serializa el enum (`MALE`/`FEMALE`) pero el campo `beneficiary.gender`
 * del formulario solo ofrece `F`/`M`; sin esta normalización el select se queda
 * vacío ("me quita el género") aunque el maestro sí tenga el dato. Valores no
 * representables (`OTHER`/`UNKNOWN`/vacíos) se dejan en `''` como "no consignado".
 */
function mdmGenderToForm(gender: string | null | undefined): string {
  if (gender === 'MALE') return 'M';
  if (gender === 'FEMALE') return 'F';
  return '';
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
  const pendingDocuments = useMemo(
    () => docsQuery.data?.pending_documents ?? [],
    [docsQuery.data]
  );
  const previousPendingRef = useRef(pendingDocuments.length);
  useEffect(() => {
    // If pending documents dropped to 0 (meaning async OCR finished), refetch the Triage Case to get the new data
    if (previousPendingRef.current > 0 && pendingDocuments.length === 0) {
      caseQuery.refetch();
      // Notificar al usuario que la IA terminó
      toast.success('¡El reprocesamiento con IA ha finalizado!');
    }
    previousPendingRef.current = pendingDocuments.length;
  }, [pendingDocuments.length, caseQuery]);

  const isIncomplete =
    caseData?.status === 'INCOMPLETE' ||
    pendingDocuments.length > 0 ||
    (caseData?.discrepancies ?? []).some((d) => d.field_name?.startsWith('documents.'));
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
  const lastUpdatedAt = useRef<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [replaceDocTarget, setReplaceDocTarget] = useState<{ code: string; name: string; skipOcr?: boolean } | null>(null);

  useEffect(() => {
    if (caseData) {
      if (initializedCaseId.current !== caseId || lastUpdatedAt.current !== (caseData as any).updated_at) {
        form.reset(dossierToFormValues(caseData.dossier_data));
        initializedCaseId.current = caseId;
        lastUpdatedAt.current = (caseData as any).updated_at;
      }
    }
  }, [caseData, caseId, form]);

  const descriptors = useMemo(
    () => (caseData ? buildCorrectionFields(caseData) : []),
    [caseData]
  );

  const watched = useWatch({ control: form.control });

  // ── Match MDM ──────────────────────────────────────────────────────────────
  // Cuando el DNI del expediente coincide con un beneficiario YA registrado en
  // el maestro (datos "revisados), la pantalla: (1) rellena los campos
  // protegidos (identidad y padre/madre) con los valores del MDM — el maestro es
  // la verdad, no el OCR — y (2) los bloquea para que no se corrompan. El DNI en
  // sí NO se bloquea: si el revisor determina que no es la misma persona, lo
  // corrige/desvincula y todos los campos vuelven a la baseline del expediente.
  const watchedDni = useMemo(() => {
    const v = getByPath(watched, 'beneficiary.dni');
    return typeof v === 'string' ? v : '';
  }, [watched]);

  const [lookupDni, setLookupDni] = useState('');
  useEffect(() => {
    const trimmed = (watchedDni || '').trim();
    if (!isValidDni(trimmed)) {
      setLookupDni('');
      return;
    }
    const timer = setTimeout(() => setLookupDni(trimmed), 350);
    return () => clearTimeout(timer);
  }, [watchedDni]);
  const mdmQuery = useMdmBeneficiaryMatch(lookupDni);
  const mdmSnap = mdmQuery.data?.exists ? (mdmQuery.data.beneficiary ?? null) : null;

  // Advertencia de agrupación (rediseño condicional+inline):
  //   - se oculta si hay match MDM (la identidad la confirma el maestro, no hace
  //     falta avisar por la agrupación) o si el caso ya está aprobado (antes el
  //     banner persistía en cada visita al expediente aprobado);
  //   - sin match ni aprobación, se muestra como nota inline de una línea bajo el
  //     campo DNI (ver `dniInline`), no como banner.
  const isApprovedStatus = caseData?.status === 'APPROVED';
  const dniGroupMismatch = useMemo(() => {
    if (mdmSnap || isApprovedStatus) return false;
    const current = (watchedDni || '').trim().toUpperCase();
    const group = (dniReference || '').trim().toUpperCase();
    return Boolean(current && group && current !== group);
  }, [watchedDni, dniReference, mdmSnap, isApprovedStatus]);

  // Línea ancla bajo el campo DNI (una sola, nunca dos a la vez):
  //   - info (match MDM): "Registrado en MDM como X — identidad desde el maestro
  //     · Cambiar DNI para desvincular". Reactiva al valor del DNI: si el revisor
  //     lo cambia y deja de haber match, la línea desaparece (no es un banner).
  //   - warning (agrupación): solo sin match y con caso editable.
  const dniInline = useMemo(() => {
    if (mdmSnap) {
      const snapName = [mdmSnap.first_name, mdmSnap.last_name].filter(Boolean).join(' ');
      return {
        kind: 'info' as const,
        text: `Registrado en MDM como ${snapName || mdmSnap.dni || ''} — identidad desde el maestro · Cambiar DNI para desvincular`,
      };
    }
    if (dniGroupMismatch) {
      const current = (watchedDni || '').trim().toUpperCase();
      return {
        kind: 'warning' as const,
        text: `Este expediente fue agrupado con el DNI ${dniReference}, pero el beneficiario ahora registra ${current || dniReference}. Verifica la agrupación del lote.`,
      };
    }
    return null;
  }, [mdmSnap, dniGroupMismatch, watchedDni, dniReference]);

  // Baseline del expediente (dossier tal como vino del backend): se restaura si
  // el revisor desvincula el DNI (el match desaparece).
  const dossierBaseline = useMemo(
    () => (caseData ? dossierToFormValues(caseData.dossier_data) : null),
    [caseData]
  );
  const mdmAppliedRef = useRef(false);

  useEffect(() => {
    const match = mdmQuery.data;
    const snap = match?.exists ? (match.beneficiary ?? null) : null;

    if (snap) {
      mdmAppliedRef.current = true;
      form.setValue('beneficiary.first_name', snap.first_name, { shouldDirty: true });
      form.setValue('beneficiary.last_name', snap.last_name, { shouldDirty: true });
      form.setValue('beneficiary.birth_date', snap.birth_date ?? '', { shouldDirty: true });
      form.setValue('beneficiary.gender', mdmGenderToForm(snap.gender), { shouldDirty: true });
      form.setValue('beneficiary.address', snap.address ?? '', { shouldDirty: true });
      // Padre/madre (por rol): misma persona → datos del maestro.
      const parents: Record<
        string,
        { full_name: string; dni: string; phone?: string | null } | undefined
      > = {
        FATHER: snap.relatives.find((r) => r.relationship === 'FATHER'),
        MOTHER: snap.relatives.find((r) => r.relationship === 'MOTHER'),
      };
      const adults = form.getValues('adults');
      adults.forEach((adult, i) => {
        if (adult.relationship !== 'FATHER' && adult.relationship !== 'MOTHER') return;
        const parent = parents[adult.relationship];
        if (!parent) return;
        form.setValue(`adults.${i}.full_name`, parent.full_name, { shouldDirty: true });
        form.setValue(`adults.${i}.dni`, parent.dni, { shouldDirty: true });
        form.setValue(`adults.${i}.phone`, parent.phone ?? '', { shouldDirty: true });
      });
      return;
    }

    // Sin match: si antes SÍ lo había (el revisor cambió/borró el DNI para
    // desvincular), restauramos los valores originales del expediente.
    if (mdmAppliedRef.current) {
      mdmAppliedRef.current = false;
      const base = dossierBaseline;
      if (base) {
        form.setValue('beneficiary.first_name', base.beneficiary.first_name, { shouldDirty: true });
        form.setValue('beneficiary.last_name', base.beneficiary.last_name, { shouldDirty: true });
        form.setValue('beneficiary.birth_date', base.beneficiary.birth_date, { shouldDirty: true });
        form.setValue('beneficiary.gender', base.beneficiary.gender, { shouldDirty: true });
        form.setValue('beneficiary.address', base.beneficiary.address, { shouldDirty: true });
        const parents: Record<
          string,
          { full_name: string; dni: string; phone: string } | undefined
        > = {
          FATHER: base.adults.find((a) => a.relationship === 'FATHER'),
          MOTHER: base.adults.find((a) => a.relationship === 'MOTHER'),
        };
        const adults = form.getValues('adults');
        adults.forEach((adult, i) => {
          if (adult.relationship !== 'FATHER' && adult.relationship !== 'MOTHER') return;
          const parent = parents[adult.relationship];
          if (!parent) return;
          form.setValue(`adults.${i}.full_name`, parent.full_name, { shouldDirty: true });
          form.setValue(`adults.${i}.dni`, parent.dni, { shouldDirty: true });
          form.setValue(`adults.${i}.phone`, parent.phone, { shouldDirty: true });
        });
      }
    }
  }, [mdmQuery.data, dossierBaseline, form]);

  const mdmLockedFieldIds = useMemo(() => {
    if (!mdmSnap) return null;
    // No se bloquea `beneficiary.dni` (llave de desvinculación) ni los tutores
    // (rol OTHER sigue siendo editable/agregable desde el triaje).
    return new Set<string>([
      'beneficiary.first_name',
      'beneficiary.last_name',
      'beneficiary.birth_date',
      'beneficiary.gender',
      'beneficiary.address',
      'padre.full_name',
      'padre.dni',
      'padre.phone',
      'padre.empty',
      'madre.full_name',
      'madre.dni',
      'madre.phone',
      'madre.empty',
    ]);
  }, [mdmSnap]);

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
    // Auto-cambio de documento deshabilitado por solicitud del usuario
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

    if (pendingDocuments.length > 0) {
      const names = pendingDocuments.map((d) => d.name || d.code).join(', ');
      toast.error(
        `No se puede guardar ni aprobar: Faltan documentos requeridos (${names}). Debe adjuntarlos para continuar.`
      );
      return;
    }

    // 1. DNI del beneficiario
    const beneficiaryDni = (values.beneficiary.dni || '').trim();
    if (!beneficiaryDni) {
      toast.error('No se puede guardar: El DNI del beneficiario es obligatorio.');
      return;
    }
    if (!isValidDni(beneficiaryDni)) {
      toast.error('No se puede guardar: El DNI del beneficiario debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    // 2. Fecha de nacimiento: obligatoria y debe corresponder a un menor de edad
    const minor = isBeneficiaryMinor(values.beneficiary.birth_date);
    if (minor === null) {
      toast.error('No se puede guardar: La fecha de nacimiento del beneficiario es obligatoria.');
      return;
    }
    if (!minor) {
      toast.error('No se puede guardar: El beneficiario debe ser menor de 18 años.');
      return;
    }

    // 3. Apoderado obligatorio
    if (!values.guardian_ref || values.guardian_ref.trim() === '') {
      toast.error('No se puede guardar: Debe asignar un Apoderado al expediente.');
      return;
    }

    const guardianIdx = Number(values.guardian_ref);
    const guardianAdult = values.adults[guardianIdx];
    if (!guardianAdult) {
      toast.error('No se puede guardar: Debe seleccionar un Apoderado válido del expediente.');
      return;
    }

    const guardianName = (guardianAdult.full_name || '').trim();
    if (!guardianName) {
      toast.error('No se puede guardar: El apoderado seleccionado debe tener nombre completo.');
      return;
    }

    const guardianDni = (guardianAdult.dni || '').trim();
    if (!guardianDni) {
      toast.error('No se puede guardar: El apoderado asignado debe tener DNI obligatorio.');
      return;
    }
    if (!isValidDni(guardianDni)) {
      toast.error(
        `No se puede guardar: El DNI "${guardianDni}" del apoderado debe tener exactamente 8 dígitos numéricos.`
      );
      return;
    }

    // 4. Validación de todos los adultos (centralizada en domain layer)
    const adultsError = validateAdultsOnSubmit(values.adults, beneficiaryDni);
    if (adultsError) {
      toast.error(`No se puede guardar: ${adultsError}`);
      return;
    }

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
    // Match MDM (beneficiario ya registrado en el maestro)
    mdmMatch: mdmSnap,
    mdmLockedFieldIds,
    isMdmMatching: mdmQuery.isFetching,
    // Advertencia de agrupación: DNI del beneficiario ≠ DNI de agrupación del lote
    dniGroupMismatch,
    // Línea ancla bajo el campo DNI (info con match MDM / warning por agrupación)
    dniInline,
    beneficiaryDni: watchedDni,
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
    pendingDocuments,
    refetchCase: caseQuery.refetch,
    // Modales
    isUploadModalOpen,
    setIsUploadModalOpen,
    replaceDocTarget,
    setReplaceDocTarget,
    rejectOpen,
    setRejectOpen,
  };
}
