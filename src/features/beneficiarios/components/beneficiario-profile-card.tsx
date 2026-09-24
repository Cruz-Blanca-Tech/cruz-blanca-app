'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SchoolSelect } from '@/features/mdm/components/school-select';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  User, Users, HeartPulse, GraduationCap, FileText,
  ArrowLeft, Save, X as XIcon, Plus, Trash2,
  OctagonAlert, UserCheck, PhoneCall, Phone, CheckCircle2,
  Pencil,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelectCreatable } from '@/components/ui/multi-select-creatable';

import {
  getRelationshipLabel,
  getGenderLabel,
  SELECTABLE_RELATIONSHIP_ROLES,
} from '@/lib/domain/enum-labels';
import {
  isBeneficiaryMinor,
  isValidDni,
  hasConflictingExclusiveRole,
  validateAdultDni,
  validateAdultsOnSubmit,
  BENEFICIARY_MAX_ADULTS,
} from '@/lib/domain/beneficiary-rules';

import {
  beneficiarioFormSchema,
  type BeneficiarioFormData,
} from '../schemas/beneficiario-form-schema';
import {
  useCreateBeneficiaryMutation,
  useUpdateBeneficiaryMutation,
} from '../hooks/use-beneficiarios-queries';
import { getInitials } from '../lib/beneficiario-format';
import { AdultSearchModal } from './adult-search-modal';
import {
  commonAllergies,
  commonDiseases,
  commonInsurances,
  commonMedications,
  commonVaccines,
} from '../constants/medical-options';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SectionId = 'personal' | 'education' | 'health' | 'religion' | 'family';

