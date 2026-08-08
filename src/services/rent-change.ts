/**
 * La suba de alquiler que se pacta a mano, fuera del índice.
 *
 * No todo cambio de precio nace de una serie del BCRA: un propietario y su inquilino
 * pueden acordar un monto nuevo en una charla, y en un contrato «fijo» esa es la única
 * forma en que el alquiler se mueve. Cuando eso pasa, el monto se corrige editando el
 * contrato.
 *
 * El problema de corregirlo y nada más es que el contrato pasa a decir un número que no
 * coincide con ninguno de los cargos ya emitidos, y no queda registro de desde cuándo
 * rige ni de cuánto se pagaba antes. Seis meses después nadie puede reconstruir por qué
 * el alquiler de mayo era uno y el de junio otro. Por eso una suba pactada se anota en
 * el MISMO historial que las actualizaciones por índice, con `index_code = 'manual'`:
 * la ficha del contrato muestra una sola línea de tiempo del precio, venga de donde
 * venga.
 *
 * Nace `applied` y no `pending`: a diferencia de la propuesta del cron —que existe
 * justamente para que alguien la mire antes de que cambie nada—, acá el cambio YA lo
 * decidió una persona al escribir el monto nuevo. Pedirle que confirme lo que acaba de
 * confirmar sería ruido.
 */

/** Fecha de calendario `YYYY-MM-DD`. */
export type DateKey = string;

export interface RentChangeInput {
  /** Lo que valía el alquiler antes de la edición. */
  previousRent: string | number | null | undefined;
  /** Lo que vale después. */
  newRent: string | number | null | undefined;
  /** Desde cuándo rige. Normalmente hoy: editar el contrato cambia lo que se factura ya. */
  effectiveDate: DateKey;
}

export interface RentChange {
  previousRent: string;
  newRent: string;
  effectiveDate: DateKey;
  /** Cuánto subió (o bajó) en porcentaje, con dos decimales. Es el dato que se lee. */
  ratePercent: string;
  /** «$400.000 → $467.295 (+16,82%)», para explicar la fila sin hacer la cuenta. */
  detail: string;
}

const money = (n: number): string => new Intl.NumberFormat('es-AR').format(Math.round(n));

/**
 * Describe el cambio de precio de una edición, o `null` si no hay ninguno que anotar.
 *
 * Devuelve `null` —y no una fila con variación cero— en los tres casos en que registrar
 * ensuciaría el historial sin agregar información: cuando el monto no cambió, cuando el
 * contrato recién nace (no hay «antes» contra qué comparar) y cuando alguno de los dos
 * valores no es un número utilizable.
 *
 * Compara numéricamente a propósito: PostgreSQL devuelve los `numeric` con los decimales
 * puestos, así que guardar «520000» y volver a guardar «520000» llega acá como
 * `'520000.00'` vs `'520000'`. Comparar los textos anotaría una suba del 0% cada vez que
 * alguien abre el formulario y guarda sin tocar nada.
 */
export function describeRentChange({
  previousRent,
  newRent,
  effectiveDate,
}: RentChangeInput): RentChange | null {
  const antes = Number(previousRent);
  const despues = Number(newRent);

  if (!Number.isFinite(antes) || !Number.isFinite(despues)) return null;
  // Los dos tienen que ser un alquiler de verdad. `Number('')` es 0, no `NaN`: sin este
  // corte, un monto que llega vacío —el Copilot mandando el campo en blanco— se anotaría
  // como una baja del 100% antes de que la base rechace el guardado. Y un contrato recién
  // creado no tiene precio anterior: figuraría subiendo desde cero.
  if (antes <= 0 || despues <= 0) return null;
  if (antes === despues) return null;

  const variacion = ((despues - antes) / antes) * 100;
  const signo = variacion >= 0 ? '+' : '';
  const porcentaje = variacion.toFixed(2);

  return {
    previousRent: String(antes),
    newRent: String(despues),
    effectiveDate,
    ratePercent: porcentaje,
    detail: `$${money(antes)} → $${money(despues)} (${signo}${porcentaje.replace('.', ',')}%)`,
  };
}
