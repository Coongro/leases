import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { describe, expect, it, vi } from 'vitest';

import { IndexAdjustmentRepository } from './index-adjustment.repository.js';

/**
 * Confirmar una actualización vieja pisa el alquiler vigente.
 *
 * El caso real: una propuesta por índice calculada sobre $580.000 quedó pendiente, el
 * alquiler se acordó a mano en $650.000, y aplicar la propuesta lo hubiera devuelto a la
 * cuenta anterior. La propuesta guarda sobre qué alquiler se calculó; lo único que
 * faltaba era compararlo con el de hoy antes de escribir.
 */
function baseCon({ adjustment, rent }: { adjustment: Record<string, unknown>; rent?: string }) {
  // Primera consulta: la actualización. Segunda: el alquiler vigente del contrato.
  const respuestas = [[adjustment], rent === undefined ? [] : [{ rent_amount: rent }]];
  let llamada = 0;
  const ormQuery = vi.fn(async () => respuestas[llamada++] ?? []);
  return { db: { ormQuery } as unknown as ModuleDatabaseAPI, ormQuery };
}

const pendiente = {
  id: 'adj-1',
  lease_id: 'lease-1',
  status: 'pending',
  previous_rent: '580000',
  new_rent: '676000',
};

describe('aplicar una actualización de alquiler', () => {
  it('se niega si el alquiler cambió desde que se propuso', async () => {
    const { db, ormQuery } = baseCon({ adjustment: pendiente, rent: '650000' });

    await expect(new IndexAdjustmentRepository(db).apply({ id: 'adj-1' })).rejects.toThrow(
      /cambió después de proponerse/
    );
    // Leyó la actualización y el contrato, y no escribió nada.
    expect(ormQuery).toHaveBeenCalledTimes(2);
  });

  it('el mensaje dice los dos montos y qué hacer', async () => {
    const { db } = baseCon({ adjustment: pendiente, rent: '650000' });

    await expect(new IndexAdjustmentRepository(db).apply({ id: 'adj-1' })).rejects.toThrow(
      /580000[\s\S]*650000[\s\S]*volvé a detectar/
    );
  });

  it('aplica cuando el alquiler sigue siendo el que la propuesta asumió', async () => {
    const { db, ormQuery } = baseCon({ adjustment: pendiente, rent: '580000' });

    await new IndexAdjustmentRepository(db).apply({ id: 'adj-1' });

    // Leer la actualización, leer el contrato, escribir el alquiler, marcar aplicada.
    expect(ormQuery).toHaveBeenCalledTimes(4);
  });

  it('una ya aplicada no vuelve a subir el alquiler', async () => {
    const { db, ormQuery } = baseCon({ adjustment: { ...pendiente, status: 'applied' } });

    const r = await new IndexAdjustmentRepository(db).apply({ id: 'adj-1' });

    expect(r).toMatchObject({ status: 'applied' });
    expect(ormQuery).toHaveBeenCalledTimes(1);
  });
});
