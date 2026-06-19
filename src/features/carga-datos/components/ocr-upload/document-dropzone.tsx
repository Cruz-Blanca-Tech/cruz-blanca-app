'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface DocumentDropzoneProps {
  file: File | null;
  onFile: (file: File) => void;
  onRemove: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validate(file: File): string | null {
  const isMimeOk = ACCEPTED_MIME.includes(file.type);
  const isExtOk = ACCEPTED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );
  if (!isMimeOk && !isExtOk) {
    return 'Formato no permitido. Usa JPG, PNG o PDF.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'El archivo supera el tamaño máximo de 10 MB.';
  }
  return null;
}

export function DocumentDropzone({ file, onFile, onRemove }: DocumentDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vista previa de imágenes: se crea el object URL de forma derivada y se
  // libera en un effect cuando cambia el archivo o se desmonta el componente.
  const previewUrl = useMemo(
    () =>
      file && file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null,
    [file]
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFiles = (files: FileList | null) => {
    const next = files?.[0];
    if (!next) return;
    const validationError = validate(next);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onFile(next);
  };

  if (file) {
    const isImage = file.type.startsWith('image/');
    const ext = (file.name.split('.').pop() ?? '').toUpperCase();

    return (
      <div className="flex items-center gap-3.5 rounded-lg border border-success bg-success-light px-5 py-4">
        <div className="flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
          {isImage && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa de object URL local
            <img
              src={previewUrl}
              alt={`Vista previa de ${file.name}`}
              className="size-full object-cover"
            />
          ) : ext === 'PDF' ? (
            <FileText className="size-6 text-success-dark" />
          ) : (
            <ImageIcon className="size-6 text-success-dark" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {file.name}
          </p>
          <p className="mt-0.5 font-data text-xs text-muted-foreground">
            {ext} · {formatSize(file.size)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-success-dark">
          <CheckCircle2 className="size-4" />
          <span className="font-data text-xs">Listo</span>
        </div>

        <button
          type="button"
          onClick={onRemove}
          title="Eliminar archivo"
          aria-label="Eliminar archivo"
          className="flex items-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-error-light hover:text-error"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50',
          dragging
            ? 'border-primary bg-accent'
            : 'border-slate-300 bg-slate-50 hover:border-primary/60'
        )}
      >
        <div
          className={cn(
            'flex size-13 items-center justify-center rounded-xl transition-colors',
            dragging ? 'bg-brand-300 text-primary' : 'bg-slate-100 text-slate-400'
          )}
        >
          <UploadCloud className="size-6" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">
            Arrastra tu ficha escaneada o{' '}
            <span className="text-primary underline">
              haz clic para seleccionar
            </span>
          </p>
          <p className="mt-1.5 font-data text-xs text-muted-foreground">
            Formatos aceptados: <strong>JPG, PNG, PDF</strong> · Tamaño máximo:{' '}
            <strong>10 MB</strong>
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
