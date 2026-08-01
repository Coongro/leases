import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Bitácora de avisos enviados al inquilino.
 *
 * Registro **inmutable**: solo se inserta. Nunca se edita ni se borra — su valor es
 * justamente poder demostrar qué se comunicó y cuándo. Un registro que se puede
 * cambiar después no sirve como respaldo de nada.
 *
 * Guarda el texto tal como salió (`content_snapshot`) y no una referencia a una
 * plantilla: la plantilla cambia con el tiempo, y lo que importa es qué leyó la
 * persona ese día. Es el reclamo que aparece una y otra vez entre propietarios —
 * sin registro de las comunicaciones no hay cómo sostener una intimación.
 */
export const noticeLogTable = pgTable(
  'module_leases_notice_logs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    lease_id: uuid('lease_id').notNull(),
    /** aviso_vencimiento · aviso_ajuste · intimacion_mora · otro. */
    type: text('type').notNull(),
    /** email · whatsapp · en_persona · carta_documento. */
    channel: text('channel').notNull(),
    /** A qué dirección o número se mandó, tal como estaba ese día. */
    sent_to: text('sent_to'),
    sent_at: timestamp('sent_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
    /** El texto exacto que se envió. */
    content_snapshot: text('content_snapshot').notNull(),
    created_at: timestamp('created_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    // El historial de un contrato, del más reciente al más viejo.
    leaseIdx: index('idx_notice_logs_lease').on(t.lease_id, t.sent_at),
  })
);

export type NoticeLogRow = typeof noticeLogTable.$inferSelect;
export type NewNoticeLogRow = typeof noticeLogTable.$inferInsert;
