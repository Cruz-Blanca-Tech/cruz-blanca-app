import Link from 'next/link';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EducaCase } from '../schemas/educa-case-schema';

const CASE_STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING_REVIEW: {
    label: 'Pendiente de revisión',
    className: 'bg-warning-light text-warning-dark',
  },
  IN_REVIEW: { label: 'En revisión', className: 'bg-info-light text-info-dark' },
  APPROVED: { label: 'Aprobado', className: 'bg-success-light text-success-dark' },
  REJECTED: { label: 'Rechazado', className: 'bg-error-light text-error-dark' },
  INCOMPLETE: { label: 'Incompleto', className: 'bg-error-light text-error-dark' },
};

function titleCase(value: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

interface CaseNavTarget {
  id: string;
  dni_reference: string;
}

interface CaseCorrectionHeaderProps {
  caseData: EducaCase;
  dniReference: string;
  batchId: string;
  batchDateLabel: string | null;
  currentIndex: number;
  totalCases: number;
  prevCase?: CaseNavTarget;
  nextCase?: CaseNavTarget;
  onNavigate: (target: CaseNavTarget) => void;
}

/** Breadcrumb + título + badge de estado + navegación prev/next del expediente. */
export function CaseCorrectionHeader({
  caseData,
  dniReference,
  batchId,
  batchDateLabel,
  currentIndex,
  totalCases,
  prevCase,
  nextCase,
  onNavigate,
}: CaseCorrectionHeaderProps) {
  const beneficiary = caseData.dossier_data.beneficiary;
  const beneficiaryName =
    `${titleCase(beneficiary.first_name)} ${titleCase(beneficiary.last_name)}`.trim() ||
    dniReference;
  const statusMeta = CASE_STATUS_META[caseData.status];

  return (
    <>
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
        <Link href={`/triaje/${batchId}`} className="text-primary hover:underline">
          {batchDateLabel ? `Lote ${batchDateLabel}` : 'Lote'}
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
            onClick={() => prevCase && onNavigate(prevCase)}
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
            onClick={() => nextCase && onNavigate(nextCase)}
            disabled={!nextCase}
            aria-label="Registro siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </>
  );
}
