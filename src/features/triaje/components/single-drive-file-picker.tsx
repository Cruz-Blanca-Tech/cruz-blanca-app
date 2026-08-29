'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  FileSearch,
  FolderOpen,
  Loader2,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { DriveFile, DriveBreadcrumb, PickedFile } from '@/shared/drive/types';
import { ROOT_NODES, listDriveContent } from '@/shared/drive/drive-api';
import { getDriveFileIcon } from '@/shared/drive/drive-file-icon';
import { CONFIG_ERROR, acquireDriveToken } from '@/shared/drive/drive-auth';

// ── Componente de subpicker (Modal interno) ─────────────────────────────────
export function SingleDrivePickerModal({
  isOpen,
  onClose,
  token,
  onPick,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onPick: (file: PickedFile) => void;
}) {
  const [history, setHistory] = useState<DriveBreadcrumb[]>([{ id: 'app_root', name: 'Google Drive' }]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentFolder = history[history.length - 1];

  const fetchContent = useCallback(async (folderId: string, search = '') => {
    if (!token) return;
    if (folderId === 'app_root') { setFiles(ROOT_NODES); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      setFiles(await listDriveContent(token, folderId, search));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Reset al abrir el modal
  const prevIsOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setHistory([{ id: 'app_root', name: 'Google Drive' }]);
      setFiles(ROOT_NODES);
      setSearchQuery('');
      setError(null);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  // Fetch al cambiar carpeta, búsqueda o al abrir
  useEffect(() => {
    if (!isOpen || !token) return;
    const timer = setTimeout(() => {
      fetchContent(currentFolder.id, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, token, currentFolder.id, searchQuery, fetchContent]);

  const openFolder = (folder: DriveFile) => {
    setSearchQuery('');
    setHistory((prev) => {
      if (prev[prev.length - 1].id === folder.id) return prev;
      return [...prev, { id: folder.id, name: folder.name }];
    });
  };

  const goToCrumb = (index: number) => {
    if (index === history.length - 1) return;
    setSearchQuery('');
    setHistory((prev) => prev.slice(0, index + 1));
  };

  const pickFile = (file: DriveFile) => {
    onPick({ source_id: file.id, file_name: file.name });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl flex flex-col h-[80vh] p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-slate-50/50">
          <DialogTitle className="text-base font-semibold">Seleccionar archivo de Google Drive</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Haz clic en un archivo para seleccionarlo.</p>

          {/* Buscador */}
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en esta carpeta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white h-9 text-sm"
              disabled={currentFolder.id === 'app_root'}
            />
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
            {history.map((crumb, i) => {
              const isLast = i === history.length - 1;
              return (
                <div key={crumb.id} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => goToCrumb(i)}
                    disabled={isLast || loading}
                    className={cn(
                      'rounded px-1.5 py-0.5 transition-colors',
                      isLast ? 'font-semibold text-foreground bg-slate-200/50' : 'hover:bg-slate-100 hover:text-foreground'
                    )}
                  >
                    {crumb.name}
                  </button>
                  {!isLast && <ChevronRight className="size-3 opacity-40" />}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-slate-50/20">
          {error && (
            <div className="m-4 p-3 rounded-md bg-destructive/10 text-destructive flex items-center gap-2 text-sm">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-1.5 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : files.length === 0 && !error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <FileSearch className="size-10 opacity-20" />
              <p className="text-sm">No se encontraron archivos.</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <ul className="flex flex-col gap-0.5 p-3">
                {files.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const isSelectable = file.id !== 'root' && file.id !== 'shared_drives_root';
                  return (
                    <li key={file.id}>
                      <button
                        type="button"
                        onClick={() => {
                          // Las carpetas SIEMPRE son navegables (incluyendo "Mi Unidad" y
                          // "Unidades Compartidas" cuyo id está excluido de isSelectable).
                          // Solo los archivos requieren isSelectable para poder elegirse.
                          if (isFolder) openFolder(file);
                          else if (isSelectable) pickFile(file);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group',
                          isFolder
                            ? 'hover:bg-slate-100 text-foreground'
                            : 'hover:bg-primary/5 hover:text-primary-dark text-foreground'
                        )}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm group-hover:border-slate-300 transition-colors">
                          {getDriveFileIcon(file.mimeType, file.isSharedDrive)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
                        {isFolder && <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Componente público ──────────────────────────────────────────────────────
interface SingleDriveFilePickerProps {
  onPick: (file: PickedFile) => void;
  disabled?: boolean;
}

/**
 * Botón que abre un modal de Google Drive con selección ÚNICA.
 * Al hacer clic en un archivo (no carpeta), lo devuelve instantáneamente y cierra el modal.
 */
export function SingleDriveFilePicker({ onPick, disabled = false }: SingleDriveFilePickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(CONFIG_ERROR);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleOpen = useCallback(async () => {
    if (CONFIG_ERROR) { setError(CONFIG_ERROR); return; }
    setLoading(true); setError(null);
    try {
      const token = await acquireDriveToken();
      setAccessToken(token);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir Google Drive.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <FolderOpen className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Selecciona un documento desde Google Drive</p>
          <p className="mt-1 text-xs text-muted-foreground">Solo se puede adjuntar un archivo por expediente.</p>
        </div>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleOpen}
          disabled={disabled || loading || Boolean(CONFIG_ERROR)}
        >
          {loading ? <Loader2 className="animate-spin" /> : <FolderOpen />}
          Abrir Google Drive
        </Button>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </p>
      )}

      <SingleDrivePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={accessToken}
        onPick={(file) => {
          onPick(file);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
