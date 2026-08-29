'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Control segmentado Sí/No (con opción "sin definir" para booleanos nullable). */
export function BoolToggle({
  value,
  nullable,
  onChange,
}: {
  value: boolean | null;
  nullable: boolean;
  onChange: (v: boolean | null) => void;
}) {
  const options: { v: boolean; label: string; active: string }[] = [
    { v: true, label: 'Sí', active: 'border-success bg-success text-white' },
    { v: false, label: 'No', active: 'border-error bg-error text-white' },
  ];
  return (
    <div className="flex gap-1.5">
      {options.map((o) => {
        const selected = value === o.v;
        return (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => onChange(selected && nullable ? null : o.v)}
            className={cn(
              'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border font-sans text-sm font-semibold transition-colors',
              selected
                ? o.active
                : 'border-border bg-white text-ink-secondary hover:bg-muted'
            )}
          >
            {selected && (o.v ? <Check className="size-3.5" /> : <X className="size-3.5" />)}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
