/**
 * En qué recibo se le cobra al inquilino un gasto que corrió por cuenta suya.
 *
 * Un arreglo que paga el inquilino —lo que se rompe por uso, el mantenimiento menor—
 * lo gestiona y lo adelanta el propietario, que después se lo recupera sumándolo al
 * recibo. La pregunta que resuelve este archivo es a CUÁL recibo, porque la orden se
 * cierra un día cualquiera del mes y el alquiler se cobra por período.
 *
 * La regla es la de una administración: **el primer recibo que todavía no se cobró**.
 *
 * - Si el cargo del mes en curso sigue impago, el gasto entra ahí. Es donde el inquilino
 *   lo va a buscar y lo paga junto con el alquiler.
 * - Si ese recibo YA se cobró —entero o en parte—, no se toca. Sumarle una línea a algo
 *   que la otra persona dio por cerrado la deja debiendo plata de un mes que creía
 *   saldado; el gasto espera al recibo siguiente.
 * - Si el único recibo impago está VENCIDO, tampoco. El gasto se sumaría a un saldo en
 *   mora y empezaría a devengar el punitorio del contrato desde una fecha anterior a la
 *   del arreglo: le cobraría intereses por una deuda que nació hoy.
 *
 * Cuando ningún cargo existente sirve, devuelve `null` y el gasto queda esperando: lo
 * levanta la generación del mes siguiente, que vuelve a preguntar.
 *
 * (El reparto de qué arreglo le toca a quién no se decide acá: lo fija el contrato, y
 * en el sistema es el campo «Lo paga» de la orden de trabajo.)
 */

/** Fecha de calendario `YYYY-MM-DD`. */
export type DateKey = string;

/** Un cargo del inquilino, con lo poco que hace falta para elegir. */
export interface ChargeForExpense {
  id: string;
  /** «2026-08» — ordena los cargos entre sí. */
  period_key: string;
  due_date?: string | null;
  /** Cuánto se cobró de este cargo. Cualquier cifra > 0 lo deja fuera. */
  paid: string | number;
}

/**
 * Elige el cargo al que sumarle el gasto, o `null` si conviene esperar al siguiente.
 *
 * Los cargos llegan sin orden garantizado, así que se ordenan por período: «el primero»
 * tiene que ser el más viejo de los que sirven, no el primero de la lista.
 */
export function chargeForTenantExpense(
  charges: ChargeForExpense[],
  today: DateKey
): ChargeForExpense | null {
  const candidatos = charges
    .filter((c) => Number(c.paid ?? 0) <= 0)
    // Sin fecha de vencimiento no se puede afirmar que esté en mora; se acepta.
    .filter((c) => !c.due_date || c.due_date >= today)
    .sort((a, b) => a.period_key.localeCompare(b.period_key));

  return candidatos[0] ?? null;
}
