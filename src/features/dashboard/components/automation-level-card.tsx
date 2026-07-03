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

import { useAutomationLevel } from '../hooks/use-dashboard-queries';
import { ChartCard } from './chart-card';
import { resolveLabel } from './dashboard-format';

/**
 * Nivel de automatización (GET /operations/automation-level). Dona (Pie con
 * `innerRadius`) con la distribución de casos por veredicto de triaje (auto vs
 * manual): mide cuánto trabajo absorbe la automatización. Cada segmento usa un
 * token de serie; la etiqueta legible sale del `legend` (fallback: `verdict`).
 */
export function AutomationLevelCard() {
  const { data, isLoading, isError } = useAutomationLevel();

  return (
    <ChartCard
      data={data}
      isLoading={isLoading}
      isError={isError}
      errorMessage="No se pudo cargar el nivel de automatización."
      emptyMessage="Sin datos de automatización."
    >
      {(response) => <AutomationLevelPie response={response} />}
    </ChartCard>
  );
}

/** Dona con la distribución por veredicto (consume la data ya validada). */
function AutomationLevelPie({
  response,
}: {
  response: NonNullable<ReturnType<typeof useAutomationLevel>['data']>;
}) {
  const chartData = useMemo(
    () =>
      response.data.map((item, index) => ({
        verdict: item.verdict,
        label: resolveLabel(response.legend, item.verdict),
        count: item.count,
        fill: `var(--chart-${(index % 5) + 1})`,
      })),
    [response]
  );

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
