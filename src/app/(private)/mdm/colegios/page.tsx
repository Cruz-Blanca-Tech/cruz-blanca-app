'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, MapPin, Phone, Building2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Tipos
interface School {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  is_active: boolean;
}

// Fetcher
const fetchSchools = async (): Promise<School[]> => {
  const { data } = await axios.get('/api/proxy/api/v1/mdm/schools');
  return data;
};

export default function SchoolsMdmPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
  });

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['mdm', 'schools'],
    queryFn: fetchSchools,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<School>) => {
      if (editingSchool) {
        await axios.patch(`/api/proxy/api/v1/mdm/schools/${editingSchool.id}`, payload);
      } else {
        await axios.post('/api/proxy/api/v1/mdm/schools', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mdm', 'schools'] });
      toast.success(editingSchool ? 'Colegio actualizado' : 'Colegio creado');
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Ocurrió un error al guardar el colegio');
    },
  });

  const resetForm = () => {
    setEditingSchool(null);
    setFormData({ name: '', location: '', phone: '' });
  };

  const openEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      location: school.location || '',
      phone: school.phone || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="size-6 text-brand-blue" />
            Gestión de Colegios (MDM)
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra el maestro de colegios para mantener la base de datos unificada.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={(val) => {
          setIsOpen(val);
          if (!val) resetForm();
        }}>
          <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Colegio
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSchool ? 'Editar Colegio' : 'Crear Nuevo Colegio'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre del Colegio *</Label>
                <Input 
                  placeholder="Ej. I.E. San José" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección / Ubicación</Label>
                <Input 
                  placeholder="Ej. Av. Principal 123" 
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono de contacto</Label>
                <Input 
                  placeholder="Ej. 01 555-1234" 
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="bg-primary">
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar Colegio'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nombre del Colegio</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Cargando colegios...
                </TableCell>
              </TableRow>
            ) : schools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No hay colegios registrados.
                </TableCell>
              </TableRow>
            ) : (
              schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium text-ink-primary">
                    {school.name}
                  </TableCell>
                  <TableCell>
                    {school.location ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="size-3.5" /> {school.location}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {school.phone ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="size-3.5" /> {school.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(school)}>
                      <Edit2 className="size-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
