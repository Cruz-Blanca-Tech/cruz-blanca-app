'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  FileSearch,
  Search,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { PickedFile, DriveFile, DriveBreadcrumb } from '@/shared/drive/types';
import { ROOT_NODES, listDriveContent, listFolderFiles } from '@/shared/drive/drive-api';
import { getDriveFileIcon } from '@/shared/drive/drive-file-icon';
import { useNearViewport, usePreviewImage, useThumbnail } from '@/shared/drive/use-drive-image';
import { DocumentLightbox } from './document-lightbox';

interface PickerThumbProps {
  file: DriveFile;
  /** Tamaño del ícono de respaldo, igual que en `getDriveFileIcon`. */
  iconSize?: number;
  imgClassName: string;
}

/**
 * Miniatura del archivo, con el ícono de Drive de respaldo.
 *
 * Sirve para las dos vistas porque el operador elige archivos escaneados, y
 * elegir un escaneo mirando un ícono de Word es adivinar: `Imagen (2).jpg` y
 * `Imagen (3).jpg` son idénticos hasta que se los mira. Es el mismo motivo por
 * el que la galería de huecos es una grilla de fotos y no una lista de nombres.
 *
 * Solo se pide para mimes de imagen. Un PDF o una carpeta no se van a
 * convertir nunca en miniatura, y con el selector listando hasta 1.000 archivos
 * por carpeta, intentar descargarlos para que `createImageBitmap` falle sería
 * gastar el ancho de banda de Google en descartes.
 *
 * La descarga es la de `shared/drive/thumbnail`: 4 peticiones simultáneas como
 * tope, caché por id y reducción en el cliente a 360px. Y solo se pide para las
 * filas que están por verse, así que recorrer la carpeta no dispara 1.000
 * descargas de golpe.
 */
function PickerThumb({ file, iconSize = 4, imgClassName }: PickerThumbProps) {
  const isImage = file.mimeType?.startsWith('image/') ?? false;
  const { ref, near } = useNearViewport<HTMLSpanElement>({
    enabled: isImage,
  });
  // El nombre va por la extensión: `image/tiff` pasa el filtro de `isImage`
  // pero no lo dibuja ningún navegador, y bajarlo entero es gastar ancho de
  // banda en un descarte. Ver `UNRENDERABLE_EXTENSIONS`.
  const { url } = useThumbnail(
    isImage ? file.id : '',
    isImage && near,
    file.name
  );

  return (
    <span ref={ref} className="flex size-full items-center justify-center">
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element -- data URL de
            ~18KB ya reducida en el cliente; `next/image` solo agregaría una
            vuelta por el optimizador. */
        <img src={url} alt="" className={imgClassName} />
      ) : (
        getDriveFileIcon(file.mimeType, file.isSharedDrive, iconSize)
      )}
    </span>
  );
}

/**
 * La lupa de una tarjeta del selector.
 *
 * Existe por el mismo motivo que la miniatura: `Imagen (2).jpg` y
 * `Imagen (3).jpg` son idénticos hasta que se los mira, y al elegir hay que
 * poder distinguir *cuál* de los dos escaneos es, no solo que hay una foto ahí.
 *
 * La diferencia con el panel de revisión es que **pide** la versión grande en
 * vez de tenerla: acá la miniatura es de 360px porque la tarjeta es de 150px, y
 * bajarle 2.000px a cada una de las tarjetas que van apareciendo sería
 * justamente el problema que el tope de 4 descargas y el recorte de 360px
 * existen para evitar. Se pide una, la que el operador está por mirar, y queda
 * cacheada para cuando ese archivo llegue al lote.
 *
 * Solo para imágenes, y con el mismo filtro de mimes que `PickerThumb`: la lupa
 * de una carpeta o de un PDF no tiene nada que mostrar.
 */
function PickerLightbox({ file }: { file: DriveFile }) {
  const isImage = file.mimeType?.startsWith('image/') ?? false;
  const [pedido, setPedido] = useState(false);
  const { url, failed, failure } = usePreviewImage(
    isImage ? file.id : '',
    pedido,
    file.name
  );

  if (!isImage) return null;

  return (
    <DocumentLightbox
      url={url}
      fileName={file.name}
      failure={failed ? failure : undefined}
      onOpen={() => setPedido(true)}
    />
  );
}

interface CustomDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onPick: (files: PickedFile[]) => void;
}

