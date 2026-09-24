'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, ClipboardList, Briefcase } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Tipos
interface Program {
  id: string;
  name: string;
}

interface DocumentConfig {
  id: string;
  code: string;
  name: string;
}

interface ActivityRequirement {
  document_type_config_id: string;
  is_required: boolean;
  confidence_threshold: number;
}

interface Activity {
  id: string;
  program_id: string;
  name: string;
  activity_type: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

// Configuración de plantillas de reglas y su vinculación a Programas (por nombre)
const ACTIVITY_TEMPLATES = [
  {
    id: 'EDUCA_INSCRIPTION',
    label: 'Inscripción Educa',
    programs: ['Educa', 'EDUCA', 'educa'], 
    requiredDocCodes: ['FINS', 'DJ', 'DNIAP', 'DNIBE']
  },
  {
    id: 'MEDICAL_CAMPAIGN',
    label: 'Campaña Médica',
    programs: ['En Familia', 'EN FAMILIA', 'Familia'], 
    requiredDocCodes: ['FINS']
  }
];

export default function ActivitiesMdmPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    program_id: '',
    activity_type: '',
    start_date: '',
    end_date: '',
  });

  // Consultas
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['mdm', 'activities'],
    queryFn: async (): Promise<Activity[]> => {
      const { data } = await axios.get('/api/proxy/api/v1/intake/activities');
      return data;
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['mdm', 'programs'],
    queryFn: async (): Promise<Program[]> => {
      const { data } = await axios.get('/api/proxy/api/v1/intake/programs');
      return data;
    },
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['mdm', 'document-catalog'],
    queryFn: async (): Promise<DocumentConfig[]> => {
      const { data } = await axios.get('/api/proxy/api/v1/intake/document-catalog');
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      await axios.post('/api/proxy/api/v1/intake/activities', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mdm', 'activities'] });
      toast.success('Actividad creada exitosamente');
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Ocurrió un error al guardar la actividad');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', program_id: '', activity_type: '', start_date: '', end_date: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.program_id || !formData.activity_type) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    // 1. Obtener la plantilla seleccionada
    const template = ACTIVITY_TEMPLATES.find(t => t.id === formData.activity_type);
    if (!template) return;

    // 2. Mapear los códigos de la plantilla a IDs reales del catálogo
    const requirements: ActivityRequirement[] = [];
    template.requiredDocCodes.forEach(code => {
      const configDoc = catalog.find(c => c.code === code);
      if (configDoc) {
        requirements.push({
          document_type_config_id: configDoc.id,
          is_required: true,
          confidence_threshold: 0.80
        });
      }
    });

    if (requirements.length === 0) {
      toast.error('No se encontraron documentos en el catálogo para esta plantilla.');
      return;
    }

    // 3. Enviar payload
    const payload = {
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      requirements
    };

    saveMutation.mutate(payload);
  };

  // Filtrar templates según el programa seleccionado
  const selectedProgram = programs.find(p => p.id === formData.program_id);
  const availableTemplates = ACTIVITY_TEMPLATES.filter(t => {
    if (!selectedProgram) return true; // Si no hay programa, mostrar todos o ninguno. Mejor todos por ahora.
    return t.programs.some(progName => selectedProgram.name.toLowerCase().includes(progName.toLowerCase()));
  });

  // Para arreglar el error del SelectValue, usamos una key en el Select para forzar re-render cuando las opciones cambian,
  // y nos aseguramos de que el valor exista en las opciones.
  const currentProgramName = selectedProgram?.name || 'Seleccione un programa';
  const currentTemplateName = ACTIVITY_TEMPLATES.find(t => t.id === formData.activity_type)?.label || 'Seleccione la plantilla documental';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="size-6 text-primary" />
            Gestión de Actividades (Períodos y Campañas)
          </h1>
          <p className="text-muted-foreground mt-1">
            Crea los períodos oficiales (ej. Educa 2026-1) para que los lotes de documentos sepan qué procesar.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={(val) => {
          setIsOpen(val);
          if (!val) resetForm();
        }}>
          <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Actividad
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Actividad / Campaña</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              
              <div className="space-y-2">
                <Label>Programa *</Label>
                <Select 
                  value={formData.program_id} 
                  onValueChange={(val) => {
                    setFormData(prev => ({...prev, program_id: val || '', activity_type: ''})); // Resetear trámite al cambiar programa
                  }}
                >
                  <SelectTrigger>
                    <SelectValue>{currentProgramName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Trámite (Plantilla) *</Label>
                <Select 
                  value={formData.activity_type} 
                  onValueChange={(val) => setFormData(prev => ({...prev, activity_type: val || ''}))}
                  disabled={!formData.program_id}
                >
                  <SelectTrigger>
                    <SelectValue>{currentTemplateName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id}>{tpl.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.program_id && <p className="text-xs text-muted-foreground">Selecciona primero un programa para ver sus trámites.</p>}
              </div>

              <div className="space-y-2">
                <Label>Nombre del Período / Evento *</Label>
                <Input 
                  placeholder="Ej. Educa 2026-1" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input 
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({...prev, start_date: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input 
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({...prev, end_date: e.target.value}))}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {saveMutation.isPending ? 'Creando...' : 'Crear Actividad'}
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
              <TableHead>Programa</TableHead>
              <TableHead>Nombre del Período</TableHead>
              <TableHead>Tipo de Trámite</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead className="w-[80px]">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingActivities ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Cargando actividades...
                </TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay actividades registradas. Crea tu primer período.
                </TableCell>
              </TableRow>
            ) : (
              activities.map((act) => {
                const prog = programs.find(p => p.id === act.program_id);
                const tpl = ACTIVITY_TEMPLATES.find(t => t.id === act.activity_type);
                
                return (
                  <TableRow key={act.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-4" />
                        {prog?.name || 'Desconocido'}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-ink-primary">
                      {act.name}
                    </TableCell>
                    <TableCell>
                      {tpl?.label || act.activity_type || 'Custom'}
                    </TableCell>
                    <TableCell>
                      {act.start_date || act.end_date ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Calendar className="size-3.5" /> 
                          {act.start_date || '?'} al {act.end_date || '?'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">Sin fechas</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {act.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          Cerrada
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
