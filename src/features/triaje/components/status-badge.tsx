import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { BatchStatus } from '../schemas/batch-status-schema';
import { BATCH_STATUS_CONFIG } from '../lib/batch-status-config';

interface StatusBadgeProps {
  status: BatchStatus;
}

/** Badge del estado del lote (icono + etiqueta), con color por token. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const config = BATCH_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      className={cn(
        'gap-1 rounded-sm px-2 py-0.5 font-data text-[10.5px] font-semibold tracking-wide',
        config.badgeClassName
      )}
    >
      <Icon className={cn('size-3', config.spin && 'animate-spin')} />
      {config.label}
    </Badge>
  );
}
