'use client';

import { ReportCard } from './report-card';
import { REPORTS_CATALOG } from '../lib/reports-catalog';

/**
 * Pantalla de Reportes (ruta /reportes). Encabezado coherente con el resto de la
 * app (mismo patrón que `DashboardScreen`) + grilla responsive con una
 * `ReportCard` por reporte del catálogo. Cada tarjeta es autónoma: gestiona su
 * propia descarga y feedback, así que la pantalla solo se ocupa del layout.
 */
export function ReportesScreen() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary">
          Reportes
        </h1>
        <p className="mt-0.5 font-sans text-sm text-ink-muted">
          Exporta en CSV los datos consolidados de operación y demografía.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS_CATALOG.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