export function CustomDrivePickerModal({
  isOpen,
  onClose,
  token,
  onPick
}: CustomDrivePickerModalProps) {
  const [history, setHistory] = useState<DriveBreadcrumb[]>([{ id: 'app_root', name: 'Google Drive' }]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const currentFolder = history[history.length - 1];

  const fetchContent = useCallback(async (folderId: string, search: string = '') => {
    if (!token) return;

    if (folderId === 'app_root') {
      setFiles(ROOT_NODES);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // El multi-picker lista con pageSize alto (1000) para poder "Seleccionar todo".
      setFiles(await listDriveContent(token, folderId, search, 1000));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isOpen || !token) return;
    const timer = setTimeout(() => {
      fetchContent(currentFolder.id, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, currentFolder.id, isOpen, token, fetchContent]);

  // Reset del estado local al abrir el modal. En lugar de un useEffect con
  // setState síncrono (regla react-hooks/set-state-in-effect), se ajusta el
  // estado durante el render comparando con la última apertura (patrón React:
  // "adjusting state when a prop changes").
  const [lastOpenKey, setLastOpenKey] = useState<string | null>(null);
  const openKey = isOpen && token ? `open:${token}` : 'closed';
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (openKey !== 'closed') {
      setHistory([{ id: 'app_root', name: 'Google Drive' }]);
      setSelectedIds(new Set());
      setSearchQuery('');
      setFiles(ROOT_NODES);
    }
  }

  const handleFolderClick = (folder: DriveFile) => {
    if (loading) return;
    setSearchQuery('');
    setHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].id === folder.id) {
        return prev;
      }
      return [...prev, { id: folder.id, name: folder.name }];
    });
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === history.length - 1) return;
    setSearchQuery('');
    const newHistory = history.slice(0, index + 1);
    setHistory(newHistory);
  };

  const toggleSelection = (fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableFiles = files.filter(f => f.id !== 'root' && f.id !== 'shared_drives_root');
    if (selectableFiles.length === 0) return;
    
    const allSelected = selectableFiles.every(f => selectedIds.has(f.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableFiles.map(f => f.id)));
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0 || !token) return;
    setIsConfirming(true);
    setError(null);
    try {
      let finalFiles: PickedFile[] = [];
      const selectedFiles = files.filter(f => selectedIds.has(f.id));

      for (const file of selectedFiles) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          const subFiles = await listFolderFiles(token, file.id);
          finalFiles = finalFiles.concat(subFiles);
        } else {
          finalFiles.push({
            source_id: file.id,
            file_name: file.name
          });
        }
      }

      if (finalFiles.length > 0) {
        onPick(finalFiles);
      }
      onClose();
    } catch (err) {
      setError('Error al procesar la selección');
    } finally {
      setIsConfirming(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isConfirming && onClose()}>
      {/* max-w-[90vw] o max-w-5xl hace el modal mucho más ancho */}
      <DialogContent className="max-w-[90vw] lg:max-w-6xl flex flex-col h-[90vh] p-0 gap-0 overflow-hidden bg-white">
        
        {/* Header & Breadcrumbs */}
        <DialogHeader className="px-8 py-5 pb-4 border-b border-border shrink-0 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Seleccionar Documentos
            </DialogTitle>
            
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64 md:w-80">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar en esta carpeta..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                  disabled={currentFolder.id === 'app_root'}
                />
              </div>

              {/* Botones de Vista (Lista / Grid) */}
              <div className="flex items-center p-1 rounded-md bg-slate-100 border border-slate-200">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("size-8 rounded-sm", viewMode === 'grid' ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  onClick={() => setViewMode('grid')}
                  title="Vista de Cuadrícula"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("size-8 rounded-sm", viewMode === 'list' ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  onClick={() => setViewMode('list')}
                  title="Vista de Lista"
                >
                  <ListIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 mt-4 text-sm text-muted-foreground overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
            {history.map((crumb, index) => {
              const isLast = index === history.length - 1;
              return (
                <div key={crumb.id} className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    disabled={isLast || loading || isConfirming}
                    className={cn(
                      "transition-colors rounded-md px-2 py-1",
                      isLast ? "text-foreground font-semibold bg-slate-200/50" : "hover:bg-slate-100 hover:text-foreground"
                    )}
                  >
                    {crumb.name}
                  </button>
                  {!isLast && <ChevronRight className="size-4 shrink-0 opacity-40" />}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50/30">
          {error && (
            <div className="m-4 p-3 rounded-md bg-destructive/10 text-destructive flex items-center gap-2 text-sm border border-destructive/20">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className={cn("p-4", viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "flex flex-col gap-2")}>
              {Array.from({ length: viewMode === 'grid' ? 12 : 4 }).map((_, i) => (
                viewMode === 'grid' ? (
                  <Skeleton key={i} className="aspect-square w-full rounded-xl" />
                ) : (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                )
              ))}
            </div>
          ) : files.length === 0 && !error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <FileSearch className="size-12 opacity-20" />
              <p className="text-sm font-medium">No se encontraron archivos.</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              {viewMode === 'list' ? (
                /* Vista de Lista */
                <Table>
                  <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="w-12 pl-4">
                        {currentFolder.id !== 'app_root' && (
                          <Checkbox 
                            checked={files.length > 0 && selectedIds.size === files.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Seleccionar todo"
                          />
                        )}
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-32 text-right pr-6">Modificado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      const isSelected = selectedIds.has(file.id);
                      const isSelectable = file.id !== 'root' && file.id !== 'shared_drives_root';

                      return (
                        <TableRow 
                          key={file.id}
                          data-state={isSelected ? "selected" : undefined}
                          className={cn(
                            "cursor-pointer group border-b-slate-100",
                            isSelected ? "bg-primary/5 hover:bg-primary/10" : ""
                          )}
                          onClick={() => {
                            if (isFolder) {
                              handleFolderClick(file);
                            } else if (isSelectable) {
                              toggleSelection(file.id);
                            }
                          }}
                        >
                          <TableCell className="pl-4">
                            {isSelectable && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelection(file.id)}
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="p-2">
                            {/* El mismo criterio que en la grilla: la lupa es
                                para mirar, y el clic en la fila es para
                                elegir. */}
                            <div className="flex items-center gap-1">
                              <div className="flex items-center justify-center size-8 overflow-hidden rounded-md bg-white border border-slate-200 shadow-sm group-hover:border-slate-300 transition-colors">
                                <PickerThumb
                                  file={file}
                                  iconSize={4}
                                  imgClassName="size-full object-cover"
                                />
                              </div>
                              {isSelectable && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <PickerLightbox file={file} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={cn(
                            "font-medium",
                            isSelected ? "text-primary-dark" : "text-foreground"
                          )}>
                            {file.name}
                          </TableCell>
                          <TableCell className="text-right pr-6 text-muted-foreground text-xs font-data">
                            {formatDate(file.modifiedTime)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                /* Vista de Cuadrícula (Grid) */
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {files.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const isSelected = selectedIds.has(file.id);
                    const isSelectable = file.id !== 'root' && file.id !== 'shared_drives_root';

                    return (
                      <div 
                        key={file.id}
                        onClick={() => {
                          if (isFolder) {
                            handleFolderClick(file);
                          } else if (isSelectable) {
                            toggleSelection(file.id);
                          }
                        }}
                        className={cn(
                          "relative group cursor-pointer rounded-xl border bg-white p-3 flex flex-col items-center gap-3 transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                            : "border-border hover:border-slate-300 hover:shadow-md"
                        )}
                      >
                        {isSelectable && (
                          <div 
                            className="absolute top-2 left-2 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(file.id)}
                              className={cn(
                                "transition-opacity",
                                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}
                            />
                          </div>
                        )}

                        {/* A la derecha del checkbox, y con `stopPropagation`
                            como el: mirar un archivo no es elegirlo. Sin esto,
                            la lupa se usaría para revisar un escaneo y el clic
                            lo sacaría o lo pondría en el lote. */}
                        {isSelectable && (
                          <div
                            className="absolute top-2 right-2 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PickerLightbox file={file} />
                          </div>
                        )}
                        
                        {/* Sin padding cuando hay miniatura: la foto tiene que
                            llenar la caja, y `object-top` deja ver la parte de
                            arriba del documento, que es donde está el tipo y
                            de dónde se distingue uno de otro. `cover` con
                            centrado mostraría el medio de la hoja, que en
                            varias es un espacio en blanco. */}
                        <div className="flex-1 flex items-center justify-center w-full aspect-square bg-slate-50/50 rounded-lg border border-slate-100 mb-1 overflow-hidden">
                          <PickerThumb
                            file={file}
                            iconSize={12}
                            imgClassName="size-full object-cover object-top"
                          />
                        </div>
                        
                        <div className="w-full text-center px-1">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-primary-dark" : "text-foreground"
                          )} title={file.name}>
                            {file.name}
                          </p>
                          {file.modifiedTime && (
                            <p className="text-xs text-muted-foreground mt-0.5 font-data">
                              {formatDate(file.modifiedTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          )}
          
          {isConfirming && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-50">
              <Loader2 className="size-10 animate-spin text-primary mb-4" />
              <p className="text-sm font-medium text-slate-700">Procesando {selectedIds.size} elemento{selectedIds.size > 1 ? 's' : ''}...</p>
              <p className="text-xs text-slate-500 mt-1">Esto puede tardar unos segundos si seleccionaste carpetas enteras.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t border-border bg-slate-50/80 shrink-0">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-base font-medium text-slate-700 flex items-center h-full pt-1">
                {selectedIds.size} {selectedIds.size === 1 ? 'elemento' : 'elementos'} seleccionado{selectedIds.size === 1 ? '' : 's'}
              </div>
              {viewMode === 'grid' && files.length > 0 && currentFolder.id !== 'app_root' && (
                 <Button variant="outline" size="sm" onClick={toggleSelectAll} className="h-9">
                   {selectedIds.size === files.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                 </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="lg" onClick={onClose} disabled={isConfirming} className="font-medium">
                Cancelar
              </Button>
              <Button type="button" size="lg" onClick={handleConfirm} disabled={selectedIds.size === 0 || isConfirming} className="font-medium px-6 shadow-sm">
                Extraer y Continuar
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
