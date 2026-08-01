/**
 * Punitorio por mora.
 *
 * Un cargo vencido y sin pagar genera intereses según lo que pactó el contrato. La
 * fuente tiene el campo pero no el cálculo, así que el diseño es propio y sigue dos
 * reglas del plan:
 *
 * 1. **Días de gracia**: no se cobra punitorio desde el día siguiente al vencimiento.
 *    Un pago que entra el lunes por un vencimiento del sábado no está en mora.
 * 2. **Nunca automático en silencio**: esto propone un monto; alguien lo confirma
 *    antes de que se convierta en deuda. Cobrar intereses sin avisar es la forma más
 *    rápida de romper la relación con un inquilino que paga.
 */

/** Fecha de calendario `YYYY-MM-DD`. */
export type DateKey = string;

export interface LateFeeInput {
  /** Lo que quedó sin pagar. */
  balance: string | number;
  /** Cuándo vencía. */
  dueDate: DateKey;
  /** Día contra el que se calcula (normalmente hoy). */
  asOf: DateKey;
  /** Porcentaje diario pactado (0,5 = medio punto por día). */
  dailyPercent: string | number;
  /** Días de tolerancia antes de que empiece a correr. */
  graceDays?: number;
}

export interface LateFee {
  /** Días de atraso ya descontada la gracia. 0 = no corresponde punitorio. */
  daysLate: number;
  /** Monto del interés, redondeado a peso. */
  amount: string;
  /** Detalle para explicarlo en la propuesta y en el recibo. */
  detail: string;
}

const dayDiff = (from: DateKey, to: DateKey): number => {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

export function calcLateFee({
  balance,
  dueDate,
  asOf,
  dailyPercent,
  graceDays = 0,
}: LateFeeInput): LateFee {
  const saldo = Number(balance);
  const tasa = Number(dailyPercent);

  // Sin deuda o sin punitorio pactado no hay nada que cobrar.
  if (!Number.isFinite(saldo) || saldo <= 0 || !Number.isFinite(tasa) || tasa <= 0) {
    return { daysLate: 0, amount: '0', detail: 'Sin punitorio' };
  }

  const atraso = dayDiff(dueDate, asOf) - graceDays;
  if (atraso <= 0) {
    return {
      daysLate: 0,
      amount: '0',
      detail: graceDays > 0 ? `Dentro de los ${graceDays} días de gracia` : 'Al día',
    };
  }

  const amount = Math.round(saldo * (tasa / 100) * atraso * 100) / 100;
  return {
    daysLate: atraso,
    amount: String(Math.round(amount)),
    detail: `${atraso} día${atraso === 1 ? '' : 's'} de atraso al ${tasa}% diario`,
  };
}