export interface BeneficiarioProfileCardProps {
  /** `'create'` → todo editable desde el inicio (página /nuevo).
   *  Omitir o `'profile'` → modo perfil con edición inline por sección. */
  mode?: 'profile' | 'create';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  id?: string;
  onSaved?: () => void;
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function BoolBadge({ value }: { value: boolean | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground text-sm">—</span>;
  return value
    ? <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2 className="size-3.5" /> Sí</span>
    : <span className="text-sm text-muted-foreground">No</span>;
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-ink-primary">{children}</div>
    </div>
  );
}

/** Tarjeta con borde + fondo blanco + sombra sutil. */
function Section({
  id,
  icon: Icon,
  title,
  editing,
  onCreate,
  onEdit,
  onSave,
  onCancel,
  saving,
  children,
  className,
}: {
  id: SectionId;
  icon: React.ElementType;
  title: string;
  editing: boolean;
  /** Si true, nunca mostramos el lápiz (modo creación). */
  onCreate?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border bg-white shadow-sm overflow-hidden', className)}>
      {/* Header de sección */}
      <div className={cn(
        'flex items-center justify-between px-5 py-3 border-b',
        editing ? 'bg-primary/5 border-primary/20' : 'bg-white',
      )}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
          <Icon className={cn('size-4', editing ? 'text-primary' : 'text-muted-foreground')} />
          {title}
        </h2>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-muted-foreground hover:text-ink-primary"
                onClick={onCancel}
                disabled={saving}
              >
                <XIcon className="size-3.5 mr-1" /> Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 px-3"
                onClick={onSave}
                disabled={saving}
              >
                <Save className="size-3.5 mr-1" />
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </>
          ) : !onCreate && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-ink-primary"
            >
              <Pencil className="size-3" />
              <span>Editar</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BeneficiarioProfileCard({ mode = 'profile', data: raw, id, onSaved }: BeneficiarioProfileCardProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = raw as any;

  const isCreate = mode === 'create';

  // Sections currently in edit mode (only in profile mode)
  const [editingSections, setEditingSections] = useState<Set<SectionId>>(
    isCreate ? new Set<SectionId>(['personal', 'education', 'health', 'religion', 'family']) : new Set()
  );
  const [savingSection, setSavingSection] = useState<SectionId | null>(null);
  const [adultModalOpen, setAdultModalOpen] = useState(false);

  const createMutation = useCreateBeneficiaryMutation();
  const updateMutation = useUpdateBeneficiaryMutation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, setValue, reset, getValues, formState: { errors } } = useForm<BeneficiarioFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(beneficiarioFormSchema) as any,
    defaultValues: buildDefaults(b),
  });

  const { fields: adultFields, append: appendAdult, remove: removeAdult } = useFieldArray({ control, name: 'related_adults' });

  // Sync form whenever React Query delivers fresh data (after mutation invalidation).
  // This replaces router.refresh() — no full page reload needed.
  useEffect(() => {
    if (!isCreate && b) {
      reset(buildDefaults(b));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b]);

  const watchedAdults = useWatch({ control, name: 'related_adults' }) || [];
  const guardianRef = useWatch({ control, name: 'guardian_ref' });
  const emergencyRef = useWatch({ control, name: 'emergency_contact_ref' });
  const birthDate = useWatch({ control, name: 'birth_date' });
  const beneficiaryDni = useWatch({ control, name: 'dni' }) || '';

  const ageWarning = (() => {
    const minor = isBeneficiaryMinor(birthDate);
    return minor === false ? 'No es menor de 18 años. No puede ser inscrito.' : null;
  })();

  const fullName = b ? `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim() : '';

  // ---------------------------------------------------------------------------
  // Editing state helpers
  // ---------------------------------------------------------------------------

  function startEdit(section: SectionId) {
    setEditingSections(prev => new Set([...prev, section]));
  }

  function cancelEdit(section: SectionId) {
    // Reset to last saved values
    reset(buildDefaults(b));
    setEditingSections(prev => { const n = new Set(prev); n.delete(section); return n; });
  }

  function isEditing(section: SectionId) {
    return isCreate || editingSections.has(section);
  }

  // ---------------------------------------------------------------------------
  // Submit / save
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function doSave(data: BeneficiarioFormData, sectionId: SectionId | 'all') {
    // Shared validations that always apply
    if (!isValidDni(data.dni)) { toast.error('El DNI debe tener exactamente 8 dígitos numéricos.'); return false; }
    const minor = isBeneficiaryMinor(data.birth_date);
    if (minor === null) { toast.error('La fecha de nacimiento es obligatoria.'); return false; }
    if (!minor) { toast.error('El beneficiario debe ser menor de 18 años.'); return false; }

    // Family-specific validations
    if (sectionId === 'family' || sectionId === 'all') {
      if (!data.guardian_ref) { toast.error('Debe designar un Apoderado.'); return false; }
      const guardianAdult = data.related_adults?.[Number(data.guardian_ref)];
      if (!guardianAdult) { toast.error('El apoderado ya no existe en la lista.'); return false; }
      const adultsError = validateAdultsOnSubmit(
        (data.related_adults ?? []).map(a => ({ dni: a.dni, first_name: a.first_name, last_name: a.last_name, role: a.role })),
        data.dni.trim()
      );
      if (adultsError) { toast.error(adultsError); return false; }
    }

    const payload = {
      ...data,
      birth_date: data.birth_date || null,
      guardian_dni: data.related_adults?.[Number(data.guardian_ref)]?.dni ?? null,
      emergency_contact_dni: data.emergency_contact_ref
        ? (data.related_adults?.[Number(data.emergency_contact_ref)]?.dni ?? null)
        : null,
      guardian_ref: undefined,
      emergency_contact_ref: undefined,
      related_adults: data.related_adults?.map(a => ({ ...a, birth_date: a.birth_date || null })) || [],
    };

    try {
      if (isCreate) {
        await createMutation.mutateAsync(payload);
        toast.success('Beneficiario creado exitosamente');
        router.push('/beneficiarios');
      } else if (id) {
        await updateMutation.mutateAsync({ id, data: payload });
        toast.success('Cambios guardados');
        // Close that section
        setEditingSections(prev => { const n = new Set(prev); if (sectionId !== 'all') n.delete(sectionId); else n.clear(); return n; });
      }
      // React Query's onSuccess already invalidates the detail query.
      // The useEffect above will sync the form when fresh data arrives.
      onSaved?.();
      return true;
    } catch (error: unknown) {
      const e = error as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || 'Ocurrió un error al guardar.');
      return false;
    }
  }

  function saveSection(sectionId: SectionId) {
    setSavingSection(sectionId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSubmit(async (data) => {
      await doSave(data as BeneficiarioFormData, sectionId);
      setSavingSection(null);
    }, () => {
      setSavingSection(null);
      toast.error('Revisa los campos con errores.');
    })();
  }

  function saveAll() {
    setSavingSection('personal'); // any truthy value — signals "saving"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSubmit(async (data) => {
      await doSave(data as BeneficiarioFormData, 'all');
      setSavingSection(null);
    }, () => {
      setSavingSection(null);
      toast.error('Revisa los campos con errores.');
    })();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-0">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon"
            onClick={() => isCreate ? router.back() : router.push('/beneficiarios')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-heading text-xl font-bold text-ink-primary leading-tight">
              {isCreate ? 'Nuevo Beneficiario' : fullName || 'Perfil del Beneficiario'}
            </h1>
            {!isCreate && b?.dni && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">DNI {b.dni}</p>
            )}
          </div>
        </div>

        {/* Create: single global save button */}
        {isCreate && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <XIcon className="size-4 mr-1.5" /> Cancelar
            </Button>
            <Button type="button" onClick={saveAll} disabled={!!savingSection}>
              <Save className="size-4 mr-1.5" />
              {savingSection ? 'Guardando…' : 'Crear Beneficiario'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Layout ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ═══ COLUMNA IZQUIERDA (8 cols) ════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-5">

          {/* 1. Datos Personales */}
          <Section
            id="personal"
            icon={User}
            title="Datos Personales"
            editing={isEditing('personal')}
            onCreate={isCreate}
            onEdit={() => startEdit('personal')}
            onSave={() => saveSection('personal')}
            onCancel={() => cancelEdit('personal')}
            saving={savingSection === 'personal'}
          >
            {/* Avatar (solo perfil, no editando) */}
            {!isCreate && !isEditing('personal') && b && (
              <div className="flex items-center gap-4 mb-5 p-3 rounded-lg bg-slate-50 border">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {getInitials(b)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-base">{fullName}</p>
                  <p className="text-xs text-muted-foreground font-mono">DNI {b.dni}</p>
                  <span className={cn(
                    'mt-1 inline-block px-2 py-0.5 text-xs rounded-full font-medium',
                    b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  )}>
                    {b.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* DNI */}
              <FieldSlot label="DNI" required={isEditing('personal')} editing={isEditing('personal')}
                view={<p className="font-mono font-medium text-sm">{b?.dni || '—'}</p>}>
                <>
                  <Input inputMode="numeric" maxLength={8} {...register('dni')} placeholder="Ej: 12345678" />
                  {errors.dni && <p className="text-xs text-destructive mt-1">{errors.dni.message}</p>}
                </>
              </FieldSlot>

              {/* Género */}
              <FieldSlot label="Género" editing={isEditing('personal')}
                view={<p className="text-sm font-medium">{getGenderLabel(b?.gender)}</p>}>
                <Controller name="gender" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={v => field.onChange(v === '' ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccione…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Masculino</SelectItem>
                      <SelectItem value="FEMALE">Femenino</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                      <SelectItem value="UNKNOWN">Sin especificar</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </FieldSlot>

              {/* Nombres */}
              <FieldSlot label="Nombres" required={isEditing('personal')} editing={isEditing('personal')}
                view={<p className="text-sm font-medium">{b?.first_name || '—'}</p>}>
                <>
                  <Input {...register('first_name')} placeholder="Ej: Juan Pablo" />
                  {errors.first_name && <p className="text-xs text-destructive mt-1">{errors.first_name.message}</p>}
                </>
              </FieldSlot>

              {/* Apellidos */}
              <FieldSlot label="Apellidos" required={isEditing('personal')} editing={isEditing('personal')}
                view={<p className="text-sm font-medium">{b?.last_name || '—'}</p>}>
                <>
                  <Input {...register('last_name')} placeholder="Ej: Pérez Gómez" />
                  {errors.last_name && <p className="text-xs text-destructive mt-1">{errors.last_name.message}</p>}
                </>
              </FieldSlot>

              {/* Fecha Nacimiento */}
              <FieldSlot label="Fecha de Nacimiento" required={isEditing('personal')} editing={isEditing('personal')}
                view={<p className="text-sm font-medium">{b?.birth_date || '—'}</p>}>
                <>
                  <Input type="date" {...register('birth_date')} />
                  {errors.birth_date && <p className="text-xs text-destructive mt-1">{errors.birth_date.message}</p>}
                  {ageWarning && (
                    <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 mt-1.5">
                      <OctagonAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      <p className="text-xs font-medium text-destructive">{ageWarning}</p>
                    </div>
                  )}
                </>
              </FieldSlot>

              {/* Dirección */}
              <FieldSlot label="Dirección" editing={isEditing('personal')}
                view={<p className="text-sm font-medium">{b?.address || '—'}</p>}>
                <Input {...register('address')} placeholder="Ej: Av. Principal 123" />
              </FieldSlot>
            </div>
          </Section>

          {/* 2. Educación + Salud */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Educación */}
            <Section
              id="education"
              icon={GraduationCap}
              title="Educación"
              editing={isEditing('education')}
              onCreate={isCreate}
              onEdit={() => startEdit('education')}
              onSave={() => saveSection('education')}
              onCancel={() => cancelEdit('education')}
              saving={savingSection === 'education'}
            >
              <div className="space-y-4">
                <FieldSlot label="Institución" editing={isEditing('education')}
                  view={<p className="text-sm font-medium">{b?.education?.school || '—'}</p>}>
                    <Controller
                      name="education.school"
                      control={control}
                      render={({ field }) => (
                        <SchoolSelect
                          value={field.value || ''}
                          onChange={field.onChange}
                          disabled={savingSection === 'education'}
                        />
                      )}
                    />
                </FieldSlot>
                <FieldSlot label="Grado" editing={isEditing('education')}
                  view={<p className="text-sm font-medium">{b?.education?.grade || '—'}</p>}>
                  <Input {...register('education.grade')} placeholder="Ej: 3ro Primaria" />
                </FieldSlot>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { label: 'Sabe leer', field: 'education.knows_how_to_read', viewVal: b?.education?.knows_how_to_read },
                      { label: 'Sabe escribir', field: 'education.knows_how_to_write', viewVal: b?.education?.knows_how_to_write },
                      { label: 'Repitió grado', field: 'education.has_repeated_grade', viewVal: b?.education?.has_repeated_grade },
                      { label: 'Dif. aprendizaje', field: 'education.has_learning_difficulties', viewVal: b?.education?.has_learning_difficulties },
                    ] as const
                  ).map(({ label, field, viewVal }) => (
                    <div key={field} className="space-y-1">
                      <p className="text-[10.5px] font-semibold text-muted-foreground">{label}</p>
                      {!isEditing('education')
                        ? <BoolBadge value={viewVal} />
                        : (
                          <Controller
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            name={field as any}
                            control={control}
                            render={({ field: f }) => (
                              <div className="flex gap-3 mt-1">
                                {([{ v: true, l: 'Sí' }, { v: false, l: 'No' }] as const).map(({ v, l }) => (
                                  <label key={String(v)} className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="radio" checked={f.value === v} onChange={() => f.onChange(v)} className="accent-primary" />
                                    <span className="text-xs">{l}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          />
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Salud */}
            <Section
              id="health"
              icon={HeartPulse}
              title="Salud"
              editing={isEditing('health')}
              onCreate={isCreate}
              onEdit={() => startEdit('health')}
              onSave={() => saveSection('health')}
              onCancel={() => cancelEdit('health')}
              saving={savingSection === 'health'}
            >
              {!isEditing('health') ? (
                <div className="space-y-3">
                  <DataRow label="Alergias">{b?.medical?.allergies?.length > 0 ? b.medical.allergies.join(', ') : 'Ninguna'}</DataRow>
                  <DataRow label="Enfermedades">{b?.medical?.diseases?.length > 0 ? b.medical.diseases.join(', ') : 'Ninguna'}</DataRow>
                  <DataRow label="Medicamentos">{b?.medical?.medications?.length > 0 ? b.medical.medications.join(', ') : 'Ninguno'}</DataRow>
                  <DataRow label="Vacunas">{b?.medical?.vaccines?.length > 0 ? b.medical.vaccines.join(', ') : 'Ninguna'}</DataRow>
                  <DataRow label="Seguro">{b?.medical?.insurance?.length > 0 ? b.medical.insurance.join(', ') : 'Ninguno'}</DataRow>
                  <DataRow label="Hospitalizado"><BoolBadge value={b?.medical?.has_been_hospitalized} /></DataRow>
                  <DataRow label="Operado"><BoolBadge value={b?.medical?.has_been_operated} /></DataRow>
                </div>
              ) : (
                <div className="space-y-3">
                  {([
                    { name: 'medical.allergies', label: 'Alergias', opts: commonAllergies, ph: 'Agregar alergia…' },
                    { name: 'medical.diseases', label: 'Enfermedades', opts: commonDiseases, ph: 'Agregar enfermedad…' },
                    { name: 'medical.medications', label: 'Medicamentos', opts: commonMedications, ph: 'Agregar medicamento…' },
                    { name: 'medical.vaccines', label: 'Vacunas', opts: commonVaccines, ph: 'Agregar vacuna…' },
                    { name: 'medical.insurance', label: 'Seguro / Cobertura', opts: commonInsurances, ph: 'Agregar seguro…' },
                  ] as const).map(({ name, label, opts, ph }) => (
                    <div key={name} className="space-y-1.5">
                      <Label className="text-[10.5px] font-semibold text-muted-foreground">{label}</Label>
                      <Controller
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        name={name as any}
                        control={control}
                        render={({ field }) => (
                          <MultiSelectCreatable value={field.value as string[] || []} onChange={field.onChange} options={opts} placeholder={ph} />
                        )}
                      />
                    </div>
                  ))}
                  <div className="flex gap-4 pt-1">
                    {([
                      { name: 'medical.has_been_hospitalized', label: 'Hospitalizado', id: 'hosp' },
                      { name: 'medical.has_been_operated', label: 'Operado', id: 'oper' },
                    ] as const).map(({ name, label, id }) => (
                      <div key={name} className="flex items-center gap-2">
                        <Controller
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          name={name as any}
                          control={control}
                          render={({ field: f }) => (
                            <Checkbox id={id} checked={!!f.value} onCheckedChange={f.onChange} />
                          )}
                        />
                        <Label htmlFor={id} className="text-xs cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* 3. Religión y Permisos */}
          <Section
            id="religion"
            icon={FileText}
            title="Religión y Permisos"
            editing={isEditing('religion')}
            onCreate={isCreate}
            onEdit={() => startEdit('religion')}
            onSave={() => saveSection('religion')}
            onCancel={() => cancelEdit('religion')}
            saving={savingSection === 'religion'}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {([
                { label: 'Bautizado', field: 'baptized', viewVal: b?.baptized },
                { label: '1ra Comunión', field: 'first_communion', viewVal: b?.first_communion },
                { label: 'Permiso de Corte', field: 'haircut_permission', viewVal: b?.haircut_permission },
                { label: 'Permiso Médico', field: 'medical_exams_permission', viewVal: b?.medical_exams_permission },
              ] as const).map(({ label, field, viewVal }) => (
                <div key={field} className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  {!isEditing('religion')
                    ? <BoolBadge value={viewVal} />
                    : (
                      <Controller
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        name={field as any}
                        control={control}
                        render={({ field: f }) => (
                          <Checkbox checked={!!f.value} onCheckedChange={f.onChange} className="mt-1" />
                        )}
                      />
                    )}
                </div>
              ))}
            </div>
          </Section>

        </div>

        {/* ═══ COLUMNA DERECHA (4 cols) ═══════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Quick Info: Contacto de Emergencia (solo perfil, fuera de modo edición general) */}
          {!isCreate && (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eContact = b?.related_adults?.find((a: any) => a.is_emergency_contact);
            if (!eContact) return null;
            return (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 shadow-sm flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-destructive/80 mb-1">
                  Emergencia • {getRelationshipLabel(eContact.role)}
                </span>
                <p className="text-sm font-semibold text-ink-primary">
                  {eContact.first_name} {eContact.last_name}
                </p>
                {eContact.phone ? (
                  <a href={`tel:${eContact.phone.replace(/\D/g, '')}`} className="mt-2 text-2xl font-black tracking-tight text-destructive hover:opacity-80 transition-opacity flex items-center gap-2">
                    <PhoneCall className="size-5" />
                    {eContact.phone}
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-destructive">Sin teléfono registrado</p>
                )}
              </div>
            );
          })()}

          {/* Familia */}
          <Section
            id="family"
            icon={Users}
            title="Familia"
            editing={isEditing('family')}
            onCreate={isCreate}
            onEdit={() => startEdit('family')}
            onSave={() => saveSection('family')}
            onCancel={() => cancelEdit('family')}
            saving={savingSection === 'family'}
          >
            {/* Botón agregar adulto (solo en edición) */}
            {isEditing('family') && adultFields.length < BENEFICIARY_MAX_ADULTS && (
              <div className="mb-3">
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setAdultModalOpen(true)}>
                  <Plus className="size-3.5 mr-1.5" /> Agregar adulto
                </Button>
                <p className="text-[10.5px] text-muted-foreground mt-1.5 text-center">
                  Máx. {BENEFICIARY_MAX_ADULTS} · Designa el Apoderado (obligatorio).
                </p>
              </div>
            )}

            {/* Modal */}
            {isEditing('family') && (
              <AdultSearchModal
                open={adultModalOpen}
                onOpenChange={setAdultModalOpen}
                onAdultFound={(adult) => {
                  if (adultFields.length >= BENEFICIARY_MAX_ADULTS) return;
                  appendAdult({ ...adult, role: adult.role || 'OTHER' });
                }}
                onAdultCreateNew={(dni) => {
                  if (adultFields.length >= BENEFICIARY_MAX_ADULTS) return;
                  appendAdult({ dni, first_name: '', last_name: '', role: 'OTHER' });
                }}
              />
            )}

            {/* Vista: lista estática */}
            {!isEditing('family') && (
              b?.related_adults?.length > 0 ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {b.related_adults.map((adult: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
                      <Avatar className="size-9 mt-0.5 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {getInitials(adult)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{adult.first_name} {adult.last_name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="rounded-md bg-slate-200/70 text-slate-700 px-1.5 py-0.5 text-[10px] font-medium">
                            {getRelationshipLabel(adult.role)}
                          </span>
                          {adult.is_guardian && (
                            <span className="rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1">
                              <UserCheck className="size-2.5" /> Apoderado
                            </span>
                          )}
                          {adult.is_emergency_contact && (
                            <span className="rounded-md bg-red-100 text-red-700 px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1">
                              <PhoneCall className="size-2.5" /> Emergencia
                            </span>
                          )}
                        </div>
                        {adult.phone && (
                          <a href={`tel:${adult.phone.replace(/\D/g, '')}`}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-xs mt-1.5 w-fit">
                            <Phone className="size-3" /> {adult.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay familiares registrados.</p>
              )
            )}

            {/* Edición: cards de adulto */}
            {isEditing('family') && (
              <>
                {adultFields.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed p-5 text-center text-sm text-muted-foreground">
                    Agrega al menos un adulto para designar el Apoderado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adultFields.map((field, index) => {
                      const isGuardian = guardianRef === String(index);
                      const isEmergency = emergencyRef === String(index);
                      const adultDni = watchedAdults[index]?.dni || '';
                      const dniError = validateAdultDni(
                        adultDni, index, beneficiaryDni.trim(),
                        watchedAdults.map(a => ({ dni: a?.dni })), isGuardian
                      );
                      return (
                        <div key={field.id} className="rounded-xl border bg-slate-50/50 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] text-primary">{index + 1}</span>
                              {isGuardian && (
                                <span className="flex items-center gap-0.5 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  <UserCheck className="size-2.5" /> Apoderado
                                </span>
                              )}
                              {isEmergency && (
                                <span className="flex items-center gap-0.5 rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                                  <PhoneCall className="size-2.5" /> Emergencia
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const gRef = parseInt(guardianRef || '-1', 10);
                                if (gRef === index) setValue('guardian_ref', '');
                                else if (gRef > index) setValue('guardian_ref', String(gRef - 1));
                                const eRef = parseInt(emergencyRef || '-1', 10);
                                if (eRef === index) setValue('emergency_contact_ref', '');
                                else if (eRef > index) setValue('emergency_contact_ref', String(eRef - 1));
                                removeAdult(index);
                              }}
                              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-semibold text-muted-foreground">Nombres *</Label>
                              <Input {...register(`related_adults.${index}.first_name`)} placeholder="Nombres" className="h-7 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-semibold text-muted-foreground">Apellidos *</Label>
                              <Input {...register(`related_adults.${index}.last_name`)} placeholder="Apellidos" className="h-7 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-semibold text-muted-foreground">DNI</Label>
                              <Input
                                inputMode="numeric" maxLength={8}
                                {...register(`related_adults.${index}.dni`)}
                                placeholder="12345678"
                                className={cn('h-7 text-xs', dniError && 'border-destructive')}
                              />
                              {dniError && <p className="text-[10px] text-destructive">{dniError}</p>}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-semibold text-muted-foreground">Teléfono</Label>
                              <Input {...register(`related_adults.${index}.phone`)} placeholder="999888777" className="h-7 text-xs" />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label className="text-[10px] font-semibold text-muted-foreground">Parentesco</Label>
                              <Controller
                                name={`related_adults.${index}.role`}
                                control={control}
                                render={({ field: f }) => (
                                  <Select value={f.value || 'OTHER'} onValueChange={f.onChange}>
                                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {SELECTABLE_RELATIONSHIP_ROLES.map(role => (
                                        <SelectItem key={role} value={role}
                                          disabled={hasConflictingExclusiveRole(watchedAdults.map(a => ({ role: a?.role })), index, role)}>
                                          {getRelationshipLabel(role)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Controller control={control} name="guardian_ref" render={({ field: rhf }) => (
                              <label className={cn(
                                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-semibold transition-all',
                                isGuardian ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-slate-50'
                              )}>
                                <input type="radio" name="guardian_radio" checked={isGuardian} onChange={() => rhf.onChange(String(index))} className="sr-only" />
                                <div className={cn('flex size-3.5 items-center justify-center rounded-full border', isGuardian ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-white')}>
                                  {isGuardian && <span className="size-1 rounded-full bg-white" />}
                                </div>
                                Apoderado
                              </label>
                            )} />
                            <Controller control={control} name="emergency_contact_ref" render={({ field: rhf }) => (
                              <label className={cn(
                                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-semibold transition-all',
                                isEmergency ? 'border-destructive bg-destructive/5 text-destructive' : 'border-border text-muted-foreground hover:bg-slate-50'
                              )}>
                                <input type="radio" name="emergency_radio" checked={isEmergency} onChange={() => rhf.onChange(String(index))} className="sr-only" />
                                <div className={cn('flex size-3.5 items-center justify-center rounded-full border', isEmergency ? 'border-destructive bg-destructive' : 'border-muted-foreground/30 bg-white')}>
                                  {isEmergency && <span className="size-1 rounded-full bg-white" />}
                                </div>
                                Emergencia
                              </label>
                            )} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {adultFields.length > 0 && !guardianRef && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                    <OctagonAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <p className="text-xs text-destructive">Selecciona «Apoderado» en el responsable principal.</p>
                  </div>
                )}
              </>
            )}
          </Section>

          {/* 4. Documentos históricos (solo perfil, sin edición) - Movido a la columna derecha */}
          {!isCreate && b?.historical_documents?.length > 0 && (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b bg-white flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-ink-primary">Documentos Históricos</h2>
              </div>
              <div className="p-5 space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {b.historical_documents.map((doc: any, i: number) => (
                  <a key={i} href={`https://drive.google.com/file/d/${doc.file_id}/view`} target="_blank" rel="noreferrer"
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                    <div className="rounded-md bg-red-100 text-red-600 p-2 shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{doc.document_type || 'Documento PDF'}</p>
                      <p className="text-xs text-muted-foreground">Año: {doc.year || 'N/A'}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldSlot: renders view or edit content depending on `editing` prop
// ---------------------------------------------------------------------------

function FieldSlot({
  label,
  required,
  editing,
  view,
  children,
}: {
  label: string;
  required?: boolean;
  editing: boolean;
  view: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}{required ? ' *' : ''}
      </Label>
      {editing ? children : view}
    </div>
  );
}

