import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { describe, expect, it, vi } from 'vitest';

import { LeaseRepository } from './lease.repository.js';

/**
 * Una base que grita si la tocan: estas comprobaciones tienen que cortar ANTES
 * de llegar a la consulta. Si algo la llama, el test falla solo.
 */
function baseIntocable() {
  const ormQuery = vi.fn(() => {
    throw new Error('no se esperaba tocar la base');
  });
  return { db: { ormQuery } as unknown as ModuleDatabaseAPI, ormQuery };
}

describe('renovar un contrato exige plazo y monto', () => {
  // Sin estas guardas, faltar uno de los dos terminaba en «UNDEFINED_VALUE:
  // Undefined values are not allowed» de la base: un error que no dice cuál
  // falta ni sobre qué operación, en el acto que fija el alquiler del año que
  // viene.
  it('sin fecha de fin, lo dice', async () => {
    const { db, ormQuery } = baseIntocable();
    await expect(
      new LeaseRepository(db).renew({
        id: 'lease-1',
        endDate: undefined as unknown as string,
        rentAmount: '500000.00',
      })
    ).rejects.toThrow(/hasta cuándo/);
    expect(ormQuery).not.toHaveBeenCalled();
  });

  it('sin alquiler, lo dice', async () => {
    const { db, ormQuery } = baseIntocable();
    await expect(
      new LeaseRepository(db).renew({
        id: 'lease-1',
        endDate: '2027-08-31',
        rentAmount: undefined as unknown as string,
      })
    ).rejects.toThrow(/con qué alquiler/);
    expect(ormQuery).not.toHaveBeenCalled();
  });
});

describe('rescindir un contrato exige la fecha', () => {
  it('sin fecha, lo dice', async () => {
    const { db, ormQuery } = baseIntocable();
    await expect(
      new LeaseRepository(db).terminate({
        id: 'lease-1',
        terminationDate: undefined as unknown as string,
      })
    ).rejects.toThrow(/la fecha en que termina/);
    expect(ormQuery).not.toHaveBeenCalled();
  });
});

describe('firmar un contrato exige lo que la tabla no admite vacío', () => {
  // Faltando cualquiera de las tres, la base contestaba «invalid input syntax
  // for type numeric: ""» o un not-null a secas: nada que le diga a quien lo
  // pidió qué le falta, sobre el acto que fija cuánto se cobra por año.
  const completo = {
    unit_id: 'unit-1',
    tenant_contact_id: 'contact-1',
    start_date: '2026-09-01',
    end_date: '2027-08-31',
    rent_amount: '500000.00',
  };

  for (const [campo, esperado] of [
    ['start_date', /desde cuándo/],
    ['end_date', /hasta cuándo/],
    ['rent_amount', /con qué alquiler/],
  ] as const) {
    it(`sin ${campo}, lo dice`, async () => {
      const { db, ormQuery } = baseIntocable();
      await expect(
        new LeaseRepository(db).save({ data: { ...completo, [campo]: '' } })
      ).rejects.toThrow(esperado);
      expect(ormQuery).not.toHaveBeenCalled();
    });
  }
});
