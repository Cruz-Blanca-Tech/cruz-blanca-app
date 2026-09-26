'use client';
import { useState } from 'react';

import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, Activity, Stethoscope, Pill, Syringe, AlertTriangle, HeartPulse, ShieldPlus, GraduationCap, BookOpen, OctagonAlert, UserCheck, PhoneCall } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AdultsListControl } from '@/features/triaje/components/adults-list-control';
import { SchoolSelect } from '@/features/mdm/components/school-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelectCreatable } from '@/components/ui/multi-select-creatable';
import { cn } from '@/lib/utils';
import {
  isBeneficiaryMinor,
  isValidDni,
  hasConflictingExclusiveRole,
  validateAdultDni,
  validateAdultsOnSubmit,
  BENEFICIARY_MAX_ADULTS,
} from '@/lib/domain/beneficiary-rules';
import {
  getRelationshipLabel,
  SELECTABLE_RELATIONSHIP_ROLES,
} from '@/lib/domain/enum-labels';

import {
  commonDiseases,
  commonVaccines,
  commonAllergies,
  commonMedications,
  commonInsurances,
} from '../constants/medical-options';

import {
  beneficiarioFormSchema,
  type BeneficiarioFormData,
} from '../schemas/beneficiario-form-schema';
import {
  useCreateBeneficiaryMutation,
  useUpdateBeneficiaryMutation,
} from '../hooks/use-beneficiarios-queries';
import { AdultSearchModal } from './adult-search-modal';


interface BeneficiarioFormProps {
  initialData?: unknown;
  isEdit?: boolean;
}

