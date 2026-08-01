import { sql } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Los demás firmantes del contrato. El principal está en `leases.tenant_contact_id`;
 * acá van los co-inquilinos, que responden solidariamente y hay que poder contactar.
 */
export const leaseTenantTable = pgTable('module_leases_lease_tenants', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  lease_id: uuid('lease_id').notNull(),
  /** Contacto de `@coongro/contacts`: la persona no se duplica por contrato. */
  contact_id: uuid('contact_id').notNull(),
  /** cotitular · conviviente · fiador solidario. */
  role: text('role'),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  is_active: boolean('is_active').notNull().default(true),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
});

export type LeaseTenantRow = typeof leaseTenantTable.$inferSelect;
export type NewLeaseTenantRow = typeof leaseTenantTable.$inferInsert;
