import { actions } from '@coongro/plugin-sdk';

import { calcLateFee } from '../services/late-fee.js';

import type { ChargeRow } from './cargosDelPeriodo.js';
import { lateFeePolicy } from './settings.js';

/**
 * Punitorio por mora: lo que se le propone cobrar a un cargo vencido.
 *
 * Se calcula acá, en el front, porque cruza tres cosas que viven en lugares
 * distintos: el saldo (billing), el porcentaje diario pactado (el contrato) y la
 * política del negocio (settings). Ninguna de las tres es dueña de las otras dos.
 *
 * Nunca se aplica solo. La setting `leases.lateFee.apply` lo dice explícitamente:
 * «propose» calcula y espera confirmación; «off» ni siquiera lo muestra. Un interés
 * que aparece sin aviso en la cuenta de un inquilino es la forma más rápida de
 * romper la relación con alguien que venía pagando.
 */

export interface Punitorio {
  /** Monto propuesto, en pesos enteros. `0` = no corresponde. */
  amount: string;
  /** Explicación para el recibo y para la propuesta («12 días de atraso al 0,5% diario»). */
  detail: string;
  daysLate: number;
}

const hoy = (): string => new Date().toISOString().slice(0, 10);

/**
 * Propone el punitorio de un cargo. Devuelve monto 0 cuando no corresponde —el
 * contrato no pactó punitorio, el cargo está al día o la política lo tiene apagado—
 * para que la vista muestre siempre la misma columna y no baile entre filas.
 */
export function proponerPunitorio(
  cargo: Pick<ChargeRow, 'due_date' | 'balance' | 'status' | 'late_fee_percent'>,
  politica: { graceDays: number; apply: 'propose' | 'off' },
  asOf: string = hoy()
): Punitorio {
  if (politica.apply === 'off' || !cargo.due_date || cargo.status === 'paid') {
    return { amount: '0', detail: '', daysLate: 0 };
  }
  const r = calcLateFee({
    balance: cargo.balance,
    dueDate: cargo.due_date,
    asOf,
    dailyPercent: cargo.late_fee_percent ?? '0',
    graceDays: politica.graceDays,
  });
  return { amount: r.amount, detail: r.detail, daysLate: r.daysLate };
}

/** La política vigente del negocio. La vista la pide una vez y la reparte. */
export async function politicaPunitorios(): Promise<{
  graceDays: number;
  apply: 'propose' | 'off';
}> {
  return lateFeePolicy();
}

/**
 * Suma el punitorio a la cuenta como una línea más.
 *
 * `sourceRef` lleva el día del cálculo: proponer dos veces el mismo día no duplica
 * (la línea ya existe), pero una mora que siguió creciendo se puede volver a cobrar
 * más adelante — que es exactamente lo que pasa cuando alguien no paga en semanas.
 */
export async function cobrarPunitorio({
  accountId,
  amount,
  detail,
  asOf = hoy(),
}: {
  accountId: string;
  amount: string;
  detail: string;
  asOf?: string;
}): Promise<void> {
  await actions.execute('billing.lines.add', {
    accountId,
    description: `Punitorio — ${detail}`,
    quantity: '1',
    unitPrice: amount,
    sourceType: 'late_fee',
    sourceRef: `late_fee:${asOf}`,
  });
}
