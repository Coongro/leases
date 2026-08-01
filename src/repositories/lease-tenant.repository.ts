import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq, isNull } from 'drizzle-orm';

import { leaseTenantTable } from '../schema/lease-tenant.js';
import type { LeaseTenantRow, NewLeaseTenantRow } from '../schema/lease-tenant.js';

export class LeaseTenantRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<LeaseTenantRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(leaseTenantTable).where(isNull(leaseTenantTable.deleted_at))
    );
  }

  async getById({ id }: { id: string }): Promise<LeaseTenantRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(leaseTenantTable).where(eq(leaseTenantTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewLeaseTenantRow }): Promise<LeaseTenantRow[]> {
    return this.db.ormQuery((tx) => tx.insert(leaseTenantTable).values(data).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewLeaseTenantRow>;
  }): Promise<LeaseTenantRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(leaseTenantTable).set(data).where(eq(leaseTenantTable.id, id)).returning()
    );
  }

  // Los dos .set() van casteados: drizzle 0.38.x deja fuera de `$inferInsert` las columnas
  // nullable, así que el tipo del update no reconoce `deleted_at` y el typecheck falla.
  async delete({ id }: { id: string }): Promise<LeaseTenantRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(leaseTenantTable)
        .set({
          deleted_at: new Date().toISOString(),
          is_active: false,
        } as unknown as Partial<NewLeaseTenantRow>)
        .where(eq(leaseTenantTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<LeaseTenantRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(leaseTenantTable)
        .set({ deleted_at: null, is_active: true } as unknown as Partial<NewLeaseTenantRow>)
        .where(eq(leaseTenantTable.id, id))
        .returning()
    );
  }
}
