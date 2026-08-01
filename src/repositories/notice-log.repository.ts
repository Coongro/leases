import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq } from 'drizzle-orm';

import { noticeLogTable } from '../schema/notice-log.js';
import type { NoticeLogRow, NewNoticeLogRow } from '../schema/notice-log.js';

/**
 * Solo lectura y alta. NO hay `update` ni `delete` a propósito: la bitácora es la
 * prueba de qué se comunicó, y una prueba editable no prueba nada. Si un aviso salió
 * mal, se registra otro que lo corrija — la historia queda completa.
 */
export class NoticeLogRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<NoticeLogRow[]> {
    return this.db.ormQuery((tx) => tx.select().from(noticeLogTable));
  }

  async getById({ id }: { id: string }): Promise<NoticeLogRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(noticeLogTable).where(eq(noticeLogTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewNoticeLogRow }): Promise<NoticeLogRow[]> {
    return this.db.ormQuery((tx) => tx.insert(noticeLogTable).values(data).returning());
  }
}
