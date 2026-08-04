import { sql } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * Lo que está por vencer en la cartera: certificados del inmueble, contratos que llegan
 * al fin del plazo y pólizas de caución.
 *
 * Es **estado recalculable**, no bitácora: cada barrido la vuelve a derivar de los datos
 * de origen y una fila se puede marcar como vista. Si alguna vez hace falta registrar qué
 * se le comunicó a una persona, eso va en otra tabla y es inmutable — un respaldo que se
 * recalcula todos los días no respalda nada.
 *
 * Se recalcula con upsert y no borrando todo: `first_seen_at` sobrevive a cada barrido,
 * así se sabe desde cuándo se viene avisando de algo que nadie atendió. Un `delete` +
 * `insert` diario haría que todo pareciera descubierto hoy.
 */
export const expiryAlertTable = pgTable(
  'module_leases_expiry_alerts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /** certificado · contrato · garantia — de dónde salió y a dónde lleva la fila. */
    kind: text('kind').notNull(),
    /** El registro que vence: el certificado, el contrato o la garantía. */
    subject_id: uuid('subject_id').notNull(),
    /** Sub-clase dentro del tipo: «ascensor», «plazo», «seguro_caucion». */
    subtype: text('subtype').notNull(),
    /** vencido · por_vencer. */
    level: text('level').notNull(),
    /** Vencimiento (DateKey `YYYY-MM-DD`). */
    expires_at: text('expires_at').notNull(),
    /** «Ascensor · Belgrano 1240» — qué es, en una línea. */
    label: text('label').notNull(),
    /** «Vence en 12 días». Se guarda redactado para que se lea igual en todos lados. */
    message: text('message').notNull(),
    building_id: uuid('building_id'),
    unit_id: uuid('unit_id'),
    lease_id: uuid('lease_id'),
    /** Desde cuándo se viene avisando de esto. No lo pisa el barrido. */
    first_seen_at: timestamp('first_seen_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
    last_seen_at: timestamp('last_seen_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
    /**
     * Cuándo alguien dijo «ya lo sé». El aviso deja de figurar hasta que cambie la
     * fecha de vencimiento —o sea, hasta que sea un vencimiento nuevo—, porque repetir
     * todos los días algo que ya se atendió es la forma más rápida de que se ignore
     * también lo que importa.
     */
    acknowledged_at: timestamp('acknowledged_at', { mode: 'string' }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
    updated_at: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    // Un aviso por cosa que vence: el barrido actualiza el que ya existe.
    subjectIdx: uniqueIndex('idx_leases_expiry_alerts_subject').on(t.kind, t.subject_id),
    // La lista se lee por urgencia.
    expiresIdx: index('idx_leases_expiry_alerts_expires').on(t.expires_at),
  })
);

export type ExpiryAlertRow = typeof expiryAlertTable.$inferSelect;
export type NewExpiryAlertRow = typeof expiryAlertTable.$inferInsert;
