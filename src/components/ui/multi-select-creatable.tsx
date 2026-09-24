'use client';

import React from 'react';
import CreatableSelect from 'react-select/creatable';
import { useTheme } from 'next-themes';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectCreatableProps {
  placeholder?: string;
  options?: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  noOptionsMessage?: string;
}

import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

import { useId } from 'react';

export function MultiSelectCreatable({
  placeholder = 'Seleccione o escriba...',
  options = [],
  value,
  onChange,
  noOptionsMessage = 'No hay opciones',
}: MultiSelectCreatableProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const instanceId = useId();

  const handleChange = (newValue: readonly Option[]) => {
    onChange(newValue ? newValue.map((v) => v.value) : []);
  };

  const removeValue = (valToRemove: string) => {
    onChange(value.filter((v) => v !== valToRemove));
  };

  return (
    <div className="space-y-3">
      {/* Selected Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 border rounded-md">
          {value.map((val) => (
            <Badge key={val} variant="secondary" className="flex items-center gap-1.5 px-3 py-1 text-sm bg-background border shadow-sm">
              <span className="font-medium text-foreground">{val}</span>
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="ml-1 rounded-full outline-none hover:bg-destructive hover:text-destructive-foreground transition-colors p-0.5"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Quitar {val}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Control */}
      <CreatableSelect
        instanceId={instanceId}
        isMulti
        controlShouldRenderValue={false} // Don't render tags inside the input
        placeholder={placeholder}
        options={options as any}
        value={[]} // Always empty so it doesn't show selected items inside
        onChange={(newValue: any, actionMeta: any) => {
          if (actionMeta.action === 'select-option' || actionMeta.action === 'create-option') {
            const addedValues = newValue.map((v: any) => v.value);
            const newUniqueValues = addedValues.filter((v: any) => !value.includes(v));
            if (newUniqueValues.length > 0) {
              onChange([...value, ...newUniqueValues]);
            }
          }
        }}
        noOptionsMessage={() => noOptionsMessage}
        formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: isDark ? 'hsl(var(--background))' : 'white',
            borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--input))',
            boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
            borderRadius: 'calc(var(--radius) - 2px)',
            '&:hover': {
              borderColor: 'hsl(var(--ring))',
            },
            padding: '2px',
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: isDark ? 'hsl(var(--popover))' : 'white',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'calc(var(--radius) - 2px)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            zIndex: 50,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused
              ? isDark
                ? 'hsl(var(--accent))'
                : 'hsl(var(--accent))'
              : 'transparent',
            color: isDark ? 'hsl(var(--popover-foreground))' : 'hsl(var(--popover-foreground))',
            cursor: 'pointer',
            '&:active': {
              backgroundColor: 'hsl(var(--accent))',
            },
          }),
          input: (base) => ({
            ...base,
            color: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
          }),
        }}
      />
    </div>
  );
}
