'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { ROLES } from '@/features/auth/types';

import { useBeneficiaries } from '../hooks/use-beneficiarios-queries';
import { BeneficiariosTable } from './beneficiarios-table';
import { BeneficiariosPagination } from './beneficiarios-pagination';
import { VisualizadorBanner } from './visualizador-banner';

/** Beneficiarios por página (el listado del backend pagina con `skip`/`limit`). */
const PAGE_SIZE = 20;

/** Orquestador de la pantalla de Beneficiarios (ruta /beneficiarios). */
export function BeneficiariosScreen() {
  const [page, setPage] = useState(0); // 0-based

  // El rol Visualizador enmascara automáticamente los datos personales (sin
  // toggle manual, a diferencia del mockup).
  const masked = useAuthStore((s) => s.role) === ROLES.VISUALIZADOR;

  const { data, isLoading, isError } = useBeneficiaries({
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const beneficiaries = data?.items ?? [];
  const total = data?.total ?? 0;
  const showPagination = !isError && total > 0;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Encabezado */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary">
            Beneficiarios
          </h1>
          <p className="mt-0.5 font-sans text-sm text-ink-muted">
            {total > 0
              ? `${total} beneficiarios registrados`
              : 'Gestión y consulta de registros'}
          </p>
        </div>
        {/* TODO: enlazar a la pantalla de registro cuando exista. Por ahora es un
            placeholder deshabilitado. */}
        <Button
          size="lg"
          disabled
          className="shrink-0"
          title="La pantalla de registro estará disponible próximamente"
        >
          <UserPlus />
          Nuevo registro
        </Button>
      </header>

      {/* Aviso de enmascarado (solo rol Visualizador) */}
      {masked && <VisualizadorBanner />}

      {/* Tabla + paginación en una sola tarjeta */}
      <Card className="gap-0 overflow-hidden p-0 ring-border">
        <BeneficiariosTable
          beneficiaries={beneficiaries}
          isLoading={isLoading}
          isError={isError}
          masked={masked}
        />
        {showPagination && (
          <BeneficiariosPagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}
