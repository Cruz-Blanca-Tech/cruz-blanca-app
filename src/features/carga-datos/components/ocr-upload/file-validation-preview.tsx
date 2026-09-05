'use client';

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileWarning,
  Trash2,
  Users,
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
                </div>

                {/* Chips de documentos */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  {group.presentCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded bg-success/20 px-1.5 py-0.5 font-mono font-medium text-success-dark text-[10px]"
                    >
                      ✓ {code}
                    </span>
                  ))}
                  {group.missingCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded border border-dashed border-warning/60 bg-warning/10 px-1.5 py-0.5 font-mono text-warning-dark text-[10px]"
                      title={`Falta documento requerido: ${code}`}
                    >
                      ✕ {code}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Advertencia si hay incompletos */}
          {hasIncompleteDossiers && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Atención:</strong> Uno o más expedientes no tienen todos los documentos requeridos. Puedes procesar el lote así, pero los expedientes incompletos requerirán triaje manual y se les deberán anexar los documentos faltantes luego.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
