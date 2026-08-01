/**
 * Barrido diario de vencimientos: certificados del inmueble, contratos que llegan al
 * fin del plazo y pólizas de caución.
 *
 * Por qué existe: el estado «por vencer» ya se calculaba, pero solo lo veía quien
 * entraba a la ficha de esa propiedad. Un certificado de gas que venció en agosto y
 * nadie miró hasta octubre es una multa, y en el peor caso un edificio operando sin
 * habilitación. El dato estaba; lo que faltaba era que fuera a buscar a la persona en
 * vez de esperarla.
 *
 * Corre a las 6, antes que el de actualizaciones: es lo primero que conviene ver al
 * abrir el sistema a la mañana.
 *
 * La detección vive en el repositorio, que es la misma que corre el botón «Revisar
 * vencimientos» de la pantalla. Acá solo se agenda y se deja rastro.
 */

import type { ScheduledTaskHandler } from '@coongro/plugin-sdk';

import { ExpiryAlertRepository } from '../repositories/expiry-alert.repository.js';

export const expiries: ScheduledTaskHandler<'tenant'> = async ({ logger, database, tenantId }) => {
  const r = await new ExpiryAlertRepository(database).scan();

  // Solo se deja rastro cuando algo cambió. Un cron diario que loguea «0 vencimientos»
  // todas las mañanas entierra los días en que sí apareció algo.
  if (r.created > 0 || r.resolved > 0) {
    logger.info('[expiries] vencimientos revisados', {
      tenantId,
      revisados: r.scanned,
      pendientes: r.detected,
      nuevos: r.created,
      resueltos: r.resolved,
    });
  }
};
