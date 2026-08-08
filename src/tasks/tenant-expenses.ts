/**
 * Barrido diario de los arreglos que quedaron a cargo del inquilino.
 *
 * Cuando se cierra una orden de trabajo pagada por el inquilino, el gasto tiene que
 * terminar en su recibo. El problema es el momento: al cerrarla puede no haber ningún
 * recibo donde ponerlo —el del mes ya se cobró y el siguiente todavía no se emitió—, así
 * que el gasto queda esperando. Sin este barrido, esa espera dura hasta que alguien
 * genere un mes; un arreglo de agosto podría no aparecer nunca si el propietario factura
 * a mano y se olvida.
 *
 * Preguntar todos los días es barato y hace que el gasto entre en cuanto exista un
 * recibo cobrable, sin depender de que nadie se acuerde.
 *
 * Corre a las 8, después de vencimientos (6) y actualizaciones (7): si un contrato se
 * actualizó esa misma mañana, el recibo ya refleja el alquiler nuevo.
 *
 * La lógica vive en el repositorio, que es la misma que corre al generar los cargos del
 * mes. Acá solo se agenda y se deja rastro.
 */

import type { ScheduledTaskHandler } from '@coongro/plugin-sdk';

import { RentBillingRepository } from '../repositories/rent-billing.repository.js';

export const tenantExpenses: ScheduledTaskHandler<'tenant'> = async ({
  logger,
  database,
  tenantId,
}) => {
  const { charged, removed } = await new RentBillingRepository(database).chargeTenantWorkOrders();

  // Solo se deja rastro cuando hubo algo que cobrar: un cron diario que loguea «0
  // gastos» todas las mañanas entierra los días en que sí pasó algo.
  if (charged.length > 0 || removed.length > 0) {
    logger.info('[tenant-expenses] arreglos cargados al inquilino', {
      tenantId,
      cargados: charged.length,
      total: charged.reduce((acc, c) => acc + Number(c.amount), 0),
      retirados: removed.length,
    });
  }
};
