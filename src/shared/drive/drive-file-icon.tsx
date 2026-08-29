/**
 * Ícono según el mimeType de un archivo/carpeta de Drive. Mapeo compartido entre
 * los dos pickers (antes duplicado como `getIcon`/`getFileIcon`). Con `size > 4`
 * atenúa el ícono (usado en la vista grid del multi-picker); para `size = 4`
 * (single-picker y vista lista) el resultado es idéntico al original.
 */
import {
  File,
  FileArchive,
  FileCode,
  FileText,
  Folder,
  HardDrive,
  Image as ImageIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';

export function getDriveFileIcon(
  mimeType: string,
  isSharedDrive?: boolean,
  size = 4
): ReactElement {
  const cls = `size-${size} ${size > 4 ? 'opacity-80' : ''}`;
  if (isSharedDrive) return <HardDrive className={cn(cls, 'text-emerald-600')} />;
  if (mimeType === 'application/vnd.google-apps.folder')
    return <Folder className={cn(cls, 'text-blue-500 fill-blue-100')} />;
  if (mimeType.includes('image')) return <ImageIcon className={cn(cls, 'text-purple-500')} />;
  if (mimeType.includes('pdf')) return <FileText className={cn(cls, 'text-red-500')} />;
  if (mimeType.includes('zip') || mimeType.includes('rar'))
    return <FileArchive className={cn(cls, 'text-amber-500')} />;
  if (mimeType.includes('json') || mimeType.includes('html'))
    return <FileCode className={cn(cls, 'text-slate-500')} />;
  return <File className={cn(cls, 'text-slate-400')} />;
}
