import { actions } from '@coongro/plugin-sdk';

import { RENT_SOURCE } from '../services/charge-generation.js';

import { leaseIdDe, periodoDe, periodoLegible } from './cargos.js';

/**
 * Todo lo que la ficha de un inquilino muestra: sus contratos y su cuenta corriente.
 *
 * Se arma cruzando dos plugins —los contratos son de `leases`, la plata de `billing`—
 * por el mismo puente que usa el resto del kit: `source_ref = "<leaseId>:<período>"`.
 * Ese cruce vive en el front porque ningún repositorio del servidor puede llamar al
 * otro plugin.
 */

export interface LeaseOfTenant {
  id: string;
  tenant_contact_id?: string;
  unit?: string | null;
  property?: string | null;
  start_date?: string;
  end_date?: string;
  rent_amount?: string;
  state?: string;
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

export interface ChargeOfTenant {
  id: string;
  /** «Agosto 2026» — el período como lo lee una persona. */
  period: string;
  /** «2026-08» — el crudo, para ordenar. */
  period_key: string;
  unit: string | null;
  due_date: string | null;
  total_due: string;
  paid: string;
  balance: string;
  status: string;
}

export interface TenantFile {
  contratos: LeaseOfTenant[];
  cargos: ChargeOfTenant[];
  /** El contrato que rige hoy, si hay alguno. */
  vigente?: LeaseOfTenant;
  /** Fecha del primer contrato: desde cuándo es inquilino. */
  desde?: string;
  facturado: number;
  cobrado: number;
  saldo: number;
  impagos: number;
}

const VIGENTES = new Set(['vigente', 'por_vencer']);

export async function fichaDeInquilino(tenantId: string): Promise<TenantFile> {
  const [todos, cuentas] = await Promise.all([
    actions.execute<LeaseOfTenant[]>('leases.contracts.list'),
    actions.execute<AccountWithTotals[]>('billing.accounts.listWithTotals', {
      source: RENT_SOURCE,
    }),
  ]);

  const contratos = (todos ?? []).filter((l) => l.tenant_contact_id === tenantId);
  const porId = new Map(contratos.map((l) => [l.id, l]));

  const cargos = (cuentas ?? [])
    .filter((c) => porId.has(leaseIdDe(String(c.source_ref ?? ''))))
    .map((c) => {
      const ref = String(c.source_ref ?? '');
      const period = periodoDe(ref);
      return {
        id: c.id,
        period: periodoLegible(period),
        period_key: period,
        unit: porId.get(leaseIdDe(ref))?.unit ?? null,
        due_date: c.due_date ?? null,
        total_due: c.total ?? '0',
        paid: c.paid ?? '0',
        balance: c.balance ?? '0',
        status: c.status ?? 'open',
      };
    })
    // Lo más reciente arriba: la cuenta corriente se lee de ahora hacia atrás.
    .sort((a, b) => b.period_key.localeCompare(a.period_key));

  let facturado = 0;
  let cobrado = 0;
  let impagos = 0;
  for (const c of cargos) {
    facturado += Number(c.total_due);
    cobrado += Number(c.paid);
    if (c.status !== 'paid') impagos += 1;
  }

  const fechas = contratos.map((l) => String(l.start_date ?? '')).filter(Boolean);

  return {
    contratos,
    cargos,
    vigente: contratos.find((l) => VIGENTES.has(String(l.state))),
    desde: fechas.length ? fechas.sort()[0] : undefined,
    facturado,
    cobrado,
    saldo: facturado - cobrado,
    impagos,
  };
}
