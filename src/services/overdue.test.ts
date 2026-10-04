import { describe, expect, it } from 'vitest';

import { daysOverdue } from './overdue.js';

describe('daysOverdue', () => {
  it('cuenta los días desde el vencimiento', () => {
    expect(daysOverdue({ dueDate: '2026-09-05', balance: '520000', asOf: '2026-09-17' })).toBe(12);
  });

  it('NO descuenta los días de gracia: el vencimiento es un hecho del calendario', () => {
    // La gracia decide si corresponde punitorio (`calcLateFee`), no si la deuda existe.
    // Descontarla acá escondería una deuda real justo los días en que hay que llamar.
    expect(daysOverdue({ dueDate: '2026-09-05', balance: '520000', asOf: '2026-09-07' })).toBe(2);
  });

  it('un cargo saldado no está atrasado aunque haya pagado tarde', () => {
    expect(daysOverdue({ dueDate: '2026-09-05', balance: '0', asOf: '2026-09-30' })).toBeNull();
  });

  it('el día del vencimiento todavía no es atraso', () => {
    expect(
      daysOverdue({ dueDate: '2026-09-05', balance: '520000', asOf: '2026-09-05' })
    ).toBeNull();
  });

  it('un cargo que todavía no venció no tiene atraso', () => {
    expect(
      daysOverdue({ dueDate: '2026-10-05', balance: '520000', asOf: '2026-09-17' })
    ).toBeNull();
  });

  it('sin fecha de vencimiento no se puede afirmar que esté atrasado', () => {
    expect(daysOverdue({ dueDate: null, balance: '520000', asOf: '2026-09-17' })).toBeNull();
  });
});
