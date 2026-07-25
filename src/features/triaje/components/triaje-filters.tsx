'use client';

import { useShallow } from 'zustand/react/shallow';
import { Activity, Folder, Tag, X, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { usePrograms, useActivities } from '@/shared/hooks/use-intake-queries';
import { useBatchStatuses } from '../hooks/use-triaje-queries';
import { batchStatusSchema } from '../schemas/batch-status-schema';
import { BATCH_STATUS_CONFIG } from '../lib/batch-status-config';
import {
  hasActiveFilters,
  useTriajeFiltersStore,
} from '../stores/triaje-filters-store';

/** Valor sentinela de la opción "Todos" (los ids reales nunca colisionan). */
const ALL_VALUE = '__all__';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  icon: LucideIcon;
  /** `null` = sin filtro (se muestra la opción "Todos"). */
  value: string | null;
  onChange: (value: string | null) => void;
  allLabel: string;
  options: FilterOption[];
  placeholder: string;
  disabled?: boolean;
}

function FilterSelect({
  icon: Icon,
  value,
  onChange,
  allLabel,
  options,
  placeholder,
  disabled,
}: FilterSelectProps) {
  const items = [{ value: ALL_VALUE, label: allLabel }, ...options];
  const isDefault = value === null;

  return (
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}
      items={items}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          'h-10 min-w-[170px] flex-1 gap-2 data-[placeholder]:text-ink-muted',
          !isDefault && 'border-primary bg-brand-50 text-brand-dark'
        )}
      >
        <Icon className={isDefault ? 'text-ink-muted' : 'text-primary'} />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Filtros del lado del servidor: Programa, Actividad (dependiente) y Estado. */
export function TriajeFilters() {
  const { programId, activityId, status, setProgramId, setActivityId, setStatus, clear } =
    useTriajeFiltersStore(
      useShallow((s) => ({
        programId: s.programId,
        activityId: s.activityId,
        status: s.status,
        setProgramId: s.setProgramId,
        setActivityId: s.setActivityId,
        setStatus: s.setStatus,
        clear: s.clear,
      }))
    );
  const showClear = useTriajeFiltersStore(hasActiveFilters);

  const programs = usePrograms();
  const activities = useActivities(programId, Boolean(programId));
  const statuses = useBatchStatuses();

  const programOptions: FilterOption[] =
    programs.data?.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const activityOptions: FilterOption[] =
    activities.data?.map((a) => ({ value: a.id, label: a.name })) ?? [];
  const statusOptions: FilterOption[] = [
    { value: 'PENDING,PROCESSING', label: 'En proceso' },
    { value: 'COMPLETED', label: 'Por revisar' },
    { value: 'FINALIZED,REJECTED,FAILED', label: 'Finalizado' },
  ];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2.5">
      <FilterSelect
        icon={Tag}
        value={programId}
        onChange={setProgramId}
        allLabel="Todos los programas"
        options={programOptions}
        placeholder={programs.isLoading ? 'Cargando programas…' : 'Todos los programas'}
        disabled={programs.isLoading || programs.isError}
      />
      <FilterSelect
        icon={Folder}
        value={activityId}
        onChange={setActivityId}
        allLabel="Todas las actividades"
        options={activityOptions}
        placeholder={
          !programId
            ? 'Todas las actividades'
            : activities.isLoading
              ? 'Cargando actividades…'
              : 'Todas las actividades'
        }
        disabled={!programId || activities.isLoading}
      />
      <FilterSelect
        icon={Activity}
        value={status}
        onChange={(next) =>
          setStatus(next === null ? null : next)
        }
        allLabel="Todos los estados"
        options={statusOptions}
        placeholder="Todos los estados"
        disabled={statuses.isLoading || statuses.isError}
      />
      {showClear && (
        <Button
          variant="outline"
          size="lg"
          onClick={clear}
          className="h-10 text-ink-secondary"
        >
          <X />
          Limpiar
        </Button>
      )}
    </div>
  );
}
