import { Badge } from '@/components/ui/badge';

interface ProgramBadgeProps {
  /** Nombre del programa; puede venir `null` del backend. */
  name: string | null;
}

/**
 * Badge del programa con estilo neutro y consistente. El backend no entrega
 * color por programa, así que no se replican los colores por programa del
 * mockup: se usa un único tratamiento neutro con un punto indicador.
 */
export function ProgramBadge({ name }: ProgramBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-sm px-2 py-0.5 font-sans text-xs font-semibold"
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {name ?? '—'}
    </Badge>
  );
}
