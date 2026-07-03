import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BeneficiariosPaginationProps {
  /** Página actual (0-based). */
  page: number;
  /** Total de registros (global, del backend). */
  total: number;
  /** Registros por página (`limit`). */
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Ventana de páginas a mostrar (1-based) con elipsis, al estilo del mockup:
 * siempre la primera y la última, y hasta un vecino a cada lado de la actual.
 * `'ellipsis-left' | 'ellipsis-right'` marcan los saltos.
 */
function getPageWindow(
  current: number,
  totalPages: number
): Array<number | 'ellipsis-left' | 'ellipsis-right'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(totalPages - 1, current + 1);

  if (left > 2) pages.push('ellipsis-left');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('ellipsis-right');

  pages.push(totalPages);
  return pages;
}

/** Paginación real basada en `skip`/`limit` + `total` del backend. */
export function BeneficiariosPagination({
  page,
  total,
  pageSize,
  onPageChange,
}: BeneficiariosPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = page + 1; // 1-based para la UI
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  const pages = getPageWindow(current, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <span className="font-data text-[11.5px] text-ink-muted">
        Mostrando{' '}
        <span className="font-medium text-ink-secondary">
          {start}–{end}
        </span>{' '}
        de <span className="font-medium text-ink-secondary">{total}</span>{' '}
        beneficiarios
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>

          {pages.map((item) =>
            typeof item === 'number' ? (
              <Button
                key={item}
                size="icon-sm"
                variant={item === current ? 'default' : 'outline'}
                onClick={() => onPageChange(item - 1)}
                aria-current={item === current ? 'page' : undefined}
                className={cn('font-data', item !== current && 'text-ink-secondary')}
              >
                {item}
              </Button>
            ) : (
              <span
                key={item}
                className="px-1 font-data text-xs text-ink-muted"
                aria-hidden
              >
                …
              </span>
            )
          )}

          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            aria-label="Página siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
