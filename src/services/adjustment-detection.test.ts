import { describe, expect, it } from 'vitest';

import { addMonths, adjustmentDates, pendingAdjustments } from './adjustment-detection.js';

const base = {
  id: 'l1',
  status: 'vigente',
  start_date: '2025-08-01',
  end_date: '2028-07-31',
  rent_amount: '520000',
  adjustment_index: 'ICL',
  adjustment_months: 6,
  unit: '1°B',
  property: 'Belgrano 1240',
};

describe('sumar meses', () => {
  it('avanza el mes', () => {
    expect(addMonths('2025-08-01', 6)).toBe('2026-02-01');
  });

  it('cruza el año', () => {
    expect(addMonths('2025-11-15', 3)).toBe('2026-02-15');
  });

  it('el 31 cae al último día del mes destino', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
  });
});

describe('fechas de actualización', () => {
  it('marca cada período pactado desde el inicio', () => {
    expect(adjustmentDates(base, '2027-01-01')).toEqual(['2026-02-01', '2026-08-01']);
  });

  it('no pasa del fin del contrato', () => {
    const corto = { ...base, end_date: '2026-03-31' };
    expect(adjustmentDates(corto, '2030-01-01')).toEqual(['2026-02-01']);
  });

  it('una rescisión anticipada corta las actualizaciones', () => {
    const rescindido = { ...base, termination_date: '2026-03-01' };
    expect(adjustmentDates(rescindido, '2030-01-01')).toEqual(['2026-02-01']);
  });

  it('un contrato sin índice no se actualiza', () => {
    expect(adjustmentDates({ ...base, adjustment_index: null }, '2030-01-01')).toEqual([]);
    expect(adjustmentDates({ ...base, adjustment_index: 'fijo' }, '2030-01-01')).toEqual([]);
  });

  it('sin período pactado tampoco', () => {
    expect(adjustmentDates({ ...base, adjustment_months: 0 }, '2030-01-01')).toEqual([]);
  });
});

describe('actualizaciones pendientes', () => {
  it('propone la que ya cumplió', () => {
    const r = pendingAdjustments({ lease: base, today: '2026-03-01' });
    expect(r).toHaveLength(1);
    expect(r[0].effectiveDate).toBe('2026-02-01');
    expect(r[0].baseDate).toBe('2025-08-01'); // el inicio del contrato
    expect(r[0].previousRent).toBe('520000');
    expect(r[0].label).toBe('Belgrano 1240 · 1°B');
  });

  it('no propone la que todavía no cumplió', () => {
    expect(pendingAdjustments({ lease: base, today: '2026-01-31' })).toHaveLength(0);
  });

  it('un contrato abandonado muestra TODAS las que le faltan', () => {
    const r = pendingAdjustments({ lease: base, today: '2027-03-01' });
    expect(r.map((x) => x.effectiveDate)).toEqual(['2026-02-01', '2026-08-01', '2027-02-01']);
    // cada una se compara contra la anterior
    expect(r[1].baseDate).toBe('2026-02-01');
    expect(r[2].baseDate).toBe('2026-08-01');
  });

  it('las ya registradas no se vuelven a proponer', () => {
    const r = pendingAdjustments({
      lease: base,
      today: '2027-03-01',
      existing: ['2026-02-01', '2026-08-01'],
    });
    expect(r.map((x) => x.effectiveDate)).toEqual(['2027-02-01']);
  });

  it('un borrador no genera actualizaciones', () => {
    expect(
      pendingAdjustments({ lease: { ...base, status: 'borrador' }, today: '2027-01-01' })
    ).toHaveLength(0);
  });
});
