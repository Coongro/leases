/**
 * La multa por rescisión anticipada: cuánto es, y dónde se cobra.
 *
 * Desde que el DNU 70/2023 derogó la ley de alquileres, la multa es la que las partes
 * hayan pactado —por eso sale del contrato y no de una tabla legal—. Lo que el sistema
 * aporta es que no se olvide: hasta ahora la rescisión guardaba la fecha y listo, así
 * que la multa se cobraba por fuera o no se cobraba.
 *
 * Nada de esto se cobra solo. La rescisión PROPONE el importe y una persona decide, que
 * es como pasa de verdad: se negocia, se condona por buena relación, o se cobra entera.
 */
import type { DateKey } from './due-date.js';

/** Lo que el contrato pactó y hace falta para calcular la multa. */
export interface LeaseForPenalty {
  rent_amount: string;
  penalty_months?: number | null;
  currency?: string | null;
}

/** Qué hacer con la multa al rescindir. */
export type PenaltyDecision = 'cobrar' | 'eximir';

/**
 * El importe que el contrato prevé: meses pactados × alquiler vigente.
 *
 * Sobre el alquiler VIGENTE y no sobre el inicial: si el contrato se actualizó por
 * índice, la multa de tres meses son tres meses de lo que se paga hoy. Devuelve `null`
 * cuando el contrato no pactó multa, que no es lo mismo que una multa de cero: sin
 * cláusula no hay nada que proponer.
 */
export function proposedPenalty(lease: LeaseForPenalty): string | null {
  const meses = Number(lease.penalty_months ?? 0);
  const alquiler = Number(lease.rent_amount ?? 0);
  if (!Number.isFinite(meses) || meses <= 0) return null;
  if (!Number.isFinite(alquiler) || alquiler <= 0) return null;
  return String(Math.round(meses * alquiler * 100) / 100);
}

/** Cómo se llama la multa en el recibo, con su fundamento a la vista. */
export function penaltyLabel(lease: LeaseForPenalty): string {
  const meses = Number(lease.penalty_months ?? 0);
  if (!Number.isFinite(meses) || meses <= 0) return 'Multa por rescisión anticipada';
  const plural = meses === 1 ? 'mes' : 'meses';
  return `Multa por rescisión anticipada (${meses} ${plural} de alquiler)`;
}

/** El período `YYYY-MM` al que pertenece un día. */
export function periodOf(date: DateKey): string {
  return String(date).slice(0, 7);
}

/**
 * Dónde cae la multa: en el recibo del mes de la rescisión si ya está emitido, o como
 * concepto de ese mismo mes si todavía no.
 *
 * Son dos caminos porque la rescisión puede ocurrir antes o después de que se facture
 * el mes, y ninguno de los dos sirve para el otro caso: agregar una línea a un recibo
 * que no existe no cobra nada, y crear el recibo con sólo la multa haría que la
 * generación del mes lo encuentre hecho y no emita el alquiler. Eligiendo uno solo, la
 * multa se cobra exactamente una vez.
 */
export function penaltyDestination({
  period,
  issuedPeriods,
}: {
  period: string;
  /** Períodos de este contrato que ya tienen recibo emitido. */
  issuedPeriods: string[];
}): 'recibo' | 'concepto' {
  return issuedPeriods.includes(period) ? 'recibo' : 'concepto';
}
