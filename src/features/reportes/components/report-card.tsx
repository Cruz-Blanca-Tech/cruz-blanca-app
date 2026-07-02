'use client';

import { Download, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { ReportDescriptor } from '../types/report';
import { useReportDownload } from '../hooks/use-report-download';

interface ReportCardProps {
  report: ReportDescriptor;
}

/**
 * Tarjeta de un reporte CSV: icono, título, descripción y botón "Descargar CSV".
 *
 * Cada tarjeta instancia su PROPIO `useReportDownload`, así el estado `isPending`
 * (spinner + botón deshabilitado) queda acotado a esta descarga y no bloquea las
 * demás tarjetas. Los errores/éxitos los notifica el hook vía toast.
 */
export function ReportCard({ report }: ReportCardProps) {
  const { mutate, isPending } = useReportDownload();
  const Icon = report.icon;

  return (
    <Card className="justify-between gap-4 p-5 ring-border">
      <div className="flex flex-col gap-3">
        <span
          className={cn(
            'inline-flex size-10 items-center justify-center rounded-lg',
            'bg-brand-50 text-primary'
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-semibold text-ink-primary">
            {report.label}
          </h2>
          <p className="font-sans text-sm text-ink-muted">{report.description}</p>
        </div>
      </div>

      <Button
        variant="outline"
        disabled={isPending}
        onClick={() =>
          mutate({ reportId: report.id, filename: report.filename })
        }
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Descargando…
          </>
        ) : (
          <>
            <Download />
            Descargar CSV
          </>
        )}
      </Button>
    </Card>
  );
}
