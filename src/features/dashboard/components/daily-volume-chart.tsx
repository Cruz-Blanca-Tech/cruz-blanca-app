'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { useDailyVolume } from '../hooks/use-dashboard-queries';
import { ChartCard } from './chart-card';
import { formatDay } from '../lib/dashboard-format';

/** Serie única (total de casos) mapeada al primer token de marca (`--chart-1`). */
const chartConfig = {
  total_cases: { label: 'Casos', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/**
 * Volumen diario de casos (GET /operations/daily-volume). Gráfico principal de
 * barras verticales: eje X = día (formateado a `DD mmm` solo en presentación),
 * eje Y = total de casos. Ocupa el ancho completo del grid.
 */
export function DailyVolumeChart() {
  const { data, isLoading, isError } = useDailyVolume();

  return (
    <ChartCard
      data={data}
      isLoading={isLoading}
      isError={isError}
      errorMessage="No se pudo cargar el volumen diario."
      emptyMessage="Sin datos para el período."
      className="md:col-span-2"
    >
      {(response) => <DailyVolumeBars response={response} />}
    </ChartCard>
  );
}

/** Barras verticales del volumen diario (consume la data ya validada). */
function DailyVolumeBars({
  response,
}: {
  response: NonNullable<ReturnType<typeof useDailyVolume>['data']>;
}) {
  // Se añade `label` (día formateado) sin mutar la data del hook.
  const chartData = useMemo(
    () =>
      response.data.map((item) => ({
        ...item,
        label: formatDay(item.day),
      })),
    [response]
  );

  return (
    <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="total_cases" fill="var(--color-total_cases)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
