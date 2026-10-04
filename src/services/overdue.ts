/**
 * Hace cuánto que un cargo está impago.
 *
 * **No descuenta los días de gracia, a propósito.** Son dos preguntas distintas y cada
 * una tiene su respuesta:
 *
 *  - «¿Está vencido?» es un hecho del calendario: la fecha pasó y la plata no entró.
 *  - «¿Corresponde punitorio?» es una decisión comercial, y ésa sí respeta la gracia
 *    (ver `calcLateFee`).
 *
 * Si el atraso descontara la gracia, la pantalla escondería una deuda real durante esos
 * días: quien entra a Cobranzas lo hace para saber a quién llamar hoy, y la gracia es
 * una promesa de no cobrar interés, no de no mirar.
 */
import type { DateKey } from './due-date.js';

/** Días enteros entre dos fechas de calendario. */
function dayDiff(from: DateKey, to: DateKey): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

/**
 * Días de atraso de un cargo, o `null` si no está atrasado.
 *
 * Devuelve `null` —y no cero— cuando el cargo está al día, saldado o sin fecha de
 * vencimiento: la columna que lo muestra dice «—» en vez de un cero que se lee como
 * «venció hoy», y al ordenar por atraso esas filas no compiten con las que sí deben.
 */
export function daysOverdue({
  dueDate,
  balance,
  asOf,
}: {
  dueDate?: DateKey | null;
  balance: string | number;
  asOf: DateKey;
}): number | null {
  const vence = String(dueDate ?? '').trim();
  if (!vence) return null;
  // Sin saldo no hay atraso: un cargo pagado tarde ya no es algo que haya que reclamar.
  if (!(Number(balance) > 0.005)) return null;
  const dias = dayDiff(vence, asOf);
  return dias > 0 ? dias : null;
}
