/**
 * Cálculo del vencimiento del alquiler.
 *
 * Un contrato vence «el 10» o «el 5º día hábil». La segunda forma es corriente acá y
 * obliga a saber qué días son hábiles: fines de semana y feriados nacionales, que en
 * Argentina incluyen fechas móviles (Carnaval y Viernes Santo dependen de Pascua) y
 * feriados trasladables que el Gobierno fija cada año.
 *
 * Los feriados se resuelven contra la API de ArgentinaDatos y se cachean por año; la
 * lista de acá abajo es el respaldo para cuando la API no responde, porque un cargo
 * no puede dejar de generarse por eso. El respaldo cubre los fijos y los móviles
 * calculables — no los puentes turísticos, que se anuncian por decreto.
 */

/** Fecha de calendario `YYYY-MM-DD`, sin hora ni timezone. */
export type DateKey = string;

const pad = (n: number): string => String(n).padStart(2, '0');

export const toDateKey = (y: number, m: number, d: number): DateKey => `${y}-${pad(m)}-${pad(d)}`;

/**
 * Domingo de Pascua por el algoritmo de Butcher. De ahí salen Carnaval (48 y 47 días
 * antes) y Viernes Santo (2 días antes), que se mueven todos los años.
 */
function easter(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return {
    month: Math.floor((h + l - 7 * m + 114) / 31),
    day: ((h + l - 7 * m + 114) % 31) + 1,
  };
}

/** Suma días a una fecha UTC y devuelve su DateKey (UTC para que no la corra el huso). */
function shift(year: number, month: number, day: number, days: number): DateKey {
  const t = new Date(Date.UTC(year, month - 1, day) + days * 86400000);
  return toDateKey(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/**
 * Feriados nacionales de respaldo. Los inamovibles más los que dependen de Pascua.
 * Faltan los puentes turísticos y los trasladables del año en curso: esos los trae
 * la API, que es la fuente buena.
 */
export function fallbackHolidays(year: number): Set<DateKey> {
  const fijos = [
    [1, 1], // Año Nuevo
    [3, 24], // Memoria por la Verdad y la Justicia
    [4, 2], // Veteranos y Caídos en Malvinas
    [5, 1], // Día del Trabajador
    [5, 25], // Revolución de Mayo
    [6, 20], // Paso a la Inmortalidad de Belgrano
    [7, 9], // Independencia
    [12, 8], // Inmaculada Concepción
    [12, 25], // Navidad
  ].map(([m, d]) => toDateKey(year, m, d));

  const { month, day } = easter(year);
  const moviles = [
    shift(year, month, day, -48), // Carnaval (lunes)
    shift(year, month, day, -47), // Carnaval (martes)
    shift(year, month, day, -2), // Viernes Santo
  ];

  return new Set([...fijos, ...moviles]);
}

const isWeekend = (year: number, month: number, day: number): boolean => {
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dow === 0 || dow === 6;
};

const isBusinessDay = (year: number, month: number, day: number, holidays: Set<DateKey>): boolean =>
  !isWeekend(year, month, day) && !holidays.has(toDateKey(year, month, day));

const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * N-ésimo día hábil del mes. Si el mes no llega a esa cantidad de días hábiles
 * (un «10º día hábil» en un febrero con feriados), cae al último hábil: el
 * vencimiento se corre, pero nunca se sale del mes que se está cobrando.
 */
export function nthBusinessDay(
  year: number,
  month: number,
  nth: number,
  holidays: Set<DateKey>
): DateKey {
  const total = daysInMonth(year, month);
  let count = 0;
  for (let day = 1; day <= total; day++) {
    if (isBusinessDay(year, month, day, holidays)) {
      count += 1;
      if (count === nth) return toDateKey(year, month, day);
    }
  }
  for (let day = total; day >= 1; day--) {
    if (isBusinessDay(year, month, day, holidays)) return toDateKey(year, month, day);
  }
  return toDateKey(year, month, total);
}

/**
 * Vencimiento del alquiler de un período.
 *
 * @param period  `YYYY-MM` del mes que se cobra
 * @param dueDay  día pactado (del mes, o cuál día hábil)
 * @param dueType `fixed` = ese día del mes · `business` = N-ésimo día hábil
 */
export function calcDueDate(
  period: string,
  dueDay: number,
  dueType: 'fixed' | 'business',
  holidays: Set<DateKey>
): DateKey {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) throw new Error(`Período inválido: "${period}" (se esperaba YYYY-MM)`);
  const year = Number(m[1]);
  const month = Number(m[2]);

  if (dueType === 'business') return nthBusinessDay(year, month, dueDay, holidays);

  // Día fijo: un contrato que vence «el 31» vence el 28 en febrero.
  return toDateKey(year, month, Math.min(dueDay, daysInMonth(year, month)));
}
