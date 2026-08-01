import { actions } from '@coongro/plugin-sdk';

import {
  pendingAdjustments,
  type DueAdjustment,
  type LeaseForAdjustment,
} from '../services/adjustment-detection.js';

/**
 * Busca contratos que cumplieron su período de actualización y deja una propuesta
 * `pending` por cada uno, con el factor ya calculado contra la serie del índice.
 *
 * NO cambia ningún alquiler: eso lo hace una persona al confirmar. Acá solo se
 * prepara la cuenta, con los dos valores del índice guardados para que se pueda
 * verificar.
 *
 * Es repetible: los ajustes ya registrados no se vuelven a proponer.
 */

export interface DetectionResult {
  proposed: number;
  failed: Array<{ label: string; reason: string }>;
  items: Array<DueAdjustment & { newRent?: string; ratePercent?: number }>;
}

interface AdjustmentRow {
  lease_id: string;
  effective_date: string;
}

const hoy = (): string => new Date().toISOString().slice(0, 10);

export async function detectarAjustes(): Promise<DetectionResult> {
  const [contratos, existentes] = await Promise.all([
    actions.execute<LeaseForAdjustment[]>('leases.contracts.list'),
    actions.execute<AdjustmentRow[]>('leases.adjustments.list'),
  ]);

  const porContrato = new Map<string, string[]>();
  for (const a of existentes ?? []) {
    const arr = porContrato.get(a.lease_id) ?? [];
    arr.push(a.effective_date);
    porContrato.set(a.lease_id, arr);
  }

  const result: DetectionResult = { proposed: 0, failed: [], items: [] };
  const today = hoy();

  for (const lease of contratos ?? []) {
    const pendientes = pendingAdjustments({
      lease,
      today,
      existing: porContrato.get(lease.id) ?? [],
    });

    for (const p of pendientes) {
      try {
        // El factor se calcula contra la serie real. Si el índice no está disponible
        // para esas fechas, la propuesta NO se crea: un ajuste sin respaldo es peor
        // que no tenerlo.
        const factor = await actions.execute<{
          valueFrom: number;
          valueTo: number;
          factor: number;
          ratePercent: number;
          dateFrom: string;
          dateTo: string;
          newRent: string;
        }>('indices.values.quote', {
          indexCode: p.indexCode,
          dateFrom: p.baseDate,
          dateTo: p.effectiveDate,
          previousRent: p.previousRent,
        });

        await actions.execute('leases.adjustments.create', {
          data: {
            lease_id: p.leaseId,
            index_code: p.indexCode,
            status: 'pending',
            effective_date: p.effectiveDate,
            base_date: factor.dateFrom,
            index_value_from: String(factor.valueFrom),
            index_value_to: String(factor.valueTo),
            rate_percent: String(factor.ratePercent),
            previous_rent: p.previousRent,
            new_rent: factor.newRent,
          },
        });

        result.proposed += 1;
        result.items.push({ ...p, newRent: factor.newRent, ratePercent: factor.ratePercent });
      } catch (err) {
        result.failed.push({
          label: `${p.label} · ${p.effectiveDate}`,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return result;
}

/**
 * Confirma una actualización: el contrato pasa a valer el monto nuevo desde su fecha.
 *
 * El ajuste queda `applied` con su fecha, y el alquiler del contrato cambia. De ahí en
 * más, la generación de cargos usa el valor nuevo.
 */
export async function aplicarAjuste({
  id,
  leaseId,
  newRent,
}: {
  id: string;
  leaseId: string;
  newRent: string;
}): Promise<void> {
  await actions.execute('leases.contracts.update', {
    id: leaseId,
    data: { rent_amount: newRent },
  });
  await actions.execute('leases.adjustments.update', {
    id,
    data: { status: 'applied', applied_at: new Date().toISOString() },
  });
}
