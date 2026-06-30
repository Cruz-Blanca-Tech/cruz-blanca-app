'use client';

import { Layers, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useBatchesSummary } from '../hooks/use-triaje-queries';
import { batchStatusValues } from '../schemas/batch-status-schema';
import { BATCH_STATUS_CONFIG } from '../lib/batch-status-config';

interface KpiDescriptor {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
}

/**
 * Las 7 KPIs en orden: Total + un card por estado. Reutiliza la config de
 * estados para iconos y color, así un cambio de paleta se propaga solo.
 */
const KPI_DESCRIPTORS: KpiDescriptor[] = [
  {
    key: 'TOTAL',
    label: 'Total de lotes',
    icon: Layers,
    iconClassName: 'bg-brand-200 text-primary',
  },
  ...batchStatusValues.map((status) => {
    const config = BATCH_STATUS_CONFIG[status];
    return {
      key: status,
      label: config.filterLabel,
      icon: config.icon,
      iconClassName: config.kpiIconClassName,
    };
  }),
];

function KpiCard({
  descriptor,
  value,
}: {
  descriptor: KpiDescriptor;
  value: number;
}) {
  const Icon = descriptor.icon;
  return (
    <Card className="flex-row items-center gap-2.5 px-3.5 py-3.5 ring-border">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          descriptor.iconClassName
        )}
      >
        <Icon className="size-[18px]" />
      </div>
      <div>
        <div className="font-heading text-2xl leading-none font-bold text-ink-primary">
          {value}
        </div>
        <div className="mt-1 font-data text-xs text-ink-muted">{descriptor.label}</div>
      </div>
    </Card>
  );
}

const GRID_CLASSNAME =
  'grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7';

/** Fila de 7 KPIs (totales globales informativos), con carga y error. */
export function SummaryCards() {
  const { data, isLoading, isError } = useBatchesSummary();

  if (isLoading) {
    return (
      <div className={GRID_CLASSNAME}>
        {KPI_DESCRIPTORS.map((descriptor) => (
          <Card
            key={descriptor.key}
            className="flex-row items-center gap-2.5 px-3.5 py-3.5 ring-border"
          >
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="items-center px-4 py-5 ring-border">
        <p className="font-sans text-sm text-ink-muted">
          No se pudo cargar el resumen de lotes.
        </p>
      </Card>
    );
  }

  const valueFor = (key: string): number =>
    key === 'TOTAL'
      ? data.total_batches
      : (data.statuses[key as keyof typeof data.statuses] ?? 0);

  return (
    <div className={GRID_CLASSNAME}>
      {KPI_DESCRIPTORS.map((descriptor) => (
        <KpiCard
          key={descriptor.key}
          descriptor={descriptor}
          value={valueFor(descriptor.key)}
        />
      ))}
    </div>
  );
}
