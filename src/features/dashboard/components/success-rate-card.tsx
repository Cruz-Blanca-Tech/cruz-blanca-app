'use client';

import { useMemo } from 'react';
import { Pie, PieChart } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { useSuccessRate } from '../hooks/use-dashboard-queries';
import { ChartCard } from './chart-card';
import { resolveLabel } from '../lib/dashboard-format';

/**
 * Tasa de éxito (GET /operations/success-rate). Dona (Pie con `innerRadius`) que
 * muestra la distribución de casos por estado final del pipeline. Cada segmento
 * usa un token de serie (`--chart-1`..`--chart-5`); la etiqueta legible sale del
 * `legend` del envoltorio (fallback: la clave cruda de `status`).
 */
export function SuccessRateCard() {
  const { data, isLoading, isError } = useSuccessRate();

  return (
    <ChartCard
      data={data}
      isLoading={isLoading}
      isError={isError}
      errorMessage="No se pudo cargar la tasa de éxito."
      emptyMessage="Sin datos de tasa de éxito."
    >
      {(response) => <SuccessRatePie response={response} />}
    </ChartCard>
  );
}

/** Dona con la distribución por estado (separada para consumir la data ya validada). */
function SuccessRatePie({
  response,
}: {
  response: NonNullable<ReturnType<typeof useSuccessRate>['data']>;
}) {
  // Se mapea cada estado a un token de serie y se resuelve su etiqueta legible.
  // El color va en el propio dato (`fill`), que Recharts aplica por segmento.
  const chartData = useMemo(
    () =>
      response.data.map((item, index) => ({
        status: item.status,
        label: resolveLabel(response.legend, item.status),
        count: item.count,
        fill: `var(--chart-${(index % 5) + 1})`,
      })),
    [response]
  );

  // ChartConfig indexado por la etiqueta legible: alimenta el tooltip y la
  // leyenda de shadcn (que buscan la config por `nameKey`).
  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = { count: { label: 'Casos' } };
    for (const item of chartData) {
      config[item.label] = { label: item.label, color: item.fill };
    }
    return config;
  }, [chartData]);

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[260px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="label"
          innerRadius={60}
          strokeWidth={4}
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="label" />}
          className="flex-wrap gap-x-4 gap-y-1 text-ink-secondary"
        />
      </PieChart>
    </ChartContainer>
  );
}
