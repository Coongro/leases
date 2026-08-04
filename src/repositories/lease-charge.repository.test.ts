import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { describe, expect, it, vi } from 'vitest';

import { LeaseChargeRepository } from './lease-charge.repository.js';

/** Captura la consulta que se arma, sin llegar a ninguna base. */
function baseEspia() {
  const where = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
  const tx = {
    select: () => ({ from: () => ({ where }) }),
  };
  const db = {
    ormQuery: (fn: (tx: unknown) => unknown) => fn(tx),
  } as unknown as ModuleDatabaseAPI;
  return { db, where };
}

describe('un concepto dado de baja no se lee por id', () => {
  // Sin filtrar `deleted_at`, la lista dejaba de mostrarlo pero cualquiera que
  // lo pidiera por id —una ficha, el Copilot— lo recibía igual y podía seguir
  // operando sobre algo que para el resto del sistema ya no existe.
  it('la consulta filtra por deleted_at', async () => {
    const { db, where } = baseEspia();
    await new LeaseChargeRepository(db).getById({ id: 'charge-1' });
    expect(where).toHaveBeenCalledTimes(1);
    // La condición se inspecciona por las columnas que menciona: serializar el
    // objeto entero de drizzle no se puede (se referencia a sí mismo).
    const columnas = JSON.stringify(where.mock.calls[0][0], (clave, valor) =>
      clave === 'table' ? undefined : valor
    );
    expect(columnas).toContain('deleted_at');
  });
});
