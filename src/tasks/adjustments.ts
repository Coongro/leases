/**
 * Detecta contratos que cumplieron su período de actualización y deja una propuesta
 * pendiente con el factor del índice ya calculado.
 *
 * **No cambia ningún alquiler.** La propuesta nace `pending` y una persona la confirma
 * desde Actualizaciones. Es la regla transversal del kit: lo que toca plata se propone,
 * no se aplica solo.
 *
 * Por qué existe: sin esto, la actualización sucede únicamente si alguien entra a la
 * vista y aprieta el botón. Un contrato que cumplió su aniversario en agosto y nadie
 * miró hasta octubre se sigue facturando al valor viejo, y esa plata no se recupera.
 *
 * La plataforma resuelve el alcance declarado en el manifest y evita que el
 * handler tenga que enumerar tenants o construir nombres de schema.
 */

import { IndexValueRepository } from '@coongro/indices/server';
import type { ScheduledTaskHandler } from '@coongro/plugin-sdk';

import { IndexAdjustmentRepository } from '../repositories/index-adjustment.repository.js';
import { LeaseRepository } from '../repositories/lease.repository.js';
import type { NewIndexAdjustmentRow } from '../schema/index-adjustment.js';
import { pendingAdjustments, type LeaseForAdjustment } from '../services/adjustment-detection.js';

const hoy = (): string => new Date().toISOString().slice(0, 10);

export const adjustments: ScheduledTaskHandler<'tenant'> = async ({
  logger,
  database,
  tenantId,
}) => {
  const contratos = new LeaseRepository(database);
  const ajustes = new IndexAdjustmentRepository(database);
  // El índice es de otro plugin, pero su repositorio se instancia con la MISMA db
  // tenant-scoped. Así el cron reusa `quote()`, que baja la serie del BCRA si falta,
  // en vez de tener una segunda versión de esa integración acá.
  const indices = new IndexValueRepository(database);

  const [todos, registrados] = await Promise.all([contratos.list(), ajustes.list()]);

  // Fechas ya propuestas o aplicadas por contrato: correr el cron dos veces en el
  // mismo día no puede dejar dos propuestas para la misma actualización.
  const yaTiene = new Map<string, string[]>();
  for (const a of registrados) {
    const previas = yaTiene.get(a.lease_id) ?? [];
    previas.push(a.effective_date);
    yaTiene.set(a.lease_id, previas);
  }

  const today = hoy();
  let propuestas = 0;
  let sinIndice = 0;

  for (const lease of todos as unknown as LeaseForAdjustment[]) {
    for (const p of pendingAdjustments({
      lease,
      today,
      existing: yaTiene.get(lease.id) ?? [],
    })) {
      try {
        const factor = await indices.quote({
          indexCode: p.indexCode,
          dateFrom: p.baseDate,
          dateTo: p.effectiveDate,
          previousRent: p.previousRent,
        });

        await ajustes.create({
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
        propuestas += 1;
      } catch (error) {
        // Un contrato sin índice disponible no frena a los demás: se anota y se vuelve
        // a intentar mañana, cuando el organismo haya publicado el valor. Proponer un
        // ajuste sin respaldo sería peor que no proponerlo.
        sinIndice += 1;
        logger.warn('[adjustments] no se pudo cotizar una actualización', {
          tenantId,
          leaseId: p.leaseId,
          effectiveDate: p.effectiveDate,
          indexCode: p.indexCode,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // Solo se deja rastro cuando hubo algo que hacer: un cron diario que loguea «0
  // actualizaciones» todas las mañanas entierra los días en que sí pasó algo.
  if (propuestas > 0 || sinIndice > 0) {
    logger.info('[adjustments] actualizaciones detectadas', {
      tenantId,
      propuestas,
      sinIndice,
    });
  }
};
