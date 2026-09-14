'use client';

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileWarning,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BatchValidationResult, ValidatedFileItem } from '../../hooks/use-batch-file-validation';

interface FileValidationPreviewProps {
  validation: BatchValidationResult;
  onRemoveFile: (sourceId: string) => void;
  onDiscardInvalid: () => void;
  disabled?: boolean;
}

export function FileValidationPreview({
  validation,
  onRemoveFile,
  onDiscardInvalid,
  disabled = false,
}: FileValidationPreviewProps) {
  const {
    invalidFiles,
    dossierGroups,
    hasInvalidFiles,
    hasIncompleteDossiers,
    completeDossierCount,
    dossierCount,
  } = validation;

  if (validation.totalFiles === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. SECCIÓN DE ARCHIVOS INVÁLIDOS */}
      {hasInvalidFiles && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <FileWarning className="size-4.5" />
              <span>
                {invalidFiles.length} archivo{invalidFiles.length > 1 ? 's' : ''} no válido{invalidFiles.length > 1 ? 's' : ''}
              </span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDiscardInvalid}
              disabled={disabled}
              className="h-7 text-xs"
            >
              <Trash2 className="mr-1 size-3.5" />
              Descartar no válidos ({invalidFiles.length})
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pb-3">
            Estos archivos tienen errores en su formato o código y no podrán ser procesados. Puedes descartarlos para continuar.
          </p>

          <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {invalidFiles.map((item: ValidatedFileItem) => (
              <li
                key={item.file.source_id}
                className="flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-card px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-mono font-medium text-foreground truncate block">
                    {item.file.file_name}
                  </span>
                  <span className="text-destructive font-data text-[11px]">
                    {item.errorReason}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFile(item.file.source_id)}
                  disabled={disabled}
                  title="Quitar este archivo"
                  className="size-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. SECCIÓN DE EXPEDIENTES POR DNI */}
      {dossierGroups.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="size-4.5 text-primary" />
              <span>
                Expedientes agrupados por DNI ({dossierCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={hasIncompleteDossiers ? 'outline' : 'default'}
                className={
                  hasIncompleteDossiers
                    ? 'border-warning/50 text-warning-dark'
                    : 'bg-success text-white'
                }
              >
                {completeDossierCount} de {dossierCount} completos
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {dossierGroups.map((group) => (
              <div
                key={group.dni}
                className={`rounded-md border p-3 flex flex-col gap-2 ${
                  group.isComplete
                    ? 'border-success/30 bg-success/5'
                    : 'border-warning/30 bg-warning/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
                    <FileText className="size-3.5 text-muted-foreground" />
                    DNI: {group.dni}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        group.isComplete
                          ? 'border-success text-success-dark bg-success-light'
                          : 'border-warning text-warning-dark bg-warning-light'
                      }`}
                    >
                      {group.isComplete ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Completo ({group.totalPresent}/{group.totalRequired})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          Incompleto ({group.totalPresent}/{group.totalRequired})
                        </span>
                      )}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Quitar este expediente completo del lote"
                      disabled={disabled}
                      onClick={() => {
                        group.files.forEach(f => onRemoveFile(f.file.source_id));
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Chips de documentos */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  {group.presentCodes.map((code) => {
                    const fileItem = group.files.find(f => f.code === code);
                    return (
                      <span
                        key={code}
                        className="group flex items-center gap-1 rounded bg-success/20 pl-1.5 pr-1 py-0.5 font-mono font-medium text-success-dark text-[10px]"
                      >
                        ✓ {code}
                        {fileItem && (
                          <button
                            type="button"
                            onClick={() => onRemoveFile(fileItem.file.source_id)}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-success/30 hover:text-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                            title="Quitar este documento para subir otro"
                            disabled={disabled}
                          >
                            <Trash2 className="size-2.5" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                  {group.missingCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded border border-dashed border-destructive/60 bg-destructive/10 px-1.5 py-0.5 font-mono text-destructive-dark text-[10px]"
                      title={`Falta documento requerido: ${code}`}
                    >
                      ✗ {code}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Error estricto si hay incompletos */}
          {hasIncompleteDossiers && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-destructive" />
              <span>
                <strong>Bloqueo de seguridad:</strong> Tienes expedientes incompletos. Por favor, sube los documentos que faltan en rojo (✗) o elimina el DNI completo desde Google Drive Picker para poder continuar. El proceso no avanzará hasta que todos los expedientes estén completos.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