// ---------------------------------------------------------------------------
// buildDefaults: derive defaultValues from raw API data
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDefaults(b: any): BeneficiarioFormData {
  const adults = b?.related_adults?.length ? b.related_adults : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guardianIdx = adults.findIndex((a: any) => a.is_guardian);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emergencyIdx = adults.findIndex((a: any) => a.is_emergency_contact);

  return {
    dni: b?.dni || '',
    first_name: b?.first_name || '',
    last_name: b?.last_name || '',
    birth_date: b?.birth_date || '',
    gender: b?.gender || null,
    address: b?.address || '',
    baptized: b?.baptized ?? false,
    first_communion: b?.first_communion ?? false,
    haircut_permission: b?.haircut_permission ?? false,
    medical_exams_permission: b?.medical_exams_permission ?? false,
    guardian_ref: guardianIdx >= 0 ? String(guardianIdx) : '',
    emergency_contact_ref: emergencyIdx >= 0 ? String(emergencyIdx) : '',
    medical: {
      has_been_hospitalized: b?.medical?.has_been_hospitalized ?? false,
      hospitalization_reason: b?.medical?.hospitalization_reason || '',
      has_been_operated: b?.medical?.has_been_operated ?? false,
      operation_reason: b?.medical?.operation_reason || '',
      vaccines: b?.medical?.vaccines || [],
      medications: b?.medical?.medications || [],
      allergies: b?.medical?.allergies || [],
      diseases: b?.medical?.diseases || [],
      insurance: b?.medical?.insurance || [],
    },
    education: {
      school: b?.education?.school || '',
      grade: b?.education?.grade || '',
      knows_how_to_read: b?.education?.knows_how_to_read ?? null,
      knows_how_to_write: b?.education?.knows_how_to_write ?? null,
      has_repeated_grade: b?.education?.has_repeated_grade ?? null,
      has_learning_difficulties: b?.education?.has_learning_difficulties ?? null,
    },
    related_adults: adults,
  } as BeneficiarioFormData;
}

