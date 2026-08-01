import { sql } from 'drizzle-orm';
import { index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Una actualización del alquiler por índice.
 *
 * Es una ENTIDAD con ciclo de vida, no un cálculo al vuelo: nace `pending` cuando el
 * contrato cumple su período, y una persona la confirma. Nunca se aplica sola —
 * cambia lo que se le cobra a alguien todos los meses, y eso merece que un humano
 * mire el número antes.
 *
 * Guarda los DOS valores del índice usados, no solo el porcentaje: así, meses después,
 * el inquilino (o un juez) puede rehacer la cuenta y llegar exactamente al mismo
 * monto. Un «subió 15%» sin respaldo no se puede discutir ni defender.
 */
export const indexAdjustmentTable = pgTable(
  'module_leases_index_adjustments',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    lease_id: uuid('lease_id').notNull(),
    /** ICL · IPC · casa_propia · manual (cuando el monto lo fija una persona). */
    index_code: text('index_code').notNull(),
    /** pending (esperando confirmación) · applied · cancelled. */
    status: text('status').notNull(),
    /** Desde qué día rige el nuevo alquiler (DateKey). */
    effective_date: text('effective_date').notNull(),
    /** Fecha contra la que se comparó: el inicio del contrato o el ajuste anterior. */
    base_date: text('base_date'),
    /** Los dos valores de la serie efectivamente usados — el respaldo del cálculo. */
    index_value_from: numeric('index_value_from'),
    index_value_to: numeric('index_value_to'),
    rate_percent: numeric('rate_percent'),
    previous_rent: numeric('previous_rent').notNull(),
    new_rent: numeric('new_rent').notNull(),
    /** Cuándo lo confirmó una persona. Vacío mientras está pendiente. */
    applied_at: timestamp('applied_at', { mode: 'string' }),
    notes: text('notes'),
    created_at: timestamp('created_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
    updated_at: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    // Los ajustes de un contrato (su historial) y los que esperan confirmación.
    leaseIdx: index('idx_adjustments_lease').on(t.lease_id),
    statusIdx: index('idx_adjustments_status').on(t.status),
  })
);

export type IndexAdjustmentRow = typeof indexAdjustmentTable.$inferSelect;
export type NewIndexAdjustmentRow = typeof indexAdjustmentTable.$inferInsert;
