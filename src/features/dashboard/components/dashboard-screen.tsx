'use client';

import { SuccessRateCard } from './success-rate-card';
import { AutomationLevelCard } from './automation-level-card';
import { DailyVolumeChart } from './daily-volume-chart';
import { RegistrationGrowthChart } from './registration-growth-chart';
import { PopulationPyramidChart } from './population-pyramid-chart';

/**
 * Orquestador del dashboard de analítica (ruta /dashboard). Dispone las 5
 * métricas en un grid responsive (1 columna en móvil, 2 en desktop):
 *
 * - Fila superior (compactas): tasa de éxito + nivel de automatización.
 * - Ancho completo: volumen diario (gráfico principal).
 * - Fila inferior: crecimiento de registros + pirámide poblacional.
 *
 * Cada tarjeta es autónoma: consume su propio hook y maneja sus estados de
 * carga/error/vacío, así que la pantalla solo se ocupa del layout.
 */
export function DashboardScreen() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary">
          Dashboard
        </h1>
        <p className="mt-0.5 font-sans text-sm text-ink-muted">
          Indicadores de operación y demografía de los beneficiarios.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SuccessRateCard />
        <AutomationLevelCard />
        <DailyVolumeChart />
        <RegistrationGrowthChart />
        <PopulationPyramidChart />
      </div>
    </div>
  );
}
