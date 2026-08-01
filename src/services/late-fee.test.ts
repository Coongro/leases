import { describe, expect, it } from 'vitest';

import { calcLateFee } from './late-fee.js';

const base = { balance: '520000', dueDate: '2026-08-10', dailyPercent: '0.5' };

describe('punitorio por mora', () => {
  it('no corre el día del vencimiento', () => {
    const r = calcLateFee({ ...base, asOf: '2026-08-10' });
    expect(r.daysLate).toBe(0);
    expect(r.amount).toBe('0');
  });

  it('cobra por día de atraso', () => {
    // 10 días × 0,5% × 520.000 = 26.000
    const r = calcLateFee({ ...base, asOf: '2026-08-20' });
    expect(r.daysLate).toBe(10);
    expect(r.amount).toBe('26000');
    expect(r.detail).toContain('10 días');
  });

  it('los días de gracia no se cobran', () => {
    // Vence el 10, 5 días de gracia: el 14 todavía no hay punitorio.
    expect(calcLateFee({ ...base, asOf: '2026-08-14', graceDays: 5 }).daysLate).toBe(0);
    // El 20 corren 5 días (10 de atraso menos 5 de gracia).
    const r = calcLateFee({ ...base, asOf: '2026-08-20', graceDays: 5 });
    expect(r.daysLate).toBe(5);
    expect(r.amount).toBe('13000');
  });

  it('un pago dentro de la gracia se explica como tal', () => {
    const r = calcLateFee({ ...base, asOf: '2026-08-12', graceDays: 5 });
    expect(r.detail).toContain('gracia');
  });

  it('sin deuda no hay punitorio', () => {
    expect(calcLateFee({ ...base, balance: '0', asOf: '2026-09-01' }).amount).toBe('0');
  });

  it('sin punitorio pactado no se cobra nada', () => {
    const r = calcLateFee({ ...base, dailyPercent: '0', asOf: '2026-09-01' });
    expect(r.amount).toBe('0');
    expect(r.detail).toBe('Sin punitorio');
  });

  it('cruza el mes correctamente', () => {
    // Del 10/08 al 05/09 son 26 días.
    expect(calcLateFee({ ...base, asOf: '2026-09-05' }).daysLate).toBe(26);
  });
});
