/**
 * La diferencia que queda cuando una actualización se confirma tarde.
 *
 * El kit calcula el ajuste con el último índice publicado a la fecha (la «cláusula de
 * rezago» que usan los contratos reales, porque el IPC del mes sale a mitad del
 * siguiente), así que una actualización SIEMPRE se puede calcular a tiempo. Si igual
 * quedan meses facturados al precio anterior es porque nadie la confirmó, no por el
 * calendario: es un descuido, no la rutina. Por eso lo que sigue se PROPONE y no se
 * cobra solo.
 *
 * Y se cobra en el recibo que viene, nunca tocando los emitidos: un recibo entregado es
 * un documento, y la rendición que el propietario ya firmó no se reescribe.
 */
import type { DateKey } from './due-date.js';

/** El período `YYYY-MM` de una fecha. */
export function periodOf(date: DateKey): string {
  return String(date).slice(0, 7);
}

/**
 * Los períodos que se facturaron al precio anterior pese a que el ajuste ya regía.
 *
 * Cuenta desde el período de la vigencia inclusive: si el ajuste rige el 1/9 y
 * septiembre ya se emitió, septiembre está mal facturado.
 */
export function retroactivePeriods({
  effectiveDate,
  issuedPeriods,
}: {
  effectiveDate: DateKey;
  /** Períodos de ESTE contrato que ya tienen recibo emitido. */
  issuedPeriods: string[];
}): string[] {
  const desde = periodOf(effectiveDate);
  return [...new Set(issuedPeriods)].filter((p) => p >= desde).sort();
}

/**
 * Cuánto se dejó de cobrar en esos períodos.
 *
 * Es la diferencia mensual por la cantidad de meses. No se prorratea el mes de la
 * vigencia: los contratos se ajustan desde el período completo, que es como se factura.
 */
export function retroactiveDifference({
  periods,
  previousRent,
  newRent,
}: {
  periods: string[];
  previousRent: string | number;
  newRent: string | number;
}): string {
  const anterior = Number(previousRent);
  const nuevo = Number(newRent);
  if (!Number.isFinite(anterior) || !Number.isFinite(nuevo)) return '0';
  const porMes = nuevo - anterior;
  if (porMes <= 0 || periods.length === 0) return '0';
  return String(Math.round(porMes * periods.length * 100) / 100);
}

/** «septiembre y octubre de 2026» — para decirlo en el recibo y en la pantalla. */
export function describePeriods(periods: string[]): string {
  const MESES = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const nombres = periods.map((p) => {
    const [y, m] = p.split('-');
    return `${MESES[Number(m) - 1] ?? m} de ${y}`;
  });
  if (nombres.length === 0) return '';
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** Cómo se llama la diferencia en el recibo, con su fundamento a la vista. */
export function retroactiveLabel({
  indexCode,
  periods,
  previousRent,
  newRent,
}: {
  indexCode: string;
  periods: string[];
  previousRent: string | number;
  newRent: string | number;
}): string {
  const meses = describePeriods(periods);
  const de = Math.round(Number(previousRent));
  const a = Math.round(Number(newRent));
  return `Diferencia por actualización ${indexCode} · ${meses} · $${de} → $${a}`;
}

/**
 * Con qué se reconoce el concepto que nació de una actualización.
 *
 * Va en `notes` y no en una columna propia porque `lease_charges` es una tabla
 * compartida con los conceptos que carga la gente a mano: lo que hace falta es poder
 * preguntar «¿esta actualización ya se cobró?», no modelar la relación.
 */
export function adjustmentMark(adjustmentId: string): string {
  return `Diferencia de la actualización ${adjustmentId}.`;
}

/**
 * Si la diferencia de esta actualización ya está cargada como concepto.
 *
 * El camino del recibo es idempotente por `source_ref`, pero un concepto es una fila
 * nueva cada vez: sin esta pregunta, apretar «Cobrar diferencia» dos veces dejaba al
 * inquilino debiendo el doble.
 */
export function alreadyCharged(
  charges: Array<{ notes?: string | null }>,
  adjustmentId: string
): boolean {
  const marca = adjustmentMark(adjustmentId);
  return charges.some((c) => String(c.notes ?? '').includes(marca));
}
