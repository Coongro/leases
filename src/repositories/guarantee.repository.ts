import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq, isNull } from 'drizzle-orm';

import { guaranteeTable } from '../schema/guarantee.js';
import type { GuaranteeRow, NewGuaranteeRow } from '../schema/guarantee.js';

export class GuaranteeRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<GuaranteeRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(guaranteeTable).where(isNull(guaranteeTable.deleted_at))
    );
  }

  async getById({ id }: { id: string }): Promise<GuaranteeRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(guaranteeTable).where(eq(guaranteeTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewGuaranteeRow }): Promise<GuaranteeRow[]> {
    return this.db.ormQuery((tx) => tx.insert(guaranteeTable).values(data).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewGuaranteeRow>;
  }): Promise<GuaranteeRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(guaranteeTable).set(data).where(eq(guaranteeTable.id, id)).returning()
    );
  }

  // Los dos .set() van casteados: drizzle 0.38.x deja fuera de `$inferInsert` las columnas
  // nullable, así que el tipo del update no reconoce `deleted_at` y el typecheck falla.
  async delete({ id }: { id: string }): Promise<GuaranteeRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(guaranteeTable)
        .set({
          deleted_at: new Date().toISOString(),
          is_active: false,
        } as unknown as Partial<NewGuaranteeRow>)
        .where(eq(guaranteeTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<GuaranteeRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(guaranteeTable)
        .set({ deleted_at: null, is_active: true } as unknown as Partial<NewGuaranteeRow>)
        .where(eq(guaranteeTable.id, id))
        .returning()
    );
  }
}
