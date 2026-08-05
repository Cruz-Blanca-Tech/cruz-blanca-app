'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  File,
  FileArchive,
  FileCode,
  FileSearch,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
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
import { clientEnv } from '@/lib/env';
import { cn } from '@/lib/utils';
import type { GoogleApi, GoogleTokenResponse } from '@/types/google-picker';
import type { PickedFile } from '@/features/carga-datos/types';

// ── Auth helpers (copiados del GoogleDrivePicker original) ──────────────────
const GOOGLE_CLIENT_ID = clientEnv.googleClientId;
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const GSI_SCRIPT_ID = 'google-identity-services-script';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function getGoogleApi(): GoogleApi | undefined {
  return (window as unknown as { google?: GoogleApi }).google;
}

function loadScript(id: string, src: string, isReady: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('window no disponible')); return; }
    if (isReady()) { resolve(); return; }
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = id; script.src = src; script.async = true; script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

export async function ensureIdentityServices(): Promise<void> {
  await loadScript(GSI_SCRIPT_ID, GSI_SCRIPT_SRC, () => Boolean(getGoogleApi()?.accounts?.oauth2));
}

const SESSION_STORAGE_KEY = 'cruz_blanca_drive_token';
let memoryToken: { value: string; expiresAt: number } | null = null;
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

function getCachedToken(): { value: string; expiresAt: number } | null {
  if (memoryToken) return memoryToken;
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.expiresAt > Date.now()) { memoryToken = parsed; return parsed; }
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch { /* ignore */ }
  return null;
}

function setCachedToken(value: string, expiresAt: number) {
  const tokenObj = { value, expiresAt };
  memoryToken = tokenObj;
  try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tokenObj)); } catch { /* ignore */ }
}

function requestDriveToken(google: GoogleApi): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID ?? '',
      scope: DRIVE_SCOPE,
      callback: (response: GoogleTokenResponse) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description ?? response.error ?? 'No se concedió acceso a Google Drive.'));
          return;
        }
        const ttlMs = (response.expires_in ?? 3600) * 1000;
        setCachedToken(response.access_token, Date.now() + ttlMs - TOKEN_EXPIRY_MARGIN_MS);
        resolve(response.access_token);
      },
      error_callback: (error) => reject(new Error(error.message ?? 'Se canceló la autorización de Drive.')),
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export function getDriveToken(google: GoogleApi): Promise<string> {
  const cached = getCachedToken();
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
  return requestDriveToken(google);
}

// ── Tipos internos ──────────────────────────────────────────────────────────
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  isSharedDrive?: boolean;
}

interface Breadcrumb { id: string; name: string; }

const ROOT_NODES: DriveFile[] = [
  { id: 'root', name: 'Mi Unidad', mimeType: 'application/vnd.google-apps.folder' },
  { id: 'shared_drives_root', name: 'Unidades Compartidas', mimeType: 'application/vnd.google-apps.folder', isSharedDrive: true },
];

const CONFIG_ERROR = !GOOGLE_CLIENT_ID ? 'Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.' : null;

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
  const [history, setHistory] = useState<Breadcrumb[]>([{ id: 'app_root', name: 'Google Drive' }]);
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
      if (folderId === 'shared_drives_root') {
        const res = await fetch('https://www.googleapis.com/drive/v3/drives?pageSize=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error al cargar Unidades Compartidas');
        const data = await res.json();
        let drives = (data.drives || []).map((d: { id: string; name: string }) => ({
          id: d.id, name: d.name, mimeType: 'application/vnd.google-apps.folder', isSharedDrive: true,
        }));
        if (search) drives = drives.filter((d: DriveFile) => d.name.toLowerCase().includes(search.toLowerCase()));
        setFiles(drives);
      } else {
        let query = `'${folderId}' in parents and trashed = false`;
        if (search) query += ` and name contains '${search.replace(/'/g, "\\'")}'`;
        const url = new URL('https://www.googleapis.com/drive/v3/files');
        url.searchParams.append('q', query);
        url.searchParams.append('fields', 'files(id,name,mimeType,modifiedTime)');
        url.searchParams.append('orderBy', 'folder,name');
        url.searchParams.append('pageSize', '200');
        url.searchParams.append('supportsAllDrives', 'true');
        url.searchParams.append('includeItemsFromAllDrives', 'true');
        url.searchParams.append('corpora', 'allDrives');
        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al cargar archivos de Google Drive');
        const data = await res.json();
        setFiles(data.files || []);
      }
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

  const getIcon = (mimeType: string, isSharedDrive?: boolean, size = 4) => {
    const cls = `size-${size}`;
    if (isSharedDrive) return <HardDrive className={cn(cls, 'text-emerald-600')} />;
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className={cn(cls, 'text-blue-500 fill-blue-100')} />;
    if (mimeType.includes('image')) return <ImageIcon className={cn(cls, 'text-purple-500')} />;
    if (mimeType.includes('pdf')) return <FileText className={cn(cls, 'text-red-500')} />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className={cn(cls, 'text-amber-500')} />;
    if (mimeType.includes('json') || mimeType.includes('html')) return <FileCode className={cn(cls, 'text-slate-500')} />;
    return <File className={cn(cls, 'text-slate-400')} />;
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
                          {getIcon(file.mimeType, file.isSharedDrive)}
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
      await ensureIdentityServices();
      const google = getGoogleApi();
      if (!google?.accounts?.oauth2) throw new Error('Las APIs de Google no se cargaron correctamente.');
      const token = await getDriveToken(google);
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
