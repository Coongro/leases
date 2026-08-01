import { sql } from 'drizzle-orm';
import { boolean, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Conceptos que se le facturan al inquilino todos los meses, además del alquiler.
 *
 * En un alquiler argentino el inquilino suele pagar, aparte del alquiler, el ABL o
 * inmobiliario provincial, el agua, a veces la luz de espacios comunes. Sin esto, el
 * propietario los cobra por fuera del sistema y la cuenta corriente miente.
 *
 * La fuente (LocaCentral) guarda una lista parecida en el contrato, pero con dos
 * problemas que acá se evitan:
 *
 *  - **El tipo se elige, no se adivina.** Allá lo deducen del título con `includes()`
 *    («si dice iptu es iptu»), así que «Impuesto municipal» cae en «otro» sin que nadie
 *    se entere, y «Luz de emergencia del palier» se clasifica como servicio de luz.
 *  - **Los conceptos se dan de baja, no se borran.** Con `valid_from`/`valid_to` un
 *    concepto deja de facturarse conservando el registro de por qué se cobró seis meses.
 *
 * Un descuento es un concepto más, con `sign: -1`: así la bonificación queda en la misma
 * lista y con la misma vigencia que el resto, en vez de ser un mecanismo aparte.
 */
export const leaseChargeTable = pgTable(
  'module_leases_lease_charges',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    lease_id: uuid('lease_id').notNull(),
    /** expensas · abl · servicio · descuento · otro (el alquiler es del contrato). */
    type: text('type').notNull(),
    /** Cómo se llama en la factura: «ABL», «Aguas Santafesinas», «Bonificación». */
    label: text('label').notNull(),
    amount: numeric('amount').notNull(),
    /**
     * `1` suma al total, `-1` lo resta. Un descuento es un concepto con signo negativo
     * y no un campo aparte del contrato: se lo da de baja igual que a cualquier otro.
     */
    sign: numeric('sign').notNull().default('1'),
    /** Desde qué período se factura (`YYYY-MM`). Vacío = desde que arranca el contrato. */
    valid_from: text('valid_from'),
    /** Último período que se factura. Vacío = mientras dure el contrato. */
    valid_to: text('valid_to'),
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
    leaseIdx: index('idx_lease_charges_lease').on(t.lease_id),
  })
);

export type LeaseChargeRow = typeof leaseChargeTable.$inferSelect;
export type NewLeaseChargeRow = typeof leaseChargeTable.$inferInsert;
