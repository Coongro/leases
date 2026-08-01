/**
 * Lógica custom de «Contrato» (ContratoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`contrato.view.ts`,
 * `use-contrato.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';
/** Campos del formulario que describen la garantía y no son columnas del contrato. */
const texto = (v: unknown): string => String(v ?? '').trim();
const numero = (v: unknown): string | null => {
  const s = texto(v);
  return s === '' ? null : s;
};

import { marcarUnidad } from '../../data/ocupacion.js';
import { contractDefaults } from '../../data/settings.js';

export const customHandlers: CustomHandlers = {
  /**
   * Prefill de un contrato nuevo con lo que el propietario configuró: su moneda, su
   * día de vencimiento, su índice. Repetirlo en cada alta es tiempo perdido y una
   * fuente de errores.
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

  /**
   * Firmar un contrato son dos registros, no uno: el contrato y su garantía. Van
   * juntos porque en la realidad se pactan en el mismo acto — pedirle al usuario que
   * cargue la garantía en una segunda pantalla es como quedan los contratos sin
   * respaldo cargado.
   *
   * La garantía es tabla aparte (no columnas del contrato) porque sobrevive a la
   * renovación y porque cada tipo tiene sus propios datos: un seguro de caución
   * tiene póliza y vencimiento; un garante propietario, una escritura.
   */
  onSubmit: async (values, { execute, editingId }) => {
    const lease = {
      unit_id: texto(values.unit_id),
      tenant_contact_id: texto(values.tenant_contact_id),
      // Nace vigente: el borrador es para lo que se guarda a medio cargar, y este
      // formulario exige lo necesario para que el contrato exista.
      status: 'vigente',
      contract_type: texto(values.contract_type),
      start_date: texto(values.start_date),
      end_date: texto(values.end_date),
      rent_amount: texto(values.rent_amount),
      expenses_amount: numero(values.expenses_amount),
      currency: texto(values.currency),
      due_day: Number(values.due_day) || 1,
      due_day_type: texto(values.due_day_type) || 'fixed',
      adjustment_index: texto(values.adjustment_index) || null,
      adjustment_months: Number(values.adjustment_months) || null,
      late_fee_percent: numero(values.late_fee_percent),
      penalty_months: Number(values.penalty_months) || null,
      deposit_amount: numero(values.deposit_amount),
      deposit_status: texto(values.deposit_status) || null,
    };

    if (editingId) {
      await execute('leases.contracts.update', { id: editingId, data: lease });
      await marcarUnidad(lease.unit_id, 'ocupada');
      return;
    }

    const creados = await execute<{ id: string }[]>('leases.contracts.create', { data: lease });
    const leaseId = creados?.[0]?.id;
    // La unidad pasa a estar alquilada: sin esto, la ficha de la propiedad seguiría
    // mostrándola vacante con un contrato vigente encima.
    await marcarUnidad(lease.unit_id, 'ocupada');
    if (!leaseId) return;

    const tipo = texto(values.guarantee_type);
    if (!tipo) return;
    await execute('leases.guarantees.create', {
      data: {
        lease_id: leaseId,
        type: tipo,
        guarantor_contact_id: texto(values.guarantor_contact_id) || null,
        notes: texto(values.guarantee_notes) || null,
        // El depósito en garantía es la garantía misma: se guarda su monto acá
        // además de en el contrato, para que la garantía se explique sola.
        amount: tipo === 'deposito' ? numero(values.deposit_amount) : null,
        archived: false,
      },
    });
  },
};
