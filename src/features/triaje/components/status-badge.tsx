import { OctagonAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BatchStatus } from '../schemas/batch-status-schema';
import { BATCH_STATUS_CONFIG } from '../lib/batch-status-config';

interface StatusBadgeProps {
  status: BatchStatus;
  failureReason?: string | null;
}

/** Badge del estado del lote (icono + etiqueta), con color por token. Si hay error, muestra tooltip con el detalle al pasar el mouse. */
export function StatusBadge({ status, failureReason }: StatusBadgeProps) {
  const config = BATCH_STATUS_CONFIG[status];
  const Icon = config.icon;

  const badgeNode = (
    <Badge
      className={cn(
        'gap-1 rounded-sm px-2 py-0.5 font-data text-[10.5px] font-semibold tracking-wide',
        config.badgeClassName,
        failureReason && 'cursor-help transition-opacity hover:opacity-90'
      )}
      title={failureReason ?? undefined}
    >
      <Icon className={cn('size-3', config.spin && 'animate-spin')} />
      {config.label}
    </Badge>
  );

  if (!failureReason) {
    return badgeNode;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex cursor-help" />}>
        {badgeNode}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs px-3 py-2 text-left bg-slate-900 text-white border border-slate-700 shadow-lg"
      >
        <div className="flex items-start gap-2">
          <OctagonAlert className="size-3.5 shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-xs text-red-300">
              Detalle del error
            </p>
            <p className="text-[11px] leading-snug text-slate-200 break-words font-sans">
              {failureReason}
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
