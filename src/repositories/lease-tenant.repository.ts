import { contactTable } from '@coongro/contacts/server';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { and, eq, isNull, ne } from 'drizzle-orm';

import { leaseTenantTable } from '../schema/lease-tenant.js';
import type { LeaseTenantRow, NewLeaseTenantRow } from '../schema/lease-tenant.js';
import { leaseTable } from '../schema/lease.js';

/** Estados en los que ya no tiene sentido sumar a alguien que firma. */
const CERRADOS = new Set(['rescindido', 'vencido', 'renovado']);

/** Un co-firmante como se lo muestra: con nombre, no con el id del contacto. */
export interface CoTenantRow {
  id: string;
  contact_id: string;
  name: string | null;
  role: string | null;
  notes: string | null;
}

export class LeaseTenantRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<LeaseTenantRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(leaseTenantTable).where(isNull(leaseTenantTable.deleted_at))
    );
  }

  /**
   * Los co-firmantes de UN contrato, con el nombre de cada uno.
   *
   * La lista cruda devuelve `contact_id` y nada más, que en pantalla es un UUID y en
   * boca de un agente no es nadie. El nombre vive en `contacts` y se trae por join:
   * duplicarlo acá lo dejaría viejo en cuanto alguien corrija la persona.
   */
  async forLease({ leaseId }: { leaseId: string }): Promise<CoTenantRow[]> {
    const filas: CoTenantRow[] = await this.db.ormQuery((tx) =>
      tx
        .select({
          id: leaseTenantTable.id,
          contact_id: leaseTenantTable.contact_id,
          name: contactTable.name,
          role: leaseTenantTable.role,
          notes: leaseTenantTable.notes,
        })
        .from(leaseTenantTable)
        .leftJoin(contactTable, eq(contactTable.id, leaseTenantTable.contact_id))
        .where(and(eq(leaseTenantTable.lease_id, leaseId), isNull(leaseTenantTable.deleted_at)))
    );
    return filas;
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

  /**
   * Suma o corrige a alguien que firma el contrato junto al inquilino principal.
   *
   * Es la operación de negocio del recurso: el CRUD crudo no se publica porque un
   * insert suelto acepta cualquier par (contrato, contacto) y las tres cosas que lo
   * hacen inválido no las mira nadie. Acá sí:
   *
   * - el contrato tiene que existir y estar abierto — sumar un firmante a uno
   *   rescindido o vencido no cambia quién respondió por él mientras corría;
   * - el principal no puede figurar además como co-firmante: aparecería dos veces en
   *   la lista de responsables y contado dos veces en cualquier reclamo;
   * - la misma persona no puede estar dos veces en el mismo contrato.
   *
   * Se puede llamar sin `id` (alta) o con `id` (corrección del vínculo o la nota).
   * No toca al contacto: la persona vive en `contacts` y se edita allá.
   */
  async save({
    id,
    leaseId,
    contactId,
    role,
    notes,
  }: {
    id?: string;
    leaseId: string;
    contactId: string;
    role?: string;
    notes?: string;
  }): Promise<{ id: string; created: boolean }> {
    const [contrato] = await this.db.ormQuery((tx) =>
      tx
        .select({
          id: leaseTable.id,
          status: leaseTable.status,
          principal: leaseTable.tenant_contact_id,
        })
        .from(leaseTable)
        .where(and(eq(leaseTable.id, leaseId), isNull(leaseTable.deleted_at)))
        .limit(1)
    );

    if (!contrato) throw new Error('No existe ese contrato.');
    if (CERRADOS.has(String(contrato.status))) {
      throw new Error(
        `El contrato está ${contrato.status}: no se le pueden sumar firmantes. Si el vínculo hay que dejarlo registrado, corresponde al contrato que estaba vigente.`
      );
    }
    if (String(contrato.principal) === contactId) {
      throw new Error(
        'Esa persona ya es el inquilino principal del contrato: no hace falta sumarla otra vez como co-firmante.'
      );
    }

    // El duplicado se busca entre los vigentes y excluyendo al que se está editando:
    // guardar un co-firmante sin tocarle el contacto no puede chocar consigo mismo.
    const [repetido] = await this.db.ormQuery((tx) =>
      tx
        .select({ id: leaseTenantTable.id })
        .from(leaseTenantTable)
        .where(
          and(
            eq(leaseTenantTable.lease_id, leaseId),
            eq(leaseTenantTable.contact_id, contactId),
            isNull(leaseTenantTable.deleted_at),
            ...(id ? [ne(leaseTenantTable.id, id)] : [])
          )
        )
        .limit(1)
    );

    if (repetido) throw new Error('Esa persona ya figura como co-firmante de este contrato.');

    const valores = {
      lease_id: leaseId,
      contact_id: contactId,
      role: role || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const [fila] = await this.db.ormQuery((tx) =>
        tx
          .update(leaseTenantTable)
          .set(valores as unknown as Partial<NewLeaseTenantRow>)
          .where(eq(leaseTenantTable.id, id))
          .returning()
      );
      if (!fila) throw new Error('No existe ese co-firmante.');
      return { id: String(fila.id), created: false };
    }

    const [fila] = await this.db.ormQuery((tx) =>
      tx
        .insert(leaseTenantTable)
        .values(valores as unknown as NewLeaseTenantRow)
        .returning()
    );
    if (!fila) throw new Error('No se pudo registrar el co-firmante.');
    return { id: String(fila.id), created: true };
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
