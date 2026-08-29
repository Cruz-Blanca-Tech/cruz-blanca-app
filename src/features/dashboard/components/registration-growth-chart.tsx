'use client';

import { useId, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { useRegistrationGrowth } from '../hooks/use-dashboard-queries';
import { ChartCard } from './chart-card';
import { formatMonth } from '../lib/dashboard-format';

/** Serie única (altas por mes) mapeada al token verde (`--chart-2`), tendencia positiva. */
const chartConfig = {
  new_beneficiaries: { label: 'Nuevos beneficiarios', color: 'var(--chart-2)' },
} satisfies ChartConfig;

/**
 * Crecimiento de registros (GET /demographics/registration-growth). Gráfico de
 * área que muestra la tendencia de altas de beneficiarios nuevos por mes: eje X =
 * mes (formateado a `mmm AA` solo en presentación), eje Y = altas del mes.
 */
export function RegistrationGrowthChart() {
  const { data, isLoading, isError } = useRegistrationGrowth();

  return (
    <ChartCard
      data={data}
      isLoading={isLoading}
      isError={isError}
      errorMessage="No se pudo cargar el crecimiento de registros."
      emptyMessage="Sin datos de crecimiento."
    >
      {(response) => <RegistrationGrowthArea response={response} />}
    </ChartCard>
  );
}

/** Área del crecimiento mensual (consume la data ya validada). */
function RegistrationGrowthArea({
  response,
}: {
  response: NonNullable<ReturnType<typeof useRegistrationGrowth>['data']>;
}) {
  // `useId` da un id único y estable para el degradado (evita colisiones si hay
  // varias instancias del gráfico en la misma página).
  const gradientId = useId();

  // Se añade `label` (mes formateado) sin mutar la data del hook.
  const chartData = useMemo(
    () =>
      response.data.map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [response]
  );

  return (
    <ChartContainer config={chartConfig} className="aspect-video w-full">
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-new_beneficiaries)"
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor="var(--color-new_beneficiaries)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
        />
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="new_beneficiaries"
          stroke="var(--color-new_beneficiaries)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ChartContainer>
  );
}
