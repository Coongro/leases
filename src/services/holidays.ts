import { fallbackHolidays, type DateKey } from './due-date.js';

/**
 * Feriados nacionales argentinos, para el vencimiento en día hábil.
 *
 * Salen de ArgentinaDatos (`api.argentinadatos.com/v1/feriados/{año}`), que trae también
 * los puentes turísticos —esos se fijan por decreto cada año y no hay forma de
 * calcularlos—. Se cachean por año en memoria: la lista de un año no cambia una vez
 * publicada, y generar los cargos de un mes no puede depender de una API de terceros.
 *
 * Si la API no responde se usa la lista de respaldo (fijos + los que dependen de
 * Pascua). El vencimiento puede quedar un día corrido respecto del real en un año con
 * puentes, pero los cargos se generan igual — que es lo que no puede fallar.
 */

const API = 'https://api.argentinadatos.com/v1/feriados';
const TIMEOUT_MS = 5000;

interface Feriado {
  fecha?: string;
}

const cache = new Map<number, Set<DateKey>>();

export function clearHolidayCache(): void {
  cache.clear();
}

export async function getHolidays(
  year: number,
  logger?: { warn: (msg: string, meta?: unknown) => void }
): Promise<Set<DateKey>> {
  const cached = cache.get(year);
  if (cached) return cached;

  let feriados: Set<DateKey>;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(`${API}/${year}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as Feriado[];
    const fechas = Array.isArray(data)
      ? data.map((f) => String(f?.fecha ?? '')).filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f))
      : [];
    // Una respuesta vacía o con otra forma no es una lista válida de feriados: se
    // prefiere el respaldo antes que tratar el año entero como días hábiles.
    if (fechas.length === 0) throw new Error('respuesta sin feriados');
    feriados = new Set(fechas);
  } catch (err) {
    logger?.warn('No se pudieron traer los feriados; se usa la lista de respaldo', {
      year,
      error: err instanceof Error ? err.message : String(err),
    });
    feriados = fallbackHolidays(year);
  }

  cache.set(year, feriados);
  return feriados;
}
