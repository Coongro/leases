import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Contrato de alquiler: el vínculo entre una unidad y quien la alquila.
 *
 * El precio vive acá y NO cambia con cada actualización por índice: cada ajuste es
 * un registro propio con su período de vigencia (F4). Así queda auditable por qué
 * cambió el alquiler y cuándo, en vez de pisar el número y perder la historia.
 *
 * Lo que se cobra tampoco vive acá: los cargos y su cobranza son de `billing`.
 * Este plugin dice cuánto y cuándo hay que cobrar; billing registra si se cobró.
 */
export const leaseTable = pgTable(
  'module_leases_leases',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    unit_id: uuid('unit_id').notNull(),
    /** Inquilino principal — un contacto de `@coongro/contacts`. Los demás firmantes van en `lease_tenants`. */
    tenant_contact_id: uuid('tenant_contact_id').notNull(),
    /** borrador · vigente · por_vencer · vencido · rescindido · renovado */
    status: text('status').notNull(),
    /** determinado (con fecha de fin) o indeterminado. */
    contract_type: text('contract_type').notNull(),
    /** Fechas de calendario (DateKey `YYYY-MM-DD`): un contrato empieza un día, no un instante. */
    start_date: text('start_date').notNull(),
    end_date: text('end_date').notNull(),
    /** Si se rescindió antes de tiempo, el día en que terminó de verdad. */
    termination_date: text('termination_date'),
    rent_amount: numeric('rent_amount').notNull(),
    /**
     * Expensas que paga el inquilino además del alquiler. Van aparte del precio
     * porque no se actualizan por el índice del contrato: las fija el consorcio.
     */
    expenses_amount: numeric('expenses_amount'),
    /** ARS o USD: el contrato bimoneda es corriente acá y ninguna de las fuentes lo contempla. */
    currency: text('currency').notNull(),
    /** Día de vencimiento del alquiler. */
    due_day: integer('due_day').notNull(),
    /** `fixed` = ese día del mes; `business` = el N-ésimo día hábil (feriados incluidos). */
    due_day_type: text('due_day_type').notNull(),
    /** ICL · IPC · CasaPropia · manual. Vacío = el precio no se actualiza solo. */
    adjustment_index: text('adjustment_index'),
    /** Cada cuántos meses se actualiza (la Ley 27.551 dejó de fijarlo: hoy se pacta). */
    adjustment_months: integer('adjustment_months'),
    /** Meses de alquiler que se cobran como multa si el inquilino se va antes. */
    penalty_months: integer('penalty_months'),
    /** Comisión de administración. Nullable: el propietario particular no cobra ninguna. */
    admin_fee_percent: numeric('admin_fee_percent'),
    late_fee_percent: numeric('late_fee_percent'),
    deposit_amount: numeric('deposit_amount'),
    /**
     * pendiente · recibido · parcial · devuelto · retenido_alquiler · retenido_reparaciones.
     * La devolución del depósito es un evento real del final del contrato y casi
     * siempre motivo de conflicto: merece estado propio, no un booleano.
     */
    deposit_status: text('deposit_status'),
    /** Renovación: apunta al contrato anterior. Encadena la historia de la unidad. */
    renewed_from_lease_id: uuid('renewed_from_lease_id'),
    notes: text('notes'),
    created_at: timestamp('created_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
    updated_at: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
    is_active: boolean('is_active').notNull().default(true),
    deleted_at: timestamp('deleted_at', { mode: 'string' }),
  },
  (t) => ({
    // Las tres lecturas de siempre: el contrato de una unidad, los de un inquilino,
    // y los que vencen pronto (el aviso de renovación barre por fecha de fin).
    unitIdx: index('idx_leases_unit').on(t.unit_id),
    tenantIdx: index('idx_leases_tenant').on(t.tenant_contact_id),
    endDateIdx: index('idx_leases_end_date').on(t.end_date),
    statusIdx: index('idx_leases_status').on(t.status),
  })
);

export type LeaseRow = typeof leaseTable.$inferSelect;
export type NewLeaseRow = typeof leaseTable.$inferInsert;
