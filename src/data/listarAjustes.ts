import { actions } from '@coongro/plugin-sdk';

/**
 * Actualizaciones con su contrato resuelto (unidad, propiedad, inquilino).
 *
 * El cruce se hace acá porque la tabla de ajustes solo guarda el `lease_id`: repetir
 * los datos del contrato en cada ajuste los dejaría desactualizados el día que la
 * unidad cambie de nombre.
 */

export interface AdjustmentRow {
  id: string;
  lease_id: string;
  index_code: string;
  status: string;
  effective_date: string;
  base_date?: string | null;
  index_value_from?: string | null;
  index_value_to?: string | null;
  rate_percent?: string | null;
  previous_rent: string;
  new_rent: string;
  unit?: string | null;
  property?: string | null;
  tenant?: string | null;
}

interface LeaseRow {
  id: string;
  unit?: string | null;
  property?: string | null;
  tenant?: string | null;
}

export async function listarAjustes(): Promise<AdjustmentRow[]> {
  const [ajustes, contratos] = await Promise.all([
    actions.execute<AdjustmentRow[]>('leases.adjustments.list'),
    actions.execute<LeaseRow[]>('leases.contracts.list'),
  ]);

  const porId = new Map((contratos ?? []).map((l) => [l.id, l]));
  return (
    (ajustes ?? [])
      .map((a) => {
        const l = porId.get(a.lease_id);
        return {
          ...a,
          unit: l?.unit ?? null,
          property: l?.property ?? null,
          tenant: l?.tenant ?? null,
        };
      })
      // Lo que espera confirmación primero; dentro de cada grupo, lo que rige antes.
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
        return a.effective_date.localeCompare(b.effective_date);
      })
  );
}

/** Suma de lo que aumentarían los alquileres si se confirmaran todas las pendientes. */
export function impactoMensual(rows: AdjustmentRow[]): number {
  return rows
    .filter((r) => r.status === 'pending')
    .reduce((acc, r) => acc + (Number(r.new_rent) - Number(r.previous_rent)), 0);
}
