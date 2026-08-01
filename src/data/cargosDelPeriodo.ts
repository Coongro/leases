import { actions } from '@coongro/plugin-sdk';

import { RENT_SOURCE } from '../services/charge-generation.js';

/**
 * Los cargos de alquiler de un período, con el contrato al que pertenece cada uno.
 *
 * El cruce se hace acá y no en la base porque son dos plugins: las cuentas las lleva
 * `billing` (que no sabe qué es un contrato) y el contrato lo tiene `leases` (que no
 * lleva la plata). El puente es `source_ref = "<leaseId>:<período>"`, que es el mismo
 * dato con el que la generación evita duplicar.
 */

export interface ChargeRow {
  id: string;
  unit: string | null;
  property: string | null;
  tenant: string | null;
  due_date: string | null;
  total_due: string;
  paid: string;
  balance: string;
  status: string;
  rent: string;
  expenses: string;
  /** Porcentaje diario de punitorio pactado en el contrato ('0' = no se pactó). */
  late_fee_percent: string;
}

interface AccountWithTotals {
  id: string;
  source_ref?: string | null;
  due_date?: string | null;
  total?: string;
  paid?: string;
  balance?: string;
  status?: string;
}

interface LeaseRow {
  id: string;
  unit?: string | null;
  property?: string | null;
  tenant?: string | null;
  rent_amount?: string;
  expenses_amount?: string | null;
  late_fee_percent?: string | null;
}

export async function cargosDelPeriodo(period: string): Promise<ChargeRow[]> {
  const [cuentas, contratos] = await Promise.all([
    actions.execute<AccountWithTotals[]>('billing.accounts.listWithTotals', {
      source: RENT_SOURCE,
      refSuffix: `:${period}`,
    }),
    actions.execute<LeaseRow[]>('leases.contracts.list'),
  ]);

  const porContrato = new Map((contratos ?? []).map((l) => [l.id, l]));

  return (cuentas ?? []).map((c) => {
    // `source_ref` es «<leaseId>:<período>»: el id del contrato es todo lo anterior a
    // los dos puntos finales (un uuid no los tiene, pero se corta por el último por
    // las dudas de que un período futuro cambie de forma).
    const ref = String(c.source_ref ?? '');
    const leaseId = ref.slice(0, ref.lastIndexOf(':'));
    const l = porContrato.get(leaseId);

    return {
      id: c.id,
      unit: l?.unit ?? null,
      property: l?.property ?? null,
      tenant: l?.tenant ?? null,
      due_date: c.due_date ?? null,
      total_due: c.total ?? '0',
      paid: c.paid ?? '0',
      balance: c.balance ?? '0',
      status: c.status ?? 'open',
      // El desglose sale del contrato: es lo que se facturó, y sirve para explicar el
      // total sin tener que abrir cada cuenta.
      rent: l?.rent_amount ?? '0',
      expenses: l?.expenses_amount ?? '0',
      late_fee_percent: l?.late_fee_percent ?? '0',
    };
  });
}

/** Totales del período para los indicadores de arriba. */
export function totalesDelPeriodo(rows: ChargeRow[]): {
  facturado: number;
  cobrado: number;
  porCobrar: number;
  vencido: number;
  cargos: number;
  saldados: number;
  vencidos: number;
} {
  let facturado = 0;
  let cobrado = 0;
  let vencido = 0;
  let saldados = 0;
  let vencidos = 0;

  for (const r of rows) {
    facturado += Number(r.total_due);
    cobrado += Number(r.paid);
    if (r.status === 'paid') saldados += 1;
    if (r.status === 'overdue') {
      vencido += Number(r.balance);
      vencidos += 1;
    }
  }

  return {
    facturado,
    cobrado,
    // Lo que falta cobrar y todavía no venció: el resto del saldo.
    porCobrar: Math.max(0, facturado - cobrado - vencido),
    vencido,
    cargos: rows.length,
    saldados,
    vencidos,
  };
}