export function BeneficiarioForm({ initialData: rawInitialData, isEdit }: BeneficiarioFormProps) {
  const router = useRouter();
  const [isAdultSearchModalOpen, setIsAdultSearchModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialData = rawInitialData as any;

  const createMutation = useCreateBeneficiaryMutation();
  const updateMutation = useUpdateBeneficiaryMutation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<BeneficiarioFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(beneficiarioFormSchema) as any,
    defaultValues: {
      dni: initialData?.dni || '',
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
      birth_date: initialData?.birth_date || '',
      gender: initialData?.gender || null,
      address: initialData?.address || '',
      baptized: initialData?.baptized ?? false,
      first_communion: initialData?.first_communion ?? false,
      haircut_permission: initialData?.haircut_permission ?? false,
      medical_exams_permission: initialData?.medical_exams_permission ?? false,
      guardian_ref: '',
      emergency_contact_ref: '',
      
      medical: {
        has_been_hospitalized: initialData?.medical?.has_been_hospitalized ?? false,
        hospitalization_reason: initialData?.medical?.hospitalization_reason || '',
        has_been_operated: initialData?.medical?.has_been_operated ?? false,
        operation_reason: initialData?.medical?.operation_reason || '',
        vaccines: initialData?.medical?.vaccines || [],
        medications: initialData?.medical?.medications || [],
        allergies: initialData?.medical?.allergies || [],
        diseases: initialData?.medical?.diseases || [],
        insurance: initialData?.medical?.insurance || [],
      },
      
      education: {
        school: initialData?.education?.school || '',
        grade: initialData?.education?.grade || '',
        knows_how_to_read: initialData?.education?.knows_how_to_read ?? null,
        knows_how_to_write: initialData?.education?.knows_how_to_write ?? null,
        has_repeated_grade: initialData?.education?.has_repeated_grade ?? null,
        has_learning_difficulties: initialData?.education?.has_learning_difficulties ?? null,
      },

      related_adults: initialData?.related_adults?.length 
        ? initialData.related_adults 
        : [],
    },
  });

  const { fields: adultFields, append: appendAdult, remove: removeAdult } = useFieldArray({
    control,
    name: "related_adults",
  });

  // Valores reactivos para validaciones inline
  const watchedAdults = useWatch({ control, name: 'related_adults' }) || [];
  const guardianRef = useWatch({ control, name: 'guardian_ref' });
  const emergencyRef = useWatch({ control, name: 'emergency_contact_ref' });
  const birthDate = useWatch({ control, name: 'birth_date' });
  const beneficiaryDni = useWatch({ control, name: 'dni' }) || '';

  // Muestra advertencia de edad bajo el campo birth_date
  const ageWarning = (() => {
    const minor = isBeneficiaryMinor(birthDate);
    if (minor === false) return 'El beneficiario no es menor de edad (≥ 18 años). No puede ser inscrito.';
    return null;
  })();

  const onSubmit = async (data: BeneficiarioFormData) => {
    // 1. DNI beneficiario
    if (!isValidDni(data.dni)) {
      toast.error('El DNI del beneficiario debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    // 2. Menor de edad (bloquea)
    const minor = isBeneficiaryMinor(data.birth_date);
    if (minor === null) {
      toast.error('La fecha de nacimiento del beneficiario es obligatoria.');
      return;
    }
    if (!minor) {
      toast.error('El beneficiario debe ser menor de 18 años.');
      return;
    }

    // 3. Apoderado obligatorio
    if (!data.guardian_ref) {
      toast.error('Debe designar un Apoderado (responsable principal) al beneficiario.');
      return;
    }
    const guardianIdx = Number(data.guardian_ref);
    const guardianAdult = data.related_adults?.[guardianIdx];
    if (!guardianAdult) {
      toast.error('El apoderado seleccionado ya no existe en la lista. Seleccione uno válido.');
      return;
    }
    const guardianName = `${guardianAdult.first_name ?? ''} ${guardianAdult.last_name ?? ''}`.trim();
    if (!guardianName) {
      toast.error('El apoderado debe tener nombre completo.');
      return;
    }
    if (guardianAdult.dni && !isValidDni(guardianAdult.dni)) {
      toast.error(`El DNI "${guardianAdult.dni}" del apoderado debe tener exactamente 8 dígitos numéricos.`);
      return;
    }

    // 4. Todos los adultos (centralizado en domain layer)
    const adultsForValidation = (data.related_adults ?? []).map(a => ({
      dni: a.dni,
      first_name: a.first_name,
      last_name: a.last_name,
      role: a.role,
    }));
    const adultsError = validateAdultsOnSubmit(adultsForValidation, data.dni.trim());
    if (adultsError) {
      toast.error(adultsError);
      return;
    }

    try {
      // Resolve guardian_ref / emergency_contact_ref → dni for the API payload
      const resolvedGuardianDni = data.related_adults?.[Number(data.guardian_ref)]?.dni ?? null;
      const resolvedEmergencyDni = data.emergency_contact_ref
        ? (data.related_adults?.[Number(data.emergency_contact_ref)]?.dni ?? null)
        : null;

      const payload = {
        ...data,
        birth_date: data.birth_date || null,
        guardian_dni: resolvedGuardianDni,
        emergency_contact_dni: resolvedEmergencyDni,
        // Remove index refs — the API expects resolved DNIs
        guardian_ref: undefined,
        emergency_contact_ref: undefined,
        medical: data.medical ?? undefined,
        education: data.education ?? undefined,
        related_adults: data.related_adults?.map(adult => ({
          ...adult,
          birth_date: adult.birth_date || null,
        })) || [],
      };

      if (isEdit && initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
        toast.success('Beneficiario actualizado exitosamente');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Beneficiario creado exitosamente');
      }
      
      router.push('/beneficiarios');
      router.refresh();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || 'Ocurrió un error al guardar el beneficiario');
    }
  };


  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* === COLUMNA IZQUIERDA: DATOS PERSONALES === */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b mb-4">
              <CardTitle className="text-lg">Datos Personales</CardTitle>
              <CardDescription>Información principal del beneficiario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="dni">DNI / Documento *</Label>
                <Input id="dni" placeholder="Ej: 12345678" {...register('dni')} />
                {errors.dni && (
                  <p className="text-sm font-medium text-destructive">{errors.dni.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name">Nombres *</Label>
                <Input id="first_name" placeholder="Ej: Juan Pablo" {...register('first_name')} />
                {errors.first_name && (
                  <p className="text-sm font-medium text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Apellidos *</Label>
                <Input id="last_name" placeholder="Ej: Pérez Gómez" {...register('last_name')} />
                {errors.last_name && (
                  <p className="text-sm font-medium text-destructive">{errors.last_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Fecha de nac. *</Label>
                  <Input id="birth_date" type="date" {...register('birth_date')} />
                  {errors.birth_date && (
                    <p className="text-xs font-medium text-destructive">{errors.birth_date.message}</p>
                  )}
                  {ageWarning && (
                    <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5">
                      <OctagonAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      <p className="text-xs font-medium text-destructive">{ageWarning}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={(val) => field.onChange(val === '' ? null : val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Masculino</SelectItem>
                          <SelectItem value="FEMALE">Femenino</SelectItem>
                          <SelectItem value="OTHER">Otro</SelectItem>
                          <SelectItem value="UNKNOWN">Desconocido</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" placeholder="Ej: Av. Principal 123" {...register('address')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 border-b mb-4">
              <CardTitle className="text-lg">Permisos Especiales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-row items-center space-x-3">
                  <Controller name="baptized" control={control} render={({ field }) => (
                    <Checkbox id="baptized" checked={field.value ?? false} onCheckedChange={field.onChange} />
                  )} />
                  <Label htmlFor="baptized" className="font-normal">Bautizado</Label>
                </div>
                <div className="flex flex-row items-center space-x-3">
                  <Controller name="first_communion" control={control} render={({ field }) => (
                    <Checkbox id="first_communion" checked={field.value ?? false} onCheckedChange={field.onChange} />
                  )} />
                  <Label htmlFor="first_communion" className="font-normal">Primera Comunión</Label>
                </div>
                <div className="flex flex-row items-center space-x-3">
                  <Controller name="haircut_permission" control={control} render={({ field }) => (
                    <Checkbox id="haircut_permission" checked={field.value ?? false} onCheckedChange={field.onChange} />
                  )} />
                  <Label htmlFor="haircut_permission" className="font-normal">Permiso Corte de Pelo</Label>
                </div>
                <div className="flex flex-row items-center space-x-3">
                  <Controller name="medical_exams_permission" control={control} render={({ field }) => (
                    <Checkbox id="medical_exams_permission" checked={field.value ?? false} onCheckedChange={field.onChange} />
                  )} />
                  <Label htmlFor="medical_exams_permission" className="font-normal">Permiso Exámenes Médicos</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* === COLUMNA DERECHA: RESTO DE LA INFORMACIÓN === */}
        <div className="lg:col-span-7">
          <Tabs defaultValue="medicos" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="medicos">Médicos</TabsTrigger>
              <TabsTrigger value="educacion">Educación</TabsTrigger>
              <TabsTrigger value="adultos">Adultos ({adultFields.length})</TabsTrigger>
            </TabsList>

            {/* --- DATOS MEDICOS --- */}
            <TabsContent value="medicos" className="space-y-6">
              <Card>
                <CardHeader className="pb-4 border-b mb-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Historial Médico</CardTitle>
                  </div>
                  <CardDescription>
                    Registre alergias, vacunas, enfermedades crónicas y antecedentes del beneficiario.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Antecedentes Clínicos */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" /> Antecedentes Quirúrgicos / Clínicos
                    </h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-4 rounded-xl border p-5 bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                          <Controller name="medical.has_been_hospitalized" control={control} render={({ field }) => (
                            <Checkbox id="has_been_hospitalized" checked={field.value ?? false} onCheckedChange={field.onChange} />
                          )} />
                          <Label htmlFor="has_been_hospitalized" className="font-medium text-base">¿Ha sido hospitalizado?</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hospitalization_reason" className="text-muted-foreground text-sm">Motivo (si aplica)</Label>
                          <Input id="hospitalization_reason" placeholder="Ej: Neumonía..." {...register('medical.hospitalization_reason')} />
                        </div>
                      </div>

                      <div className="space-y-4 rounded-xl border p-5 bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                          <Controller name="medical.has_been_operated" control={control} render={({ field }) => (
                            <Checkbox id="has_been_operated" checked={field.value ?? false} onCheckedChange={field.onChange} />
                          )} />
                          <Label htmlFor="has_been_operated" className="font-medium text-base">¿Ha sido operado?</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="operation_reason" className="text-muted-foreground text-sm">Motivo (si aplica)</Label>
                          <Input id="operation_reason" placeholder="Ej: Apendicitis..." {...register('medical.operation_reason')} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Listas Multiselect */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Pill className="w-4 h-4" /> Tratamientos y Condiciones
                    </h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="vaccines" className="flex items-center gap-2">
                          <Syringe className="w-4 h-4 text-blue-500" /> Vacunas Administradas
                        </Label>
                        <Controller name="medical.vaccines" control={control} render={({ field }) => (
                          <MultiSelectCreatable value={field.value || []} onChange={field.onChange} options={commonVaccines} placeholder="Buscar o registrar nueva vacuna..." />
                        )} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allergies" className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" /> Alergias Conocidas
                        </Label>
                        <Controller name="medical.allergies" control={control} render={({ field }) => (
                          <MultiSelectCreatable value={field.value || []} onChange={field.onChange} options={commonAllergies} placeholder="Buscar alergia..." />
                        )} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medications" className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-green-500" /> Medicamentos Habituales
                        </Label>
                        <Controller name="medical.medications" control={control} render={({ field }) => (
                          <MultiSelectCreatable value={field.value || []} onChange={field.onChange} options={commonMedications} placeholder="Buscar medicamento..." />
                        )} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="diseases" className="flex items-center gap-2">
                          <HeartPulse className="w-4 h-4 text-red-500" /> Enfermedades Pre-existentes
                        </Label>
                        <Controller name="medical.diseases" control={control} render={({ field }) => (
                          <MultiSelectCreatable value={field.value || []} onChange={field.onChange} options={commonDiseases} placeholder="Buscar enfermedad..." />
                        )} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="insurance" className="flex items-center gap-2">
                          <ShieldPlus className="w-4 h-4 text-indigo-500" /> Cobertura / Seguros
                        </Label>
                        <Controller name="medical.insurance" control={control} render={({ field }) => (
                          <MultiSelectCreatable value={field.value || []} onChange={field.onChange} options={commonInsurances} placeholder="Buscar seguro de salud..." />
                        )} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- DATOS DE EDUCACION --- */}
            <TabsContent value="educacion" className="space-y-6">
              <Card>
                <CardHeader className="pb-4 border-b mb-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Perfil Educativo</CardTitle>
                  </div>
                  <CardDescription>
                    Información sobre el desarrollo escolar y aptitudes del beneficiario.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="school">Institución Educativa (Colegio)</Label>
                      <Controller
                        control={control}
                        name="education.school"
                        render={({ field }) => (
                          <SchoolSelect
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade">Grado Escolar Actual</Label>
                      <Controller
                        name="education.grade"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || ''} onValueChange={(val) => field.onChange(val === '' ? null : val)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione el grado..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INICIAL_3">Inicial 3 años</SelectItem>
                              <SelectItem value="INICIAL_4">Inicial 4 años</SelectItem>
                              <SelectItem value="INICIAL_5">Inicial 5 años</SelectItem>
                              <SelectItem value="1RO_PRIMARIA">1ro Primaria</SelectItem>
                              <SelectItem value="2DO_PRIMARIA">2do Primaria</SelectItem>
                              <SelectItem value="3RO_PRIMARIA">3ro Primaria</SelectItem>
                              <SelectItem value="4TO_PRIMARIA">4to Primaria</SelectItem>
                              <SelectItem value="5TO_PRIMARIA">5to Primaria</SelectItem>
                              <SelectItem value="6TO_PRIMARIA">6to Primaria</SelectItem>
                              <SelectItem value="1RO_SECUNDARIA">1ro Secundaria</SelectItem>
                              <SelectItem value="2DO_SECUNDARIA">2do Secundaria</SelectItem>
                              <SelectItem value="3RO_SECUNDARIA">3ro Secundaria</SelectItem>
                              <SelectItem value="4TO_SECUNDARIA">4to Secundaria</SelectItem>
                              <SelectItem value="5TO_SECUNDARIA">5to Secundaria</SelectItem>
                              <SelectItem value="SUPERIOR">Superior</SelectItem>
                              <SelectItem value="NINGUNO">Ninguno</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-4 rounded-xl border p-5 md:col-span-2 bg-card shadow-sm mt-4">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" /> Aptitudes y Dificultades
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-row items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                          <Controller name="education.knows_how_to_read" control={control} render={({ field }) => (
                            <Checkbox id="knows_how_to_read" checked={field.value ?? false} onCheckedChange={field.onChange} />
                          )} />
                          <Label htmlFor="knows_how_to_read" className="font-normal cursor-pointer w-full">Sabe leer</Label>
                        </div>
                        <div className="flex flex-row items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                          <Controller name="education.knows_how_to_write" control={control} render={({ field }) => (
                            <Checkbox id="knows_how_to_write" checked={field.value ?? false} onCheckedChange={field.onChange} />
                          )} />
                          <Label htmlFor="knows_how_to_write" className="font-normal cursor-pointer w-full">Sabe escribir</Label>
                        </div>
                        <div className="flex flex-row items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                          <Controller name="education.has_repeated_grade" control={control} render={({ field }) => (
                            <Checkbox id="has_repeated_grade" checked={field.value ?? false} onCheckedChange={field.onChange} />
                          )} />
                          <Label htmlFor="has_repeated_grade" className="font-normal cursor-pointer w-full">Ha repetido de año</Label>
                        </div>
                        <div className="flex flex-row items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                          <Controller name="education.has_learning_difficulties" control={control} render={({ field }) => (
                            <Checkbox id="has_learning_difficulties" checked={field.value ?? false} onCheckedChange={field.onChange} />
                          )} />
                          <Label htmlFor="has_learning_difficulties" className="font-normal cursor-pointer w-full">Dificultades de aprendizaje</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- DATOS ADULTOS --- */}
            <TabsContent value="adultos" className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2 mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Adultos Relacionados</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Máx. {BENEFICIARY_MAX_ADULTS} · Designa un Apoderado (obligatorio) y un Contacto de Emergencia (opcional).
                  </p>
                </div>
                {adultFields.length < BENEFICIARY_MAX_ADULTS && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAdultSearchModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Buscar o Agregar Adulto
                  </Button>
                )}
              </div>

              <AdultSearchModal
                open={isAdultSearchModalOpen}
                onOpenChange={setIsAdultSearchModalOpen}
                onAdultFound={(adult) => {
                  if (adultFields.length >= BENEFICIARY_MAX_ADULTS) return;
                  appendAdult({
                    ...adult,
                    role: adult.role || 'OTHER',
                  });
                }}
                onAdultCreateNew={(dni) => {
                  if (adultFields.length >= BENEFICIARY_MAX_ADULTS) return;
                  appendAdult({ 
                    dni: dni,
                    first_name: '', 
                    last_name: '', 
                    role: 'OTHER', 
                  });
                }}
              />

              {adultFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                  No hay adultos registrados. Agrega al menos uno para designar el Apoderado.
                </div>
              ) : (
                <div className="space-y-4">
                  {adultFields.map((field, index) => {
                    const isGuardian = guardianRef === String(index);
                    const isEmergency = emergencyRef === String(index);
                    const adultRole = watchedAdults[index]?.role || 'OTHER';
                    const adultDni = watchedAdults[index]?.dni || '';
                    const dniError = validateAdultDni(
                      adultDni,
                      index,
                      beneficiaryDni.trim(),
                      watchedAdults.map(a => ({ dni: a?.dni })),
                      isGuardian
                    );

                    return (
                      <div key={field.id} className="relative flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
                        {/* Header con número y botón eliminar */}
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] text-primary">
                              {index + 1}
                            </span>
                            {isGuardian && (
                              <span className="flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                <UserCheck className="size-3" /> Apoderado
                              </span>
                            )}
                            {isEmergency && (
                              <span className="flex items-center gap-1 rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                                <PhoneCall className="size-3" /> Emergencia
                              </span>
                            )}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              // Ajustar refs al eliminar (mismo patrón que triaje)
                              const gRef = parseInt(guardianRef || '-1', 10);
                              if (gRef === index) setValue('guardian_ref', '');
                              else if (gRef > index) setValue('guardian_ref', String(gRef - 1));

                              const eRef = parseInt(emergencyRef || '-1', 10);
                              if (eRef === index) setValue('emergency_contact_ref', '');
                              else if (eRef > index) setValue('emergency_contact_ref', String(eRef - 1));

                              removeAdult(index);
                            }}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="text-[11px] font-medium">Eliminar</span>
                          </button>
                        </div>

                        {/* Campos */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-muted-foreground">Nombres *</Label>
                            <Input {...register(`related_adults.${index}.first_name`)} placeholder="Ej: María" className="h-8 text-[12.5px]" />
                            {errors.related_adults?.[index]?.first_name && (
                              <p className="text-[10px] text-destructive">{errors.related_adults[index]?.first_name?.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-muted-foreground">Apellidos *</Label>
                            <Input {...register(`related_adults.${index}.last_name`)} placeholder="Ej: García" className="h-8 text-[12.5px]" />
                            {errors.related_adults?.[index]?.last_name && (
                              <p className="text-[10px] text-destructive">{errors.related_adults[index]?.last_name?.message}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-muted-foreground">DNI (8 dígitos)</Label>
                            <Input
                              inputMode="numeric"
                              maxLength={8}
                              {...register(`related_adults.${index}.dni`)}
                              placeholder="Ej: 87654321"
                              className={cn('h-8 text-[12.5px]', dniError && 'border-destructive bg-destructive/5')}
                            />
                            {dniError && <p className="text-[10px] text-destructive">{dniError}</p>}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-muted-foreground">Teléfono</Label>
                            <Input {...register(`related_adults.${index}.phone`)} placeholder="Ej: 999888777" className="h-8 text-[12.5px]" />
                          </div>

                          <div className="space-y-1.5 col-span-2 md:col-span-1">
                            <Label className="text-[10.5px] font-semibold text-muted-foreground">Parentesco</Label>
                            <Controller
                              name={`related_adults.${index}.role`}
                              control={control}
                              render={({ field }) => (
                                <Select value={field.value || 'OTHER'} onValueChange={field.onChange}>
                                  <SelectTrigger className="h-8 text-[12.5px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SELECTABLE_RELATIONSHIP_ROLES.map((role) => (
                                      <SelectItem
                                        key={role}
                                        value={role}
                                        disabled={hasConflictingExclusiveRole(
                                          watchedAdults.map(a => ({ role: a?.role })),
                                          index,
                                          role
                                        )}
                                      >
                                        {getRelationshipLabel(role)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        </div>

                        {/* Roles exclusivos: Apoderado y Contacto de Emergencia */}
                        <div className="mt-1 flex flex-wrap gap-2 pt-1">
                          {/* Apoderado — radio exclusivo */}
                          <Controller
                            control={control}
                            name="guardian_ref"
                            render={({ field: rhf }) => (
                              <label className={cn(
                                'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border py-2 transition-all',
                                isGuardian
                                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                  : 'border-border bg-slate-50/50 text-muted-foreground hover:bg-slate-50'
                              )}>
                                <input
                                  type="radio"
                                  name="guardian_radio"
                                  checked={isGuardian}
                                  onChange={() => rhf.onChange(String(index))}
                                  className="sr-only"
                                />
                                <div className={cn('flex size-4 items-center justify-center rounded-full border', isGuardian ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-white')}>
                                  {isGuardian && <span className="size-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="text-[11.5px] font-semibold">Es Apoderado</span>
                              </label>
                            )}
                          />
                          {/* Contacto emergencia — radio exclusivo */}
                          <Controller
                            control={control}
                            name="emergency_contact_ref"
                            render={({ field: rhf }) => (
                              <label className={cn(
                                'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border py-2 transition-all',
                                isEmergency
                                  ? 'border-destructive bg-destructive/5 text-destructive shadow-sm'
                                  : 'border-border bg-slate-50/50 text-muted-foreground hover:bg-slate-50'
                              )}>
                                <input
                                  type="radio"
                                  name="emergency_radio"
                                  checked={isEmergency}
                                  onChange={() => rhf.onChange(String(index))}
                                  className="sr-only"
                                />
                                <div className={cn('flex size-4 items-center justify-center rounded-full border', isEmergency ? 'border-destructive bg-destructive' : 'border-muted-foreground/30 bg-white')}>
                                  {isEmergency && <span className="size-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="text-[11.5px] font-semibold">Contacto Emergencia</span>
                              </label>
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Advertencia si no hay apoderado designado y hay al menos un adulto */}
              {adultFields.length > 0 && !guardianRef && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <OctagonAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <p className="text-xs font-medium text-destructive">
                    Debe designar un Apoderado. Selecciona «Es Apoderado» en el adulto responsable principal.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex gap-4 justify-end pt-6 border-t mt-8">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Beneficiario'}
        </Button>
      </div>
    </form>
  );
}
