/**
 * Totales de un período de cobranza.
 *
 * Vive separado del repositorio porque es la cuenta que se muestra arriba de Cobranzas
 * y en el panel: tiene que poder probarse sin base de datos, y tiene que dar lo mismo
 * la pida la pantalla o el Copilot.
 */

/**
 * Medio centavo: por debajo de eso la cuenta está saldada.
 *
 * El saldo llega como `numeric` de Postgres y se compara en punto flotante; sin este
 * margen, un resto de 0,000001 dejaría un cargo cobrado figurando como impago.
 */
const EPSILON = 0.005;

export interface ChargeTotalsInput {
  total_due: string;
  paid: string;
  balance: string;
  status: string;
}

export interface PeriodTotals {
  facturado: number;
  cobrado: number;
  porCobrar: number;
  vencido: number;
  cargos: number;
  saldados: number;
  vencidos: number;
}

export function periodTotals(rows: ChargeTotalsInput[]): PeriodTotals {
  let facturado = 0;
  let cobrado = 0;
  let vencido = 0;
  let saldados = 0;
  let vencidos = 0;

  for (const r of rows ?? []) {
    facturado += Number(r.total_due) || 0;
    cobrado += Number(r.paid) || 0;
    // Saldado es no deber nada, y eso lo dice el SALDO.
    //
    // Se comparaba contra `status === 'paid'`, un valor que `billing` no escribe nunca:
    // sus cuentas son `open`, `closed` o `overdue`, y lo cobrado vive aparte, en el
    // `paymentStatus` que deriva del balance. La condición era falsa siempre, así que
    // un mes íntegramente cobrado informaba cero cargos saldados —y, del otro lado de
    // la resta, todos impagos— junto a un saldo de $0 que decía lo contrario.
    if (Number(r.balance ?? 0) <= EPSILON) saldados += 1;
    if (r.status === 'overdue') {
      vencido += Number(r.balance) || 0;
      vencidos += 1;
    }
  }

  return {
    facturado,
    cobrado,
    // Lo que falta cobrar y todavía no venció: el resto del saldo.
    porCobrar: Math.max(0, facturado - cobrado - vencido),
    vencido,
    cargos: (rows ?? []).length,
    saldados,
    vencidos,
  };
}
