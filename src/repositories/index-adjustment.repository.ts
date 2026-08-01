import { IndexValueRepository } from '@coongro/indices/server';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { desc, eq } from 'drizzle-orm';

import { indexAdjustmentTable } from '../schema/index-adjustment.js';
import type { IndexAdjustmentRow, NewIndexAdjustmentRow } from '../schema/index-adjustment.js';
import { leaseTable } from '../schema/lease.js';
import { pendingAdjustments, type LeaseForAdjustment } from '../services/adjustment-detection.js';

import { LeaseRepository } from './lease.repository.js';

/** Una actualización con el contrato al que pertenece ya resuelto. */
export interface AdjustmentWithLease extends IndexAdjustmentRow {
  unit: string | null;
  property: string | null;
  tenant: string | null;
}

export interface AdjustmentsOverview {
  pendientes: number;
  /** Cuánto sumarían los alquileres por mes si se confirmaran todas las pendientes. */
  impacto: number;
  /** El índice que más contratos usan: el que tiene sentido mostrar arriba. */
  indiceReferencia?: string;
  ultimoIndice?: { value: string; value_date: string };
}

/** El índice por el que ajusta la mayoría de los contratos. `undefined` si ninguno ajusta. */
function indiceMasUsado(
  contratos: Array<{ adjustment_index?: string | null }>
): string | undefined {
  const cuenta = new Map<string, number>();
  for (const l of contratos) {
    const codigo = String(l.adjustment_index ?? '');
    if (!codigo || codigo === 'fijo') continue;
    cuenta.set(codigo, (cuenta.get(codigo) ?? 0) + 1);
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

export interface AdjustmentDetection {
  proposed: number;
  /** Las que no se pudieron calcular, con el motivo: quedarse callado las escondería. */
  failed: Array<{ label: string; reason: string }>;
}

export class IndexAdjustmentRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<IndexAdjustmentRow[]> {
    return this.db.ormQuery((tx) => tx.select().from(indexAdjustmentTable));
  }

  /**
   * Las actualizaciones de UN contrato, de la más reciente a la más vieja.
   *
   * Existe aparte de `list()` porque la ficha de un contrato no tiene por qué traerse
   * las actualizaciones de toda la cartera para quedarse con las suyas.
   */
  async forLease({ leaseId }: { leaseId: string }): Promise<IndexAdjustmentRow[]> {
    if (!leaseId) return [];
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(indexAdjustmentTable)
        .where(eq(indexAdjustmentTable.lease_id, leaseId))
        .orderBy(desc(indexAdjustmentTable.effective_date))
    );
  }

  /**
   * Las actualizaciones con su contrato resuelto (unidad, propiedad, inquilino).
   *
   * El cruce se hace acá y no en la pantalla porque la tabla de ajustes solo guarda el
   * `lease_id`; copiar unidad, propiedad e inquilino en cada ajuste los dejaría viejos
   * el día que la unidad cambie de nombre.
   */
  async listDetailed(): Promise<AdjustmentWithLease[]> {
    const [ajustes, contratos] = await Promise.all([
      this.list(),
      new LeaseRepository(this.db).list(),
    ]);

    const porId = new Map(contratos.map((l) => [l.id, l]));
    return (
      ajustes
        .map((a) => ({
          ...a,
          unit: porId.get(a.lease_id)?.unit ?? null,
          property: porId.get(a.lease_id)?.property ?? null,
          tenant: porId.get(a.lease_id)?.tenant ?? null,
        }))
        // Lo que espera confirmación primero; dentro de cada grupo, lo que rige antes.
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
          return a.effective_date.localeCompare(b.effective_date);
        })
    );
  }

  /**
   * El resumen de arriba de la pantalla: cuántas esperan confirmación, cuánto suman y
   * a qué fecha está la serie del índice que usa la mayoría de los contratos.
   */
  async overview(): Promise<AdjustmentsOverview> {
    const [items, contratos] = await Promise.all([
      this.listDetailed(),
      new LeaseRepository(this.db).list(),
    ]);

    const pendientes = items.filter((a) => a.status === 'pending');

    // El índice de referencia no se configura: es el que más contratos usan. Mostrar
    // uno fijo diría «todavía sin datos» en una cartera que ajusta por otro.
    const referencia = indiceMasUsado(contratos);

    return {
      pendientes: pendientes.length,
      // Cuánto más entraría por mes si se confirmaran todas las pendientes.
      impacto: pendientes.reduce(
        (acc, a) => acc + (Number(a.new_rent) - Number(a.previous_rent)),
        0
      ),
      indiceReferencia: referencia,
      ultimoIndice: referencia
        ? await new IndexValueRepository(this.db).lastValue({ indexCode: referencia })
        : undefined,
    };
  }

  /**
   * Busca contratos que cumplieron su período y deja una propuesta `pending` por cada
   * uno, con el factor ya calculado contra la serie del índice.
   *
   * **No cambia ningún alquiler**: eso pasa recién al confirmar, fila por fila. Y es
   * repetible — lo ya propuesto no se vuelve a proponer.
   *
   * Vive acá y no en la pantalla porque lo corren dos: el botón «Buscar
   * actualizaciones» y el cron diario. Si cada uno tuviera su versión, el día que
   * cambie la regla del aniversario una de las dos quedaría vieja.
   */
  async detect({ today }: { today?: string } = {}): Promise<AdjustmentDetection> {
    const [contratos, registrados] = await Promise.all([
      new LeaseRepository(this.db).list(),
      this.list(),
    ]);
    // El índice es de otro plugin, pero su repositorio se instancia con la MISMA db
    // tenant-scoped: así se reusa `quote()`, que baja la serie del organismo si falta.
    const indices = new IndexValueRepository(this.db);

    // Fechas ya propuestas o aplicadas por contrato: correr esto dos veces en el mismo
    // día no puede dejar dos propuestas para la misma actualización.
    const yaTiene = new Map<string, string[]>();
    for (const a of registrados) {
      const previas = yaTiene.get(a.lease_id) ?? [];
      previas.push(a.effective_date);
      yaTiene.set(a.lease_id, previas);
    }

    const fecha = today ?? new Date().toISOString().slice(0, 10);
    const result: AdjustmentDetection = { proposed: 0, failed: [] };

    for (const lease of contratos as unknown as LeaseForAdjustment[]) {
      for (const p of pendingAdjustments({
        lease,
        today: fecha,
        existing: yaTiene.get(lease.id) ?? [],
      })) {
        try {
          const factor = await indices.quote({
            indexCode: p.indexCode,
            dateFrom: p.baseDate,
            dateTo: p.effectiveDate,
            previousRent: p.previousRent,
          });

          await this.create({
            // Mismo cast que el resto del repositorio: en drizzle 0.38.x las columnas
            // nullables (`base_date`, los dos valores del índice, la tasa) no aparecen
            // en el tipo de inserción y el literal completo no compila.
            data: {
              lease_id: p.leaseId,
              index_code: p.indexCode,
              status: 'pending',
              effective_date: p.effectiveDate,
              base_date: factor.dateFrom,
              index_value_from: String(factor.valueFrom),
              index_value_to: String(factor.valueTo),
              rate_percent: String(factor.ratePercent),
              previous_rent: p.previousRent,
              new_rent: factor.newRent,
            } as unknown as NewIndexAdjustmentRow,
          });
          result.proposed += 1;
        } catch (error) {
          // Un contrato sin índice disponible no frena a los demás: se anota y se
          // reintenta cuando el organismo publique el valor. Proponer un ajuste sin
          // respaldo sería peor que no proponerlo.
          result.failed.push({
            label: `${p.label} · ${p.effectiveDate}`,
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return result;
  }

  /**
   * Confirma una actualización: el contrato pasa a valer el monto nuevo.
   *
   * Las dos escrituras van juntas —el ajuste queda `applied` y el alquiler del
   * contrato cambia— porque son la misma decisión: un ajuste aplicado sobre un
   * contrato que sigue con el precio viejo deja al sistema mintiendo, y el próximo
   * cargo se generaría por el monto anterior.
   *
   * Solo aplica lo que está pendiente: reintentar no vuelve a subir el alquiler.
   */
  async apply({ id }: { id: string }): Promise<IndexAdjustmentRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(indexAdjustmentTable).where(eq(indexAdjustmentTable.id, id)).limit(1)
    );
    const adj = rows[0];
    if (!adj) throw new Error('La actualización no existe.');
    if (adj.status !== 'pending') return adj;

    await this.db.ormQuery((tx) =>
      tx
        .update(leaseTable)
        .set({ rent_amount: adj.new_rent } as unknown as Partial<typeof leaseTable.$inferInsert>)
        .where(eq(leaseTable.id, adj.lease_id))
    );

    const updated = await this.db.ormQuery((tx) =>
      tx
        .update(indexAdjustmentTable)
        .set({
          status: 'applied',
          applied_at: new Date().toISOString(),
        } as unknown as Partial<NewIndexAdjustmentRow>)
        .where(eq(indexAdjustmentTable.id, id))
        .returning()
    );
    return updated[0];
  }

  /** Descarta una actualización pendiente. El alquiler queda como estaba. */
  async cancel({ id }: { id: string }): Promise<IndexAdjustmentRow | undefined> {
    const updated = await this.db.ormQuery((tx) =>
      tx
        .update(indexAdjustmentTable)
        .set({ status: 'cancelled' } as unknown as Partial<NewIndexAdjustmentRow>)
        .where(eq(indexAdjustmentTable.id, id))
        .returning()
    );
    return updated[0];
  }

  async getById({ id }: { id: string }): Promise<IndexAdjustmentRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(indexAdjustmentTable).where(eq(indexAdjustmentTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewIndexAdjustmentRow }): Promise<IndexAdjustmentRow[]> {
    return this.db.ormQuery((tx) => tx.insert(indexAdjustmentTable).values(data).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewIndexAdjustmentRow>;
  }): Promise<IndexAdjustmentRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(indexAdjustmentTable).set(data).where(eq(indexAdjustmentTable.id, id)).returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(indexAdjustmentTable).where(eq(indexAdjustmentTable.id, id))
    );
  }
}
