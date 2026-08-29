'use client';

import Image from 'next/image';
import { Controller, useWatch, type Control } from 'react-hook-form';
import { ImageOff, ZoomIn } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import type { CreateActivityFormValues } from '../../schemas/create-activity-schema';
import type { DocumentType } from '../../schemas/document-catalog-schema';

/** Color del valor del umbral según severidad (igual que el diseño de referencia). */
function thresholdColor(pct: number): string {
  if (pct >= 90) return 'text-success-dark';
  if (pct >= 75) return 'text-info-dark';
  return 'text-warning-dark';
}

interface DocumentRowProps {
  index: number;
  name: string;
  catalog?: DocumentType;
  control: Control<CreateActivityFormValues>;
  thresholdError?: string;
  onZoom: () => void;
}

/**
 * Fila de un documento del catálogo en el formulario de crear actividad:
 * checkbox de inclusión + miniatura (con zoom) y, si está seleccionado, el
 * slider del umbral de confianza.
 */
export function DocumentRow({
  index,
  name,
  catalog,
  control,
  thresholdError,
  onZoom,
}: DocumentRowProps) {
  const selected = useWatch({ control, name: `documents.${index}.selected` });
  const previewImageUrl = catalog?.preview_image_url ?? null;
  const code = catalog?.code ?? '—';

  return (
    <li
      className={cn(
        'rounded-lg border transition-colors',
        selected ? 'border-primary bg-brand-50' : 'border-border bg-card'
      )}
    >
      <Controller
        control={control}
        name={`documents.${index}.selected`}
        render={({ field }) => (
          <div
            role="button"
            tabIndex={0}
            onClick={() => field.onChange(!field.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                field.onChange(!field.value);
              }
            }}
            className="flex cursor-pointer items-center gap-3 p-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-lg"
          >
            <Checkbox
              checked={field.value}
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none"
            />

            <button
              type="button"
              title="Ampliar"
              aria-label={`Ampliar ejemplo de ${name}`}
              onClick={(e) => {
                e.stopPropagation();
                onZoom();
              }}
              className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-slate-100"
            >
              {previewImageUrl ? (
                <Image
                  src={previewImageUrl}
                  alt={name}
                  fill
                  sizes="36px"
                  className="object-cover object-top"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-slate-400">
                  <ImageOff className="size-4" />
                </span>
              )}
              <span className="absolute right-0.5 bottom-0.5 flex rounded-sm border border-border bg-overlay-white82 p-0.5 text-primary">
                <ZoomIn className="size-2.5" />
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {name}
                </span>
                <code
                  title={code}
                  className="max-w-full truncate rounded-sm bg-warning-light px-1.5 py-0.5 font-data text-[10px] font-semibold text-warning-dark"
                >
                  {code}
                </code>
              </div>
              {catalog?.year !== undefined && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-data text-[11px] text-muted-foreground">
                    Año
                  </span>
                  <span className="rounded-sm border border-border bg-slate-100 px-2 py-0.5 font-data text-xs text-ink-secondary">
                    {catalog.year}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      />

      {selected && (
        <div className="border-t border-border px-2.5 py-2.5">
          <Controller
            control={control}
            name={`documents.${index}.confidence_threshold`}
            render={({ field }) => {
              const pct = Math.round((field.value ?? 0) * 100);
              return (
                <div className="flex items-center gap-3.5">
                  <span className="font-data text-xs whitespace-nowrap text-ink-secondary">
                    Umbral de confianza
                  </span>
                  <Slider
                    value={[pct]}
                    min={50}
                    max={99}
                    step={1}
                    onValueChange={(value) =>
                      field.onChange(
                        (Array.isArray(value) ? value[0] : value) / 100
                      )
                    }
                    aria-label={`Umbral de confianza para ${name}`}
                    className="flex-1"
                  />
                  <span
                    className={cn(
                      'w-12 text-right font-data text-sm font-semibold',
                      thresholdColor(pct)
                    )}
                  >
                    {pct}%
                  </span>
                </div>
              );
            }}
          />
          {thresholdError && (
            <p className="mt-1.5 text-[11px] text-destructive">
              {thresholdError}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
