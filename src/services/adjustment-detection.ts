/**
 * Detección de actualizaciones por aniversario.
 *
 * Un contrato con índice y período pactado (ICL cada 6 meses, por ejemplo) se
 * actualiza cada vez que cumple ese período desde su inicio. Esta lógica dice CUÁLES
 * contratos ya cumplieron y contra qué fecha hay que comparar el índice.
 *
 * Lo que NO hace: aplicar el ajuste. El resultado nace `pending` y una persona lo
 * confirma. Es una decisión deliberada del plan y la misma que toma la fuente:
 * cambiar lo que se le cobra a alguien todos los meses no puede pasar solo.
 */

/** Fecha de calendario `YYYY-MM-DD`. */
export type DateKey = string;

export interface LeaseForAdjustment {
  id: string;
  status: string;
  start_date: DateKey;
  end_date: DateKey;
  termination_date?: DateKey | null;
  rent_amount: string;
  adjustment_index?: string | null;
  adjustment_months?: number | null;
  unit?: string | null;
  property?: string | null;
}

export interface DueAdjustment {
  leaseId: string;
  label: string;
  indexCode: string;
  /** Desde cuándo rige el nuevo alquiler. */
  effectiveDate: DateKey;
  /** Contra qué fecha se compara el índice: el ajuste anterior, o el inicio del contrato. */
  baseDate: DateKey;
  previousRent: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Suma meses a un DateKey. El 31 de un mes cae al último día del mes destino. */
export function addMonths(date: DateKey, months: number): DateKey {
  const [y, m, d] = date.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad(month)}-${pad(Math.min(d, lastDay))}`;
}

/**
 * Fechas de actualización de un contrato hasta `until`, en orden.
 *
 * Se generan a partir del inicio y no del último ajuste aplicado para que un contrato
 * que estuvo meses sin actualizarse muestre TODAS las que le faltan, no solo la
 * próxima: si alguien no lo miró en un año, tiene que ver el año entero.
 */
export function adjustmentDates(lease: LeaseForAdjustment, until: DateKey): DateKey[] {
  const every = Number(lease.adjustment_months ?? 0);
  if (!lease.adjustment_index || lease.adjustment_index === 'fijo' || every <= 0) return [];

  const fin = lease.termination_date ?? lease.end_date;
  const dates: DateKey[] = [];
  for (let n = 1; n <= 240; n += 1) {
    const date = addMonths(lease.start_date, every * n);
    if (date > until || date > fin) break;
    dates.push(date);
  }
  return dates;
}

/**
 * Actualizaciones que un contrato debería tener y todavía no tiene.
 *
 * @param existing fechas de los ajustes ya registrados (pendientes o aplicados): no se
 *   vuelven a proponer, así que correr la detección dos veces no duplica nada.
 */
export function pendingAdjustments({
  lease,
  today,
  existing = [],
}: {
  lease: LeaseForAdjustment;
  today: DateKey;
  existing?: DateKey[];
}): DueAdjustment[] {
  if (lease.status === 'borrador') return [];

  const ya = new Set(existing);
  const label = [lease.property, lease.unit].filter(Boolean).join(' · ') || lease.id;
  const fechas = adjustmentDates(lease, today);

  return fechas
    .filter((f) => !ya.has(f))
    .map((effectiveDate, i) => ({
      leaseId: lease.id,
      label,
      indexCode: String(lease.adjustment_index),
      effectiveDate,
      // La base es el ajuste anterior; para el primero, el inicio del contrato.
      baseDate: i === 0 ? fechaAnterior(fechas, effectiveDate, lease) : fechas[i - 1],
      previousRent: lease.rent_amount,
    }));
}

function fechaAnterior(fechas: DateKey[], actual: DateKey, lease: LeaseForAdjustment): DateKey {
  const idx = fechas.indexOf(actual);
  return idx > 0 ? fechas[idx - 1] : lease.start_date;
}
