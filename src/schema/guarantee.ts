import { sql } from 'drizzle-orm';
import { boolean, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Garantía del contrato. Los campos aplican según el `type`: un garante propietario
 * usa `guarantor_contact_id` + `property_deed_ref`; un seguro de caución usa
 * compañía, póliza y vencimiento; un depósito usa monto y fecha.
 *
 * `archived` existe porque la garantía sobrevive al contrato: al renovar suele
 * mantenerse la misma, y borrarla perdería el respaldo de los períodos anteriores.
 */
export const guaranteeTable = pgTable('module_leases_guarantees', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  lease_id: uuid('lease_id').notNull(),
  /** garante_propietario · garante_recibo_sueldo · deposito · seguro_caucion (Ley 27.551). */
  type: text('type').notNull(),
  guarantor_contact_id: uuid('guarantor_contact_id'),
  amount: numeric('amount'),
  deposit_date: text('deposit_date'),
  bank_account: text('bank_account'),
  insurance_company: text('insurance_company'),
  policy_number: text('policy_number'),
  /** Vencimiento de la póliza (DateKey): dispara aviso, como los certificados. */
  insurance_expiry: text('insurance_expiry'),
  property_deed_ref: text('property_deed_ref'),
  archived: boolean('archived'),
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

export type GuaranteeRow = typeof guaranteeTable.$inferSelect;
export type NewGuaranteeRow = typeof guaranteeTable.$inferInsert;
