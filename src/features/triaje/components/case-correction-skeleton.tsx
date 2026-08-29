import { Skeleton } from '@/components/ui/skeleton';

/** Esqueleto de carga de la pantalla de corrección. */
export function CaseCorrectionSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-6">
      <Skeleton className="h-5 w-72" />
      <Skeleton className="h-8 w-96" />
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-3.5 lg:grid-cols-[45%_55%]">
        <Skeleton className="h-[440px] w-full" />
        <Skeleton className="h-[440px] w-full" />
      </div>
    </div>
  );
}
