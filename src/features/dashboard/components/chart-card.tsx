'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { DashboardResponse } from '../schemas/dashboard-response-schema';

/**
 * Shell común de las tarjetas de gráfico del dashboard. Centraliza los TRES
 * estados que cada métrica debe manejar (mismo patrón que
 * `triaje/components/summary-cards.tsx`), para no repetir la lógica en las 5
 * tarjetas:
 *
 * - `isLoading` → `Skeleton` dentro del `Card` con la forma aproximada del
 *   gráfico (encabezado + área del gráfico).
 * - `isError || !data` → `Card` con un mensaje muted en español (`errorMessage`).
 * - `data.data.length === 0` → `Card` con el mensaje de vacío (`emptyMessage`).
 * - éxito → encabezado tomado del envoltorio (`data.title` / `data.description`)
 *   y el gráfico renderizado vía render-prop `children(data)`, que recibe la
 *   respuesta ya validada (no `undefined`) para tipar el acceso a `data.data`.
 *
 * Es genérico en `T` (el `data item` de la métrica), así el `children` recibe la
 * `DashboardResponse<T>` concreta con tipado completo.
 */
interface ChartCardProps<T> {
  /** Respuesta del hook (puede venir `undefined` mientras carga o si falla). */
  data: DashboardResponse<T> | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Mensaje cuando la petición falla o no hay data. */
  errorMessage: string;
  /** Mensaje cuando la serie llega vacía (`data.data.length === 0`). */
  emptyMessage: string;
  /** Clases extra para el `Card` (p. ej. `md:col-span-2` para ancho completo). */
  className?: string;
  /** Render del gráfico; recibe la respuesta validada. */
  children: (data: DashboardResponse<T>) => ReactNode;
}

export function ChartCard<T>({
  data,
  isLoading,
  isError,
  errorMessage,
  emptyMessage,
  className,
  children,
}: ChartCardProps<T>) {
  if (isLoading) {
    return (
      <Card className={cn('gap-4 ring-border', className)}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-1 h-3.5 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-video w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card
        className={cn('items-center justify-center px-4 py-8 ring-border', className)}
      >
        <p className="font-sans text-sm text-ink-muted">{errorMessage}</p>
      </Card>
    );
  }

  if (data.data.length === 0) {
    return (
      <Card className={cn('gap-4 ring-border', className)}>
        <CardHeader>
          <CardTitle className="text-ink-primary">{data.title}</CardTitle>
          <CardDescription className="text-ink-secondary">
            {data.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="font-sans text-sm text-ink-muted">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('gap-4 ring-border', className)}>
      <CardHeader>
        <CardTitle className="text-ink-primary">{data.title}</CardTitle>
        <CardDescription className="text-ink-secondary">
          {data.description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children(data)}</CardContent>
    </Card>
  );
}
