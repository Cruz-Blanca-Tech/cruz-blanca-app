'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

/** Multi-select con opciones fijas + valores libres ("Otros"). */
export function MultiSelect({
  options,
  value,
  onChange,
  otrosLabel = 'Otros',
  freeform = false,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  otrosLabel?: string;
  freeform?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [showInput, setShowInput] = useState(false);

  const norm = (v: string) => v.toLowerCase().replace(/[.\s]/g, '');
  const optNorms = options.map(norm);
  const custom = value.filter((v) => !optNorms.includes(norm(v)));
  const isSelected = (opt: string) => value.some((v) => norm(v) === norm(opt));

  const toggle = (opt: string) =>
    onChange(
      isSelected(opt)
        ? value.filter((v) => norm(v) !== norm(opt))
        : [...value, opt]
    );
  const addCustom = () => {
    const t = draft.trim();
    if (t && !value.some((v) => norm(v) === norm(t))) onChange([...value, t]);
    setDraft('');
  };
  const removeCustom = (c: string) => onChange(value.filter((v) => v !== c));

  return (
    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = isSelected(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-sans text-xs font-medium transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-white text-ink-secondary hover:bg-muted'
              )}
            >
              {selected && <Check className="size-3" />}
              {opt}
            </button>
          );
        })}
        {custom.map((c) => (
          <span
            key={c}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border py-1 pr-1.5 pl-2.5 font-sans text-xs font-medium',
              freeform
                ? 'border-primary bg-brand-100 text-brand-dark'
                : 'border-program-familia bg-program-familia-light text-program-familia-dark'
            )}
          >
            {c}
            <button
              type="button"
              onClick={() => removeCustom(c)}
              className="inline-flex"
              aria-label={`Quitar ${c}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setShowInput((s) => !s)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 font-sans text-xs font-medium transition-colors',
            showInput
              ? 'border-primary text-primary'
              : 'border-border text-ink-muted hover:text-primary'
          )}
        >
          <Plus className="size-3" />
          {otrosLabel}
        </button>
      </div>
      {showInput && (
        <div className="flex gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Especificar y presionar Enter…"
            className="h-8 font-data text-[12.5px]"
            autoFocus
          />
          <button
            type="button"
            onClick={addCustom}
            className="shrink-0 rounded-md bg-primary px-3 font-sans text-[12.5px] font-medium text-primary-foreground"
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}
