import {
  Check,
  CheckCircle2,
  PencilLine,
  ScanLine,
  Upload,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface Step {
  n: number;
  label: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { n: 1, label: 'Subir documento', icon: Upload },
  { n: 2, label: 'Extracción IA', icon: ScanLine },
  { n: 3, label: 'Revisión y corrección', icon: PencilLine },
  { n: 4, label: 'Confirmación', icon: CheckCircle2 },
];

interface OcrStepperProps {
  /** Paso activo (1-indexado). */
  current?: number;
}

export function OcrStepper({ current = 1 }: OcrStepperProps) {
  return (
    <ol className="flex items-start">
      {STEPS.map((step, index) => {
        const done = step.n < current;
        const active = step.n === current;
        const StepIcon = step.icon;

        return (
          <li
            key={step.n}
            className={cn(
              'flex items-start',
              index < STEPS.length - 1 && 'flex-1'
            )}
          >
            <div className="flex flex-none flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-full border-2 transition-colors',
                  done && 'border-success bg-success-light text-success-dark',
                  active && 'border-primary bg-secondary text-primary',
                  !done &&
                    !active &&
                    'border-slate-300 bg-slate-100 text-slate-400'
                )}
              >
                {done ? (
                  <Check className="size-4" />
                ) : (
                  <StepIcon className="size-4" />
                )}
              </div>
              <div className="text-center">
                <span
                  className={cn(
                    'block font-data text-[10px] leading-none',
                    done && 'text-success',
                    active && 'text-primary',
                    !done && !active && 'text-slate-400'
                  )}
                >
                  Paso {step.n}
                </span>
                <span
                  className={cn(
                    'mt-1 block whitespace-nowrap text-xs',
                    active ? 'font-medium' : 'font-normal',
                    done && 'text-success-dark',
                    active && 'text-primary',
                    !done && !active && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>

            {index < STEPS.length - 1 && (
              <div
                aria-hidden
                className={cn(
                  'mx-2.5 mt-[18px] h-0.5 min-w-6 flex-1 rounded-full transition-colors',
                  done ? 'bg-success' : 'bg-border'
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
