/**
 * Cuánto le toca de expensas a una unidad en un período.
 *
 * Así funcionan las expensas de un edificio: el consorcio liquida UN total por mes y
 * cada unidad paga su alícuota —el porcentaje que le corresponde según su superficie,
 * fijado en el reglamento—. No es un monto fijo por contrato: cambia todos los meses.
 *
 * El contrato igual guarda un `expenses_amount`, que es lo que se pactó al firmar. Sirve
 * como estimación mientras el consorcio no liquidó, pero no es la expensa del mes: con
 * inflación, a los seis meses ya no se parece.
 */

/** Período `YYYY-MM`. */
export type PeriodKey = string;

export interface ExpenseSettlement {
  building_id: string;
  period: PeriodKey;
  amount: string;
}

export interface UnitShare {
  building_id?: string | null;
  /** Porcentaje del total del edificio, 0..100. */
  share_pct?: string | null;
  /** Lo pactado en el contrato, como respaldo. */
  expenses_amount?: string | null;
}

export interface ExpenseForPeriod {
  /** Importe a facturar, ya redondeado. `null` = no se cobran expensas. */
  amount: string | null;
  /**
   * De dónde salió el número:
   *  - `liquidacion`: total del consorcio × alícuota de la unidad.
   *  - `contrato`: lo pactado, porque falta la liquidación o la alícuota.
   */
  source: 'liquidacion' | 'contrato';
  /** Cómo se hizo la cuenta, para dejarlo asentado en el cargo. */
  detail: string;
}

const monto = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** `2026-08` → `agosto`, para que el detalle del cargo se lea. */
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

function mesDe(period: PeriodKey): string {
  const m = Number(String(period).slice(5, 7));
  return MESES[m - 1] ?? period;
}

/**
 * Resuelve las expensas de una unidad para el período.
 *
 * Con liquidación del mes y alícuota cargada, reparte. Si falta cualquiera de las dos,
 * cae a lo pactado en el contrato y **lo dice**: el propietario tiene que poder
 * distinguir un importe real de una estimación arrastrada, sobre todo cuando se la
 * reclama a alguien.
 *
 * Se redondea a peso entero por el mismo motivo que el alquiler: los centavos ensucian
 * la cuenta corriente para siempre.
 */
export function expensesForPeriod({
  lease,
  period,
  settlement,
}: {
  lease: UnitShare;
  period: PeriodKey;
  settlement?: ExpenseSettlement | null;
}): ExpenseForPeriod {
  const pactado = monto(lease.expenses_amount);
  const alicuota = monto(lease.share_pct);
  const total = settlement ? monto(settlement.amount) : 0;

  if (settlement && total > 0 && alicuota > 0) {
    const importe = Math.round((total * alicuota) / 100);
    return {
      amount: String(importe),
      source: 'liquidacion',
      detail: `${alicuota}% de $${total} liquidados en ${mesDe(period)}`,
    };
  }

  if (pactado <= 0) return { amount: null, source: 'contrato', detail: '' };

  return {
    amount: String(Math.round(pactado)),
    source: 'contrato',
    detail: settlement
      ? 'estimadas: falta la alícuota de la unidad'
      : 'estimadas según contrato: el consorcio todavía no liquidó el mes',
  };
}
