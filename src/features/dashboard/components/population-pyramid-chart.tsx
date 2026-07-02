'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { usePopulationPyramid } from '../hooks/use-dashboard-queries';
import { ChartCard } from './chart-card';

/**
 * Dos series espejo: hombres a la izquierda (token azul marca) y mujeres a la
 * derecha (token celeste). El patrón de pirámide de Recharts v3 usa
 * `layout="vertical"` + `stackOffset="sign"` con una serie NEGATIVA (ver docs).
 */
const chartConfig = {
  male: { label: 'Hombres', color: 'var(--chart-1)' },
  female: { label: 'Mujeres', color: 'var(--chart-5)' },
} satisfies ChartConfig;

/**
 * Pirámide poblacional (GET /demographics/population-pyramid). Barras
 * horizontales divergentes: un grupo etario por fila, hombres hacia un lado y
 * mujeres hacia el otro. Se logra volviendo NEGATIVO el valor de una serie
 * (`male`) y apilando con `stackOffset="sign"`; los ejes/tooltip muestran el
 * valor absoluto para no confundir con conteos negativos.
 */
export function PopulationPyramidChart() {
  const { data, isLoading, isError } = usePopulationPyramid();

  return (
    <ChartCard
      data={data}
      isLoading={isLoading}
      isError={isError}
      errorMessage="No se pudo cargar la pirámide poblacional."
      emptyMessage="Sin datos demográficos."
    >
      {(response) => <PopulationPyramidBars response={response} />}
    </ChartCard>
  );
}

/** Barras divergentes por grupo etario (consume la data ya validada). */
function PopulationPyramidBars({
  response,
}: {
  response: NonNullable<ReturnType<typeof usePopulationPyramid>['data']>;
}) {
  // `male` se vuelve negativo SOLO para el gráfico (dibuja a la izquierda del
  // eje); no se muta la data del hook. El tooltip/eje re-aplican `Math.abs`.
  const chartData = useMemo(
    () =>
      response.data.map((item) => ({
        age_group: item.age_group,
        male: -item.male,
        female: item.female,
      })),
    [response]
  );

  return (
    <ChartContainer config={chartConfig} className="aspect-video w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        stackOffset="sign"
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
          tickFormatter={(value: number) => Math.abs(value).toLocaleString()}
        />
        <YAxis
          type="category"
          dataKey="age_group"
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              // El valor de `male` llega negativo; se muestra en absoluto.
              formatter={(value, name) => (
                <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                  <span className="text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {Math.abs(Number(value)).toLocaleString()}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} className="text-ink-secondary" />
        <Bar dataKey="male" fill="var(--color-male)" stackId="poblacion" radius={[4, 0, 0, 4]} />
        <Bar
          dataKey="female"
          fill="var(--color-female)"
          stackId="poblacion"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
