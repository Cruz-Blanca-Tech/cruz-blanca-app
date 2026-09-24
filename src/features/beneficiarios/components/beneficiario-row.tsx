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

import { useRouter } from 'next/navigation';

interface BeneficiarioRowProps {
  beneficiary: BeneficiarySummary;
  /** El rol Visualizador enmascara nombre y DNI. */
  masked: boolean;
}

/** Una fila de la tabla de beneficiarios. */
export function BeneficiarioRow({ beneficiary, masked }: BeneficiarioRowProps) {
  const router = useRouter();
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
        {(() => {
          const rawGrade = beneficiary.grade;
          if (!rawGrade) return '—';
          const gradeMap: Record<string, string> = {
            'INICIAL_3': 'Inicial 3 años',
            'INICIAL_4': 'Inicial 4 años',
            'INICIAL_5': 'Inicial 5 años',
            '1RO_PRIMARIA': '1ro Primaria',
            '2DO_PRIMARIA': '2do Primaria',
            '3RO_PRIMARIA': '3ro Primaria',
            '4TO_PRIMARIA': '4to Primaria',
            '5TO_PRIMARIA': '5to Primaria',
            '6TO_PRIMARIA': '6to Primaria',
            '1RO_SECUNDARIA': '1ro Secundaria',
            '2DO_SECUNDARIA': '2do Secundaria',
            '3RO_SECUNDARIA': '3ro Secundaria',
            '4TO_SECUNDARIA': '4to Secundaria',
            '5TO_SECUNDARIA': '5to Secundaria',
            'SUPERIOR': 'Educación Superior',
            'NINGUNO': 'Ninguno',
          };
          return gradeMap[rawGrade] || rawGrade;
        })()}
      </TableCell>

      {/* Acciones */}
      <TableCell className="px-4 py-3 text-right align-middle">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/beneficiarios/${beneficiary.id}`)}
          >
            <Eye className="mr-1 h-4 w-4" />
            Perfil
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
