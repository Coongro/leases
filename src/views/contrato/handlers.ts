/**
 * Lógica custom de «Contrato» (ContratoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`contrato.view.ts`,
 * `use-contrato.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 *
 * **`onSubmit` es un adaptador.** Firmar un contrato son tres cosas en el mismo acto
 * —el contrato, su garantía y la unidad que pasa a estar ocupada— y viven juntas en
 * `leases.contracts.save`, dentro de una transacción. Si esa orquestación viviera acá,
 * el Copilot tendría que repetirla; el día que se olvide una parte queda un contrato
 * sin respaldo cargado, o una unidad figurando vacante con alguien viviendo adentro.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';

import { contractDefaults } from '../../data/settings.js';

export const customHandlers: CustomHandlers = {
  /**
   * Prefill de un contrato nuevo con lo que el propietario configuró: su moneda, su
   * día de vencimiento, su índice. Repetirlo en cada alta es tiempo perdido y una
   * fuente de errores.
   *
   * Al editar no se toca nada: los valores son los del contrato firmado, no los
   * defaults de hoy.
   */
  onInit: async ({ editingId }) => {
    if (editingId) return {};
    const d = await contractDefaults();
    return {
      currency: d.currency,
      due_day: String(d.dueDay),
      due_day_type: d.dueDayType,
      adjustment_index: d.adjustmentIndex,
      adjustment_months: d.adjustmentMonths,
      contract_type: 'determinado',
      deposit_status: 'pendiente',
    };
  },

  onSubmit: (values, { execute, editingId }) =>
    execute('leases.contracts.save', { id: editingId, data: values }),
};
