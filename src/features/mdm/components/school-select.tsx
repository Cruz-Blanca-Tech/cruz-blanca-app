'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface School {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  is_active: boolean;
}

const fetchSchools = async (): Promise<School[]> => {
  const { data } = await axios.get('/api/proxy/api/v1/mdm/schools');
  return data.filter((s: School) => s.is_active);
};

interface SchoolSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SchoolSelect({ value, onChange, disabled, className }: SchoolSelectProps) {
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['mdm', 'schools'],
    queryFn: fetchSchools,
  });

  return (
    <Select value={value || undefined} onValueChange={(val) => val && onChange(val)} disabled={disabled || isLoading}>
      <SelectTrigger 
        className={cn("w-full bg-transparent border-transparent shadow-none text-left font-data text-sm", className)}
      >
        <SelectValue placeholder={isLoading ? 'Cargando colegios...' : 'Seleccionar colegio'} />
      </SelectTrigger>
      <SelectContent>
        {schools.map(school => (
          <SelectItem key={school.id} value={school.name}>
            {school.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
