/**
 * Lógica custom de «Contratos» (ContratosView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`contratos.view.ts`,
 * `use-contratos.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';

import { expiryWarningDays } from '../../data/settings.js';

export const customHandlers: CustomHandlers = {
  /**
   * La lista no se cablea con `source`: cuatro de sus columnas (unidad, propiedad,
   * inquilino y el estado del contrato) salen de otras tablas o se calculan contra
   * la fecha de hoy. `leases.contracts.list` las resuelve en una sola consulta.
   */
  loadData: async ({ execute }) => {
    // El horizonte de «por vencer» es una setting: cuántos días antes querés
    // enterarte para negociar la renovación.
    const warningDays = await expiryWarningDays();
    return execute<Record<string, unknown>[]>('leases.contracts.list', { warningDays });
  },
};
