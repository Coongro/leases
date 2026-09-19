/**
 * Lógica custom de «Rescindir contrato» (RescindirContratoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`rescindir-contrato.view.ts`,
 * `use-rescindir-contrato.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';

import { proposedPenalty } from '../../services/termination-penalty.js';

const texto = (v: unknown): string => String(v ?? '').trim();

const MOTIVOS: Record<string, string> = {
  inquilino: 'El inquilino se fue antes',
  propietario: 'Decisión del propietario',
  mutuo_acuerdo: 'De común acuerdo',
  incumplimiento: 'Por incumplimiento',
};

export const customHandlers: CustomHandlers = {
  /**
   * La fecha arranca en hoy: una rescisión se carga el día que pasa, o pocos días
   * después. Sigue siendo editable — un contrato que terminó la semana pasada se
   * corrige con dos clicks.
   *
   * Con un contrato que todavía no arrancó, «hoy» es anterior a su inicio y el
   * servidor lo rechaza: ahí se ofrece el primer día del contrato, que es la única
   * fecha válida más temprana.
   */
  onInit: ({ record }) => {
    const hoy = new Date().toISOString().slice(0, 10);
    const inicio = texto(record?.start_date);
    // La multa se PROPONE con lo que dice el contrato, y queda a la vista para
    // discutirla. Si el contrato no pactó ninguna, la opción arranca en no cobrar:
    // ofrecer cobrar una multa que nadie firmó sería inventar una deuda.
    const multa = proposedPenalty({
      rent_amount: texto(record?.rent_amount),
      penalty_months: Number(record?.penalty_months ?? 0),
    });
    return Promise.resolve({
      terminationDate: inicio && inicio > hoy ? inicio : hoy,
      penalty: multa ? 'cobrar' : 'eximir',
      penaltyAmount: multa ?? '',
    });
  },

  /**
   * Rescinde el contrato y, si se decidió cobrarla, emite la multa en el mismo acto.
   *
   * El motivo se guarda junto al detalle porque es lo primero que se pregunta meses
   * después, cuando hay que explicar por qué terminó antes.
   */
  onSubmit: async (values, { execute, record }) => {
    const id = record?.id as string | undefined;
    if (!id) throw new Error('No se sabe qué contrato rescindir.');

    const motivo = MOTIVOS[texto(values.reason)] ?? texto(values.reason);
    const detalle = texto(values.termination_detail);
    const cobra = texto(values.penalty) === 'cobrar';

    await execute('leases.billing.terminateLease', {
      id,
      terminationDate: texto(values.terminationDate),
      notes: [motivo, detalle].filter(Boolean).join(' — '),
      penalty: cobra ? 'cobrar' : 'eximir',
      penaltyAmount: cobra ? texto(values.penaltyAmount) : null,
    });
  },
};
