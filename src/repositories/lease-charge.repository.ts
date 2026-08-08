import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { and, asc, eq, isNull } from 'drizzle-orm';

import { leaseChargeTable } from '../schema/lease-charge.js';
import type { LeaseChargeRow, NewLeaseChargeRow } from '../schema/lease-charge.js';

/**
 * Conceptos recurrentes que se le facturan al inquilino además del alquiler.
 * La vigencia (`valid_from`/`valid_to`) se resuelve al generar el cargo, en
 * `services/lease-charges.ts` — acá solo se guardan y se leen.
 */
export class LeaseChargeRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<LeaseChargeRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(leaseChargeTable)
        .where(isNull(leaseChargeTable.deleted_at))
        .orderBy(asc(leaseChargeTable.label))
    );
  }

  /** Los conceptos de UN contrato — lo que muestra su ficha. */
  async forLease({ leaseId }: { leaseId: string }): Promise<LeaseChargeRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(leaseChargeTable)
        .where(and(eq(leaseChargeTable.lease_id, leaseId), isNull(leaseChargeTable.deleted_at)))
        .orderBy(asc(leaseChargeTable.label))
    );
  }

  /**
   * Un concepto por su id, siempre que siga vigente.
   *
   * El filtro por `deleted_at` no es cosmético: sin él, un concepto dado de baja
   * seguía leyéndose como si nada, así que la lista dejaba de mostrarlo pero
   * quien lo pidiera por id —una ficha, el Copilot— lo recibía igual y podía
   * seguir operando sobre algo que para el resto del sistema ya no existe.
   */
  async getById({ id }: { id: string }): Promise<LeaseChargeRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(leaseChargeTable)
        .where(and(eq(leaseChargeTable.id, id), isNull(leaseChargeTable.deleted_at)))
        .limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewLeaseChargeRow }): Promise<LeaseChargeRow[]> {
    return this.db.ormQuery((tx) => tx.insert(leaseChargeTable).values(data).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewLeaseChargeRow>;
  }): Promise<LeaseChargeRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(leaseChargeTable)
        .set({
          ...data,
          updated_at: new Date().toISOString(),
        } as unknown as Partial<NewLeaseChargeRow>)
        .where(eq(leaseChargeTable.id, id))
        .returning()
    );
  }

  /**
   * Borrado lógico: un concepto que se facturó tiene que seguir explicando esos meses.
   * Para dejar de cobrarlo sin perder la historia, lo correcto es ponerle `valid_to`.
   */
  async delete({ id }: { id: string }): Promise<LeaseChargeRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(leaseChargeTable)
        .set({ deleted_at: new Date().toISOString() } as unknown as Partial<NewLeaseChargeRow>)
        .where(eq(leaseChargeTable.id, id))
        .returning()
    );
  }
}
