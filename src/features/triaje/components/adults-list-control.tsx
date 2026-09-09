'use client';

import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, X, OctagonAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CorrectionFormValues } from '../lib/correction-form';

/** Editor de adultos relacionados: alta/baja + asignación de apoderado/emergencia. */
export function AdultsListControl() {
  const { control } = useFormContext<CorrectionFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'adults',
  });

  const guardianRef = useWatch({ control, name: 'guardian_ref' });
  const emergencyRef = useWatch({ control, name: 'emergency_contact_ref' });
  const watchedAdults = useWatch({ control, name: 'adults' }) || [];
  const beneficiaryDni = useWatch({ control, name: 'beneficiary.dni' }) || '';

  // Calcular roles ya ocupados (ignorando la fila actual para que el usuario pueda ver su propio rol seleccionado)
  const getRoleDisabled = (role: string, currentIndex: number) => {
    return watchedAdults.some((a, i) => i !== currentIndex && a.relationship === role);
  };

  const getDniError = (dni: string | undefined, currentIndex: number): string | null => {
    const trimmed = (dni || '').trim();
    const isGuardian = guardianRef === String(currentIndex);

    if (isGuardian && !trimmed) {
      return 'El apoderado debe tener DNI obligatorio.';
    }

    if (!trimmed) {
      return 'El DNI es obligatorio para registrar al familiar.';
    }

    if (trimmed.length !== 8 || !/^\d{8}$/.test(trimmed)) {
      return 'El DNI debe tener exactamente 8 dígitos numéricos.';
    }

    if (beneficiaryDni.trim() && trimmed === beneficiaryDni.trim()) {
      return 'Coincide con el DNI del beneficiario.';
    }

    const isDuplicate = watchedAdults.some(
      (other, idx) => idx !== currentIndex && (other.dni || '').trim() === trimmed
    );
    if (isDuplicate) {
      return 'DNI duplicado con otro familiar.';
    }

    return null;
  };

  // Resumen de conflictos globales de DNI
  const duplicateDniMessages: string[] = [];
  const seenDnis = new Map<string, string>();
  const trimmedBenDni = beneficiaryDni.trim();

  watchedAdults.forEach((adult, idx) => {
    const dni = (adult.dni || '').trim();
    if (!dni) return;
    const label =
      adult.full_name ||
      (adult.relationship === 'FATHER'
        ? 'Padre'
        : adult.relationship === 'MOTHER'
        ? 'Madre'
        : `Contacto ${idx + 1}`);

    if (trimmedBenDni && dni === trimmedBenDni) {
      duplicateDniMessages.push(`El DNI ${dni} de '${label}' coincide con el DNI del beneficiario.`);
    }

    if (seenDnis.has(dni)) {
      const prev = seenDnis.get(dni);
      duplicateDniMessages.push(`El DNI ${dni} está duplicado entre '${prev}' y '${label}'.`);
    } else {
      seenDnis.set(dni, label);
    }
  });

  const handleAppend = () => {
    if (fields.length >= 3) return;
    const usedRoles = watchedAdults.map(a => a.relationship);
    const availableRole = ['FATHER', 'MOTHER', 'OTHER'].find(r => !usedRoles.includes(r)) || 'OTHER';
    append({ full_name: '', dni: '', phone: '', relationship: availableRole });
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      {duplicateDniMessages.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-error/40 bg-error-light p-3 text-error-dark">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <OctagonAlert className="size-4 shrink-0 text-error" />
            <span>Conflicto de DNI: cada persona debe tener un DNI único</span>
          </div>
          <ul className="ml-6 list-disc text-[11px] leading-tight space-y-0.5">
            {duplicateDniMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
      {fields.map((field, index) => {
        const isGuardian = guardianRef === String(index);
        const isEmergency = emergencyRef === String(index);

        return (
          <div key={field.id} className="group relative flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="flex items-center gap-1.5 font-sans text-xs font-bold text-ink-primary">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] text-primary">
                  {index + 1}
                </span>
                Contacto
              </h4>
              <button
                type="button"
                onClick={() => remove(index)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-muted transition-all hover:bg-error-light hover:text-error"
                title="Eliminar contacto"
              >
                <X className="size-3.5" />
                <span className="font-sans text-[11px] font-medium">Eliminar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={control}
                name={`adults.${index}.full_name`}
                render={({ field: rhf }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[10.5px] font-semibold text-ink-secondary">Nombre completo</label>
                    <Input {...rhf} placeholder="Ej. Juan Pérez" className="h-8 font-data text-[12.5px] shadow-sm transition-all focus:ring-primary/20" />
                  </div>
                )}
              />
              <Controller
                control={control}
                name={`adults.${index}.relationship`}
                render={({ field: rhf }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[10.5px] font-semibold text-ink-secondary">Parentesco</label>
                    <Select value={rhf.value || ''} onValueChange={rhf.onChange}>
                      <SelectTrigger className="h-8 font-data text-[12.5px] shadow-sm focus:ring-primary/20">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FATHER" disabled={getRoleDisabled('FATHER', index)}>Padre</SelectItem>
                        <SelectItem value="MOTHER" disabled={getRoleDisabled('MOTHER', index)}>Madre</SelectItem>
                        <SelectItem value="OTHER" disabled={getRoleDisabled('OTHER', index)}>Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                control={control}
                name={`adults.${index}.dni`}
                render={({ field: rhf }) => {
                  const dniError = getDniError(rhf.value, index);
                  return (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-[10.5px] font-semibold text-ink-secondary">
                        DNI {isGuardian && <span className="text-error font-bold">* (Obligatorio apoderado)</span>}
                      </label>
                      <Input
                        inputMode="numeric"
                        maxLength={8}
                        value={rhf.value || ''}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 8);
                          rhf.onChange(cleaned);
                        }}
                        onBlur={rhf.onBlur}
                        placeholder="Ej. 12345678"
                        className={cn(
                          'h-8 font-data text-[12.5px] shadow-sm transition-all focus:ring-primary/20',
                          dniError && 'border-error bg-error/5 text-error-dark focus-visible:ring-error/20'
                        )}
                      />
                      {dniError && (
                        <span className="font-sans text-[10px] font-semibold text-error">
                          {dniError}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
              <Controller
                control={control}
                name={`adults.${index}.phone`}
                render={({ field: rhf }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[10.5px] font-semibold text-ink-secondary">Teléfono</label>
                    <Input {...rhf} placeholder="Ej. 987654321" className="h-8 font-data text-[12.5px] shadow-sm transition-all focus:ring-primary/20" />
                  </div>
                )}
              />
            </div>

            <div className="mt-1 flex flex-wrap gap-2 pt-1">
              <Controller
                control={control}
                name="guardian_ref"
                render={({ field: rhf }) => (
                  <label
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border py-2 transition-all',
                      isGuardian
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border bg-slate-50/50 text-ink-muted hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="guardian_radio"
                      checked={isGuardian}
                      onChange={() => rhf.onChange(String(index))}
                      className="sr-only"
                    />
                    <div className={cn("flex size-4 items-center justify-center rounded-full border", isGuardian ? "border-primary bg-primary" : "border-ink-muted/30 bg-white")}>
                      {isGuardian && <span className="size-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-sans text-[11.5px] font-semibold">Es Apoderado</span>
                  </label>
                )}
              />
              <Controller
                control={control}
                name="emergency_contact_ref"
                render={({ field: rhf }) => (
                  <label
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border py-2 transition-all',
                      isEmergency
                        ? 'border-error bg-error/5 text-error shadow-sm'
                        : 'border-border bg-slate-50/50 text-ink-muted hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="emergency_radio"
                      checked={isEmergency}
                      onChange={() => rhf.onChange(String(index))}
                      className="sr-only"
                    />
                    <div className={cn("flex size-4 items-center justify-center rounded-full border", isEmergency ? "border-error bg-error" : "border-ink-muted/30 bg-white")}>
                      {isEmergency && <span className="size-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-sans text-[11.5px] font-semibold">Contacto Emergencia</span>
                  </label>
                )}
              />
            </div>
          </div>
        );
      })}

      {fields.length < 3 && (
        <button
          type="button"
          onClick={handleAppend}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 py-3 font-sans text-xs font-semibold text-primary transition-all hover:bg-primary/10 hover:shadow-sm"
        >
          <Plus className="size-4" /> Añadir adulto relacionado
        </button>
      )}
    </div>
  );
}
