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
 *
 * La detección en sí vive en el repositorio: es la misma que corre el botón «Buscar
 * actualizaciones» de la pantalla. Acá solo se la agenda y se deja rastro.
 */

import type { ScheduledTaskHandler } from '@coongro/plugin-sdk';

import { IndexAdjustmentRepository } from '../repositories/index-adjustment.repository.js';

export const adjustments: ScheduledTaskHandler<'tenant'> = async ({
  logger,
  database,
  tenantId,
}) => {
  const { proposed, failed } = await new IndexAdjustmentRepository(database).detect();

  for (const f of failed) {
    logger.warn('[adjustments] no se pudo cotizar una actualización', {
      tenantId,
      actualizacion: f.label,
      reason: f.reason,
    });
  }

  // Solo se deja rastro cuando hubo algo que hacer: un cron diario que loguea «0
  // actualizaciones» todas las mañanas entierra los días en que sí pasó algo.
  if (proposed > 0 || failed.length > 0) {
    logger.info('[adjustments] actualizaciones detectadas', {
      tenantId,
      propuestas: proposed,
      sinIndice: failed.length,
    });
  }
};
