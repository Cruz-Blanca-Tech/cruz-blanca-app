'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useSearchAdult } from '../hooks/use-beneficiarios-queries';

export interface AdultSearchResult {
  id?: string;
  dni: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
  is_emergency_contact?: boolean;
}

interface AdultSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdultFound: (adult: AdultSearchResult) => void;
  onAdultCreateNew: (dni: string) => void;
}

export function AdultSearchModal({ open, onOpenChange, onAdultFound, onAdultCreateNew }: AdultSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Auto-search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isFetching, isError } = useSearchAdult(debouncedSearch);
  const results = (data as AdultSearchResult[]) || [];

  const handleAddExisting = (adult: AdultSearchResult) => {
    onAdultFound({
      id: adult.id,
      dni: adult.dni,
      first_name: adult.first_name || '',
      last_name: adult.last_name || '',
      phone: adult.phone || '',
      role: adult.role || 'OTHER',
    });
    setSearchTerm('');
    setDebouncedSearch('');
    onOpenChange(false);
  };

  const handleCreateNew = () => {
    // If it's mostly numbers, assume it's a DNI, else pass empty to let them type DNI later
    const isMostlyNumeric = /^[\d\s]+$/.test(searchTerm);
    onAdultCreateNew(isMostlyNumeric ? searchTerm.trim() : '');
    setSearchTerm('');
    setDebouncedSearch('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Adulto Relacionado</DialogTitle>
          <DialogDescription>
            Busca en el padrón por DNI o Nombre para vincular un adulto existente, o crea uno nuevo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="search-adult" className="sr-only">
              Buscar
            </Label>
            <Input
              id="search-adult"
              placeholder="Ingrese el DNI o Nombre (ej. 12345678 o Juan)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="button" size="sm" disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="sr-only">Buscar</span>
          </Button>
        </div>

        <div className="min-h-[100px] flex flex-col justify-center border rounded-md mt-4 p-4 bg-muted/20">
          {isFetching && (
            <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
              Buscando en el padrón...
            </div>
          )}

          {(isError || (!isFetching && results.length === 0)) && (
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {debouncedSearch ? "Adulto no encontrado" : "No hay adultos registrados"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {debouncedSearch ? `No hay nadie registrado con: ${debouncedSearch}.` : "Puedes empezar a registrar uno nuevo."}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={handleCreateNew}>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear nuevo adulto
              </Button>
            </div>
          )}

          {!isFetching && !isError && results.length > 0 && (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Padrón</span>
              </div>
              
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {results.map((adult, idx) => (
                  <div key={adult.id || idx} className="flex flex-col space-y-2 p-3 border rounded-md bg-white">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">
                        {adult.first_name} {adult.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DNI: {adult.dni} 
                        {adult.phone && ` • Telf: ${adult.phone}`}
                      </p>
                    </div>
                    <Button type="button" size="sm" onClick={() => handleAddExisting(adult)} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Vincular este adulto
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t">
                 <p className="text-xs text-center text-muted-foreground mb-2">¿No encuentras a quien buscas?</p>
                 <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleCreateNew}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear nuevo adulto
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
