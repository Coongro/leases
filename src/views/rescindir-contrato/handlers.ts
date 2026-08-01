/**
 * Lógica custom de «Rescindir contrato» (RescindirContratoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`rescindir-contrato.view.ts`,
 * `use-rescindir-contrato.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';

import { marcarUnidad } from '../../data/ocupacion.js';
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
    return Promise.resolve({ terminationDate: inicio && inicio > hoy ? inicio : hoy });
  },

  /**
   * Rescinde el contrato. El motivo se guarda junto al detalle porque es lo primero
   * que se pregunta meses después, cuando hay que explicar por qué terminó antes.
   */
  onSubmit: async (values, { execute, record }) => {
    const id = record?.id as string | undefined;
    if (!id) throw new Error('No se sabe qué contrato rescindir.');

    const motivo = MOTIVOS[texto(values.reason)] ?? texto(values.reason);
    const detalle = texto(values.notes);

    await execute('leases.contracts.terminate', {
      id,
      terminationDate: texto(values.terminationDate),
      notes: [motivo, detalle].filter(Boolean).join(' — '),
    });
    // La unidad vuelve a estar disponible.
    await marcarUnidad(String(record?.unit_id ?? ''), 'vacante');
  },
};
