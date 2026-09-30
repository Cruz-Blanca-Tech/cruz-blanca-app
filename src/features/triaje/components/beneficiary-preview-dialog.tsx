'use client';

import { useQuery } from '@tanstack/react-query';
import { FileSearch, Loader2, UserRound, Users, UserCheck } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isoToDdMmYyyy } from '@/components/ui/date-picker';
import { getGenderLabel, getRelationshipLabel } from '@/lib/domain/enum-labels';
import { isValidDni } from '@/lib/domain/beneficiary-rules';
import { cn } from '@/lib/utils';
import { mdmMatchKeys } from '../hooks/use-mdm-match';
import { caseCorrectionService } from '../services/case-correction-service';

/**
 * Vista previa de la persona YA REGISTRADA a la que una sugerencia de IA pide
 * vincular el expediente.
 *
 * El botón "Vincular" propone un DNI pero no deja ver QUIÉN es esa persona: el
 * operador tenía que abrir el maestro por su cuenta (o, peor, aceptar a ciegas).
 * Este diálogo resuelve el DNI contra `GET /mdm/beneficiaries/by-dni/{dni}` y
 * muestra los datos de identidad y los familiares registrados.
 *
 * Si el DNI no existe en el maestro, lo dice explícitamente: en ese caso la
 * sugerencia viene de otra ficha del mismo lote, no de un beneficiario previo.
 */

interface BeneficiaryPreviewDialogProps {
  dni: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `beneficiario` | `adulto`: cambia el encabezado según a quién se vincule. */
  role?: 'beneficiario' | 'adulto';
  /** Contexto de por qué se está mirando (ej. "posible duplicado"). */
  reason?: string;
}

function Fila({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="font-sans text-[11px] font-medium text-ink-muted">{label}</span>
      <span className="font-data text-[12.5px] text-right text-ink-secondary break-words">
        {value?.trim() ? value : '—'}
      </span>
    </div>
  );
}

export function BeneficiaryPreviewDialog({
  dni,
  open,
  onOpenChange,
  role = 'beneficiario',
  reason,
}: BeneficiaryPreviewDialogProps) {
  const dniValido = isValidDni(dni);
  const consulta = useQuery({
    queryKey: mdmMatchKeys.byDni(dni),
    queryFn: () => caseCorrectionService.getMdmBeneficiaryMatch(dni),
    // Solo se consulta al abrir el diálogo: la sugerencia puede apuntar a un DNI
    // que el formulario todavía no tiene, así que no se adelanta al render.
    enabled: open && dniValido,
    staleTime: 5 * 60 * 1000,
  });

  const persona = consulta.data?.exists ? consulta.data.beneficiary : null;
  const enMaestro = consulta.data?.exists === true;
  const titulo = enMaestro
    ? (role === 'adulto' ? 'Adulto ya registrado en el maestro' : 'Beneficiario ya registrado en el maestro')
    : (role === 'adulto' ? 'Adulto sugerido (no está en el maestro)' : 'Beneficiario sugerido (no está en el maestro)');
  const icono = enMaestro ? <UserCheck className="size-4 text-info-dark" /> : <FileSearch className="size-4 text-purple-600" />;
  const colorIcono = enMaestro ? 'text-info-dark' : 'text-purple-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icono}
            {titulo}
          </DialogTitle>
          <DialogDescription>
            {enMaestro
              ? (reason
                  ? `${reason}. Estos son los datos que ya tiene registrados el maestro.`
                  : 'Estos son los datos que ya tiene registrados el maestro.')
              : (reason
                  ? `${reason}. Este DNI no está en el maestro: la sugerencia viene de otra ficha del mismo lote.`
                  : 'Este DNI no está en el maestro: la sugerencia viene de otra ficha del mismo lote.')}
          </DialogDescription>
        </DialogHeader>

        {!dniValido ? (
          <p className="font-data text-xs text-error-dark">
            El DNI propuesto no tiene un formato válido, así que no se puede buscar en el
            maestro.
          </p>
        ) : consulta.isFetching ? (
          <div className="flex items-center gap-2 py-4 text-ink-muted">
            <Loader2 className="size-4 animate-spin" />
            <span className="font-data text-xs">Buscando en el maestro…</span>
          </div>
        ) : consulta.isError ? (
          <p className="font-data text-xs text-error-dark">
            No se pudo consultar el maestro. Revisá la conexión y volvé a intentar.
          </p>
        ) : !persona ? (
          <p className="font-data text-xs leading-relaxed text-ink-secondary">
            El DNI <span className="font-bold">{dni}</span> no está registrado en el
            maestro como beneficiario. La sugerencia no viene de un beneficiario previo,
            sino de otra ficha del mismo lote.
          </p>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
              <Fila label="DNI" value={persona.dni} />
              <Fila
                label="Nombre"
                value={`${persona.first_name || ''} ${persona.last_name || ''}`.trim()}
              />
              <Fila label="Fecha de nacimiento" value={isoToDdMmYyyy(persona.birth_date)} />
              <Fila label="Sexo" value={getGenderLabel(persona.gender)} />
              <Fila label="Dirección" value={persona.address} />
            </div>

            {persona.relatives.length > 0 && (
              <div>
                <h5 className="mb-1 flex items-center gap-1.5 font-sans text-[11px] font-semibold text-ink-secondary">
                  <Users className="size-3.5" />
                  Familiares registrados
                </h5>
                <div className="rounded-md border border-border bg-muted/40 px-3 py-1.5">
                  {persona.relatives.map((r, i) => (
                    <div
                      key={`${r.dni}-${i}`}
                      className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 last:border-0"
                    >
                      <span className="font-sans text-[11px] font-medium text-ink-muted">
                        {getRelationshipLabel(r.relationship)}
                        {r.is_emergency_contact && (
                          <span className="ml-1 font-data text-[10px] text-error">
                            • emergencia
                          </span>
                        )}
                      </span>
                      <span className="text-right">
                        <span className="block font-data text-[12.5px] text-ink-secondary">
                          {r.full_name}
                        </span>
                        <span
                          className={cn(
                            'block font-data text-[10.5px] text-ink-muted',
                            r.phone ? '' : 'italic'
                          )}
                        >
                          {r.dni}
                          {r.phone ? ` · ${r.phone}` : ' · sin teléfono'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {persona.relatives.length === 0 && (
              <p className="flex items-center gap-1.5 font-data text-[11px] text-ink-muted">
                <UserRound className="size-3.5 shrink-0" />
                No tiene familiares registrados en el maestro.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
