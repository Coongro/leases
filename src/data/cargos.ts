import { actions } from '@coongro/plugin-sdk';

import { RENT_SOURCE } from '../services/charge-generation.js';

/**
 * Los cargos de UN contrato, para su ficha.
 *
 * Comparte el puente del resto del kit —`source_ref = "<leaseId>:<período>"`— así
 * que la ficha muestra exactamente los mismos cargos que Cobranzas: no hay dos
 * formas de contar la misma deuda.
 */

interface AccountWithTotals {
  id: string;
  source_ref?: string | null;
  due_date?: string | null;
  total?: string;
  paid?: string;
  balance?: string;
  status?: string;
}

export interface ChargeOfLease {
  id: string;
  /** «Agosto 2026» — el período como lo lee una persona. */
  period: string;
  /** «2026-08» — el crudo, para ordenar. */
  period_key: string;
  due_date: string | null;
  total: string;
  paid: string;
  balance: string;
  status: string;
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** «2026-08» → «Agosto 2026». Un período crudo se lee como un código, no como un mes. */
export function periodoLegible(period: string): string {
  const mes = MESES[Number(period.slice(5, 7)) - 1];
  return mes ? `${mes} ${period.slice(0, 4)}` : period;
}

/** «uuid:2026-07» → «2026-07». */
export function periodoDe(ref: string): string {
  return ref.slice(ref.lastIndexOf(':') + 1);
}

/** «uuid:2026-07» → «uuid». */
export function leaseIdDe(ref: string): string {
  return ref.slice(0, ref.lastIndexOf(':'));
}

export async function cargosDeContrato(leaseId: string): Promise<ChargeOfLease[]> {
  if (!leaseId) return [];

  const cuentas = await actions.execute<AccountWithTotals[]>('billing.accounts.listWithTotals', {
    source: RENT_SOURCE,
  });

  return (
    (cuentas ?? [])
      .filter((c) => leaseIdDe(String(c.source_ref ?? '')) === leaseId)
      .map((c) => {
        const period = periodoDe(String(c.source_ref ?? ''));
        return {
          id: c.id,
          period: periodoLegible(period),
          period_key: period,
          due_date: c.due_date ?? null,
          total: c.total ?? '0',
          paid: c.paid ?? '0',
          balance: c.balance ?? '0',
          status: c.status ?? 'open',
        };
      })
      // Lo más reciente arriba: la cuenta se lee de ahora hacia atrás.
      .sort((a, b) => b.period_key.localeCompare(a.period_key))
  );
}
