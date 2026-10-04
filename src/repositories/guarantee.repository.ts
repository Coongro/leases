import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { and, eq, isNull } from 'drizzle-orm';

import { guaranteeTable } from '../schema/guarantee.js';
import type { GuaranteeRow, NewGuaranteeRow } from '../schema/guarantee.js';

export class GuaranteeRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<GuaranteeRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(guaranteeTable).where(isNull(guaranteeTable.deleted_at))
    );
  }

  /**
   * Las garantías de UN contrato, la vigente primero.
   *
   * Existía la lectura de todas y la de una por id, pero no la de «las de este
   * contrato», que es la pregunta que se hace cualquier pantalla parada en un contrato.
   * Sin esto, editar un contrato no podía mostrar la garantía que ya tenía cargada: el
   * formulario la pedía como obligatoria y no tenía de dónde sacarla.
   *
   * Las archivadas van al final y no se ocultan: al renovar, la garantía anterior queda
   * archivada y sigue siendo el respaldo de los períodos que ya pasaron.
   */
  async forLease({ leaseId }: { leaseId: string }): Promise<GuaranteeRow[]> {
    const filas = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(guaranteeTable)
        .where(and(eq(guaranteeTable.lease_id, leaseId), isNull(guaranteeTable.deleted_at)))
    );
    return [...filas].sort((a, b) => Number(a.archived ?? false) - Number(b.archived ?? false));
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
