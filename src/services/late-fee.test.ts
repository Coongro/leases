import { describe, expect, it } from 'vitest';

import { calcLateFee, pendingLateFee } from './late-fee.js';

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

/**
 * El barrido del punitorio se corre más de una vez mientras el inquilino no paga: el
 * propio flujo lo espera («mañana, con un día más de mora, vuelve a corresponder»).
 * Cada corrida tiene que cobrar SOLO lo que se devengó desde la anterior.
 */
describe('cobrar el punitorio más de una vez', () => {
  const cargo = { due_date: '2026-08-10', status: 'open', late_fee_percent: '0.5' };
  const politica = { graceDays: 0, apply: 'propose' as const };

  it('la primera vez cobra el acumulado desde el vencimiento', () => {
    const r = pendingLateFee({
      balance: '520000',
      chargedSoFar: 0,
      cargo,
      policy: politica,
      asOf: '2026-08-15',
    });
    // 520.000 × 0,5% × 5 días
    expect(r.amount).toBe('13000');
  });

  it('la segunda cobra la diferencia, no el acumulado sobre el saldo inflado', () => {
    const r = pendingLateFee({
      // El saldo ya trae adentro los $13.000 cobrados el día 5.
      balance: '533000',
      chargedSoFar: 13000,
      cargo,
      policy: politica,
      asOf: '2026-08-20',
    });

    // Diez días sobre la deuda real son $26.000; ya se cobraron $13.000.
    expect(r.amount).toBe('13000');
    // Antes daba 533.000 × 0,5% × 10 = $26.650, un 52 % de más sobre lo que
    // correspondía, y el exceso crecía en cada corrida.
    expect(Number(r.amount) + 13000).toBe(26000);
  });

  it('el mismo día no cobra dos veces', () => {
    const r = pendingLateFee({
      balance: '533000',
      chargedSoFar: 13000,
      cargo,
      policy: politica,
      asOf: '2026-08-15',
    });
    expect(r.amount).toBe('0');
  });

  it('una cuenta cuyo saldo es solo punitorio no vuelve a devengar', () => {
    const r = pendingLateFee({
      balance: '13000',
      chargedSoFar: 13000,
      cargo,
      policy: politica,
      asOf: '2026-08-20',
    });
    expect(r.amount).toBe('0');
  });
});
