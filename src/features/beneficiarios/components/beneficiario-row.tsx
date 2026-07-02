import { Eye } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';

import type { BeneficiarySummary } from '../schemas/beneficiaries-list-schema';
import {
  getFullName,
  getGenderLabel,
  getInitials,
  maskDni,
  maskName,
} from '../lib/beneficiario-format';

interface BeneficiarioRowProps {
  beneficiary: BeneficiarySummary;
  /** El rol Visualizador enmascara nombre y DNI. */
  masked: boolean;
}

/** Una fila de la tabla de beneficiarios. */
export function BeneficiarioRow({ beneficiary, masked }: BeneficiarioRowProps) {
  const fullName = getFullName(beneficiary);

  return (
    <TableRow>
      {/* Nombre completo + avatar de iniciales */}
      <TableCell className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback className="bg-secondary font-data text-[11px] text-secondary-foreground">
              {masked ? '?' : getInitials(beneficiary)}
            </AvatarFallback>
          </Avatar>
          <span
            className={
              masked
                ? 'font-sans text-sm font-medium text-ink-muted italic'
                : 'font-sans text-sm font-medium text-ink-primary'
            }
          >
            {masked ? maskName(fullName) : fullName}
          </span>
        </div>
      </TableCell>

      {/* DNI */}
      <TableCell className="px-4 py-3 align-middle font-data text-[12.5px] text-ink-secondary tabular-nums">
        {masked ? (
          <span className="text-ink-muted">
            •••• <span className="font-medium text-ink-secondary">{maskDni(beneficiary.dni)}</span>
          </span>
        ) : (
          beneficiary.dni
        )}
      </TableCell>

      {/* Edad */}
      <TableCell className="px-4 py-3 text-center align-middle font-data text-[12.5px] text-ink-secondary tabular-nums">
        {beneficiary.age ?? '—'}
      </TableCell>

      {/* Género */}
      <TableCell className="px-4 py-3 align-middle font-data text-[12.5px] text-ink-secondary">
        {getGenderLabel(beneficiary.gender)}
      </TableCell>

      {/* Grado */}
      <TableCell className="px-4 py-3 align-middle font-data text-[12.5px] text-ink-secondary">
        {beneficiary.grade ?? '—'}
      </TableCell>

      {/* Acciones */}
      <TableCell className="px-4 py-3 text-right align-middle">
        {/* TODO: enlazar a /beneficiarios/[id] cuando exista la pantalla de
            detalle del beneficiario. Por ahora es un placeholder deshabilitado. */}
        <Button
          size="sm"
          variant="outline"
          disabled
          title="El perfil del beneficiario estará disponible próximamente"
        >
          <Eye />
          Ver perfil
        </Button>
      </TableCell>
    </TableRow>
  );
}
