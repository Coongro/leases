import { describe, expect, it } from 'vitest';

import { chargeForTenantExpense, type ChargeForExpense } from './tenant-expense.js';

const HOY = '2026-08-02';

const cargo = (over: Partial<ChargeForExpense> & { id: string }): ChargeForExpense => ({
  period_key: '2026-08',
  due_date: '2026-08-10',
  paid: '0',
  ...over,
});

describe('chargeForTenantExpense', () => {
  it('lo suma al recibo del mes si todavía no se cobró', () => {
    const elegido = chargeForTenantExpense([cargo({ id: 'agosto' })], HOY);
    expect(elegido?.id).toBe('agosto');
  });

  it('no toca un recibo ya cobrado: pasa al siguiente', () => {
    const elegido = chargeForTenantExpense(
      [
        cargo({ id: 'agosto', paid: '520000' }),
        cargo({ id: 'septiembre', period_key: '2026-09', due_date: '2026-09-10' }),
      ],
      HOY
    );
    expect(elegido?.id).toBe('septiembre');
  });

  it('un pago parcial también cierra el recibo para nuevos gastos', () => {
    // El inquilino ya puso plata contra ese mes: sumarle una línea le cambia el total
    // de algo que creía a medio saldar.
    const elegido = chargeForTenantExpense(
      [
        cargo({ id: 'agosto', paid: '100000' }),
        cargo({ id: 'septiembre', period_key: '2026-09', due_date: '2026-09-10' }),
      ],
      HOY
    );
    expect(elegido?.id).toBe('septiembre');
  });

  it('no lo suma a un recibo vencido: devengaría punitorio por una deuda de hoy', () => {
    const elegido = chargeForTenantExpense(
      [cargo({ id: 'julio', period_key: '2026-07', due_date: '2026-07-10' })],
      HOY
    );
    expect(elegido).toBeNull();
  });

  it('el que vence hoy todavía sirve: no está en mora', () => {
    const elegido = chargeForTenantExpense([cargo({ id: 'agosto', due_date: HOY })], HOY);
    expect(elegido?.id).toBe('agosto');
  });

  it('elige el más viejo de los que sirven, no el primero de la lista', () => {
    const elegido = chargeForTenantExpense(
      [
        cargo({ id: 'octubre', period_key: '2026-10', due_date: '2026-10-10' }),
        cargo({ id: 'agosto', period_key: '2026-08', due_date: '2026-08-10' }),
        cargo({ id: 'septiembre', period_key: '2026-09', due_date: '2026-09-10' }),
      ],
      HOY
    );
    expect(elegido?.id).toBe('agosto');
  });

  it('un cargo sin vencimiento se acepta: no se puede afirmar que esté en mora', () => {
    const elegido = chargeForTenantExpense([cargo({ id: 'suelto', due_date: null })], HOY);
    expect(elegido?.id).toBe('suelto');
  });

  it('sin ningún recibo cobrable el gasto espera al mes que viene', () => {
    expect(chargeForTenantExpense([], HOY)).toBeNull();
    expect(chargeForTenantExpense([cargo({ id: 'agosto', paid: '520000' })], HOY)).toBeNull();
  });
});
