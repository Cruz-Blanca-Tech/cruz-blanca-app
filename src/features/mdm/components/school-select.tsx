'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { useSchools } from '../hooks/use-mdm-queries';

interface SchoolSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Selector de colegio del maestro MDM (solo colegios activos). */
export function SchoolSelect({ value, onChange, disabled, className }: SchoolSelectProps) {
  const { data: schools = [], isLoading } = useSchools();

  const activeSchools = schools.filter((school) => school.is_active);

  return (
    <Select
      value={value || undefined}
      onValueChange={(val) => val && onChange(val)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger
        className={cn(
          'w-full bg-transparent border-transparent shadow-none text-left font-data text-sm',
          className
        )}
      >
        <SelectValue
          placeholder={isLoading ? 'Cargando colegios...' : 'Seleccionar colegio'}
        />
      </SelectTrigger>
      <SelectContent>
        {activeSchools.map((school) => (
          <SelectItem key={school.id} value={school.name}>
            {school.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}