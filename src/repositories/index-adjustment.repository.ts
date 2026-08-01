import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq } from 'drizzle-orm';

import { indexAdjustmentTable } from '../schema/index-adjustment.js';
import type { IndexAdjustmentRow, NewIndexAdjustmentRow } from '../schema/index-adjustment.js';
import { leaseTable } from '../schema/lease.js';

export class IndexAdjustmentRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<IndexAdjustmentRow[]> {
    return this.db.ormQuery((tx) => tx.select().from(indexAdjustmentTable));
  }

  /**
   * Confirma una actualización: el contrato pasa a valer el monto nuevo.
   *
   * Las dos escrituras van juntas —el ajuste queda `applied` y el alquiler del
   * contrato cambia— porque son la misma decisión: un ajuste aplicado sobre un
   * contrato que sigue con el precio viejo deja al sistema mintiendo, y el próximo
   * cargo se generaría por el monto anterior.
   *
   * Solo aplica lo que está pendiente: reintentar no vuelve a subir el alquiler.
   */
  async apply({ id }: { id: string }): Promise<IndexAdjustmentRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(indexAdjustmentTable).where(eq(indexAdjustmentTable.id, id)).limit(1)
    );
    const adj = rows[0];
    if (!adj) throw new Error('La actualización no existe.');
    if (adj.status !== 'pending') return adj;

    await this.db.ormQuery((tx) =>
      tx
        .update(leaseTable)
        .set({ rent_amount: adj.new_rent } as unknown as Partial<typeof leaseTable.$inferInsert>)
        .where(eq(leaseTable.id, adj.lease_id))
    );

    const updated = await this.db.ormQuery((tx) =>
      tx
        .update(indexAdjustmentTable)
        .set({
          status: 'applied',
          applied_at: new Date().toISOString(),
        } as unknown as Partial<NewIndexAdjustmentRow>)
        .where(eq(indexAdjustmentTable.id, id))
        .returning()
    );
    return updated[0];
  }

  /** Descarta una actualización pendiente. El alquiler queda como estaba. */
  async cancel({ id }: { id: string }): Promise<IndexAdjustmentRow | undefined> {
    const updated = await this.db.ormQuery((tx) =>
      tx
        .update(indexAdjustmentTable)
        .set({ status: 'cancelled' } as unknown as Partial<NewIndexAdjustmentRow>)
        .where(eq(indexAdjustmentTable.id, id))
        .returning()
    );
    return updated[0];
  }

  async getById({ id }: { id: string }): Promise<IndexAdjustmentRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(indexAdjustmentTable).where(eq(indexAdjustmentTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewIndexAdjustmentRow }): Promise<IndexAdjustmentRow[]> {
    return this.db.ormQuery((tx) => tx.insert(indexAdjustmentTable).values(data).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewIndexAdjustmentRow>;
  }): Promise<IndexAdjustmentRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(indexAdjustmentTable).set(data).where(eq(indexAdjustmentTable.id, id)).returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(indexAdjustmentTable).where(eq(indexAdjustmentTable.id, id))
    );
  }
}
