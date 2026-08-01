/**
 * Qué conceptos extra entran en el cargo de un período.
 *
 * Un concepto (ABL, agua, una bonificación) se factura mientras esté vigente. La
 * vigencia es por período y no por fecha exacta: se cobra el mes entero o no se cobra,
 * igual que el alquiler.
 */

/** Período `YYYY-MM`. */
export type PeriodKey = string;

export interface LeaseCharge {
  id?: string;
  lease_id?: string;
  type: string;
  label: string;
  amount: string;
  /** `1` suma, `-1` resta (descuento). */
  sign?: string | number | null;
  valid_from?: PeriodKey | null;
  valid_to?: PeriodKey | null;
}

export interface ChargeLine {
  description: string;
  subtotal: string;
  sourceType: string;
}

/**
 * ¿Este concepto se factura en este período?
 *
 * Sin `valid_from` se cobra desde siempre; sin `valid_to`, hasta que termine el
 * contrato. Se comparan strings `YYYY-MM`, que ordenan igual que las fechas.
 */
export function appliesInPeriod(charge: LeaseCharge, period: PeriodKey): boolean {
  const desde = String(charge.valid_from ?? '').trim();
  const hasta = String(charge.valid_to ?? '').trim();
  if (desde && period < desde) return false;
  return !(hasta && period > hasta);
}

/** `-1` solo si está explícito; cualquier otra cosa suma. */
function signoDe(charge: LeaseCharge): number {
  return Number(charge.sign) === -1 ? -1 : 1;
}

/**
 * Convierte los conceptos vigentes en líneas del cargo.
 *
 * Un importe en cero no genera línea: ensucia la factura sin decir nada. Un descuento
 * sale con su importe en negativo, así el total de la cuenta lo resta sin que `billing`
 * tenga que saber qué es una bonificación.
 */
export function chargeLinesForPeriod({
  charges,
  period,
}: {
  charges: LeaseCharge[];
  period: PeriodKey;
}): ChargeLine[] {
  return (charges ?? [])
    .filter((c) => appliesInPeriod(c, period))
    .map((c) => {
      const monto = Math.round(Math.abs(Number(c.amount)) * signoDe(c));
      return { charge: c, monto };
    })
    .filter(({ monto }) => Number.isFinite(monto) && monto !== 0)
    .map(({ charge, monto }) => ({
      description: `${charge.label} ${period}`,
      subtotal: String(monto),
      sourceType: String(charge.type || 'otro'),
    }));
}
