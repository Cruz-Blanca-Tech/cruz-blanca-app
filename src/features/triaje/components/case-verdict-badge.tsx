import { HelpCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getVerdictConfig } from '../lib/triage-verdict-config';

interface CaseVerdictBadgeProps {
  /** Veredicto del expediente (string plano del backend). */
  verdict: string;
}

/**
 * Badge del veredicto de un expediente, con icono y color por token
 * (reutiliza `triage-verdict-config`). Ante un veredicto desconocido del backend
 * cae a un tratamiento neutro mostrando el valor crudo, sin romper.
 */
export function CaseVerdictBadge({ verdict }: CaseVerdictBadgeProps) {
  const config = getVerdictConfig(verdict);

  if (!config) {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5 rounded-sm px-2 py-0.5 font-sans text-xs font-semibold"
      >
        <HelpCircle className="size-3" />
        {verdict}
      </Badge>
    );
  }

  const Icon = config.icon;
  return (
    <Badge
      className={cn(
        'gap-1.5 rounded-sm px-2 py-0.5 font-sans text-xs font-semibold',
        config.chipClassName
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
