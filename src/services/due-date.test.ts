import { describe, expect, it } from 'vitest';

import { calcDueDate, fallbackHolidays, nthBusinessDay, toDateKey } from './due-date.js';

describe('feriados de respaldo', () => {
  it('incluye los inamovibles', () => {
    const f = fallbackHolidays(2026);
    expect(f.has('2026-01-01')).toBe(true); // Año Nuevo
    expect(f.has('2026-05-25')).toBe(true); // Revolución de Mayo
    expect(f.has('2026-07-09')).toBe(true); // Independencia
    expect(f.has('2026-12-25')).toBe(true); // Navidad
  });

  it('calcula los que dependen de Pascua', () => {
    // Pascua 2026: 5 de abril → Viernes Santo 3/4, Carnaval 16 y 17 de febrero.
    const f = fallbackHolidays(2026);
    expect(f.has('2026-04-03')).toBe(true);
    expect(f.has('2026-02-16')).toBe(true);
    expect(f.has('2026-02-17')).toBe(true);
  });

  it('mueve las fechas de Pascua según el año', () => {
    // Pascua 2027: 28 de marzo → Viernes Santo 26/3.
    expect(fallbackHolidays(2027).has('2027-03-26')).toBe(true);
    expect(fallbackHolidays(2027).has('2026-04-03')).toBe(false);
  });
});

describe('día fijo', () => {
  const sinFeriados = new Set<string>();

  it('usa el día pactado', () => {
    expect(calcDueDate('2026-08', 10, 'fixed', sinFeriados)).toBe('2026-08-10');
  });

  it('un contrato que vence «el 31» vence el 28 en febrero', () => {
    expect(calcDueDate('2026-02', 31, 'fixed', sinFeriados)).toBe('2026-02-28');
  });

  it('respeta el 29 en año bisiesto', () => {
    expect(calcDueDate('2028-02', 31, 'fixed', sinFeriados)).toBe('2028-02-29');
  });

  it('no se corre por caer sábado: el día fijo es el día fijo', () => {
    // 2026-08-01 es sábado; con `fixed` el vencimiento no se mueve.
    expect(calcDueDate('2026-08', 1, 'fixed', sinFeriados)).toBe('2026-08-01');
  });
});

describe('día hábil', () => {
  it('saltea el fin de semana', () => {
    // Agosto 2026 arranca sábado 1: el 1º hábil es el lunes 3.
    const f = fallbackHolidays(2026);
    expect(nthBusinessDay(2026, 8, 1, f)).toBe('2026-08-03');
    expect(nthBusinessDay(2026, 8, 5, f)).toBe('2026-08-07');
  });

  it('saltea los feriados', () => {
    // Julio 2026 arranca miércoles. El 9 (jueves) es feriado, así que sin él el 7º
    // hábil sería el 9 y con él se corre al viernes 10. Los hábiles anteriores no
    // se mueven: el 5º sigue siendo el martes 7.
    const f = fallbackHolidays(2026);
    expect(f.has('2026-07-09')).toBe(true);
    expect(nthBusinessDay(2026, 7, 5, f)).toBe('2026-07-07');
    expect(nthBusinessDay(2026, 7, 7, f)).toBe('2026-07-10');
  });

  it('cae al último hábil si el mes no llega a esa cantidad', () => {
    const f = fallbackHolidays(2026);
    const ultimo = nthBusinessDay(2026, 2, 99, f);
    expect(ultimo.startsWith('2026-02')).toBe(true);
    // Febrero 2026 termina sábado 28 → el último hábil es el viernes 27.
    expect(ultimo).toBe('2026-02-27');
  });

  it('calcDueDate delega en el N-ésimo hábil', () => {
    const f = fallbackHolidays(2026);
    expect(calcDueDate('2026-07', 7, 'business', f)).toBe('2026-07-10');
  });
});

describe('período', () => {
  it('rechaza un período mal formado', () => {
    expect(() => calcDueDate('2026', 5, 'fixed', new Set())).toThrow(/Período inválido/);
    expect(() => calcDueDate('2026-13-01', 5, 'fixed', new Set())).toThrow();
  });

  it('toDateKey rellena con ceros', () => {
    expect(toDateKey(2026, 3, 7)).toBe('2026-03-07');
  });
});
