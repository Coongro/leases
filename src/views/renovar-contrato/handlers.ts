/**
 * Lógica custom de «Renovar contrato» (RenovarContratoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`renovar-contrato.view.ts`,
 * `use-renovar-contrato.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';

import { marcarUnidad } from '../../data/ocupacion.js';
const texto = (v: unknown): string => String(v ?? '').trim();

/** Suma días a un `YYYY-MM-DD`. */
function masDias(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Suma meses a un `YYYY-MM-DD` (el 31 cae al último día del mes destino). */
function masMeses(date: string, months: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth() + 1;
  const ultimo = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(Math.min(d, ultimo))}`;
}

interface ContratoActual {
  end_date?: string;
  rent_amount?: string;
  adjustment_index?: string | null;
  adjustment_months?: number | null;
}

export const customHandlers: CustomHandlers = {
  /**
   * Arranca con lo que se sabe: la renovación empieza el día después de que termina
   * el contrato actual, dura lo mismo que la ley pide como mínimo (3 años) y hereda
   * índice y período. Quien renueva casi siempre cambia solo el monto — pedirle que
   * vuelva a tipear el resto es hacerle repetir datos que el sistema ya tiene.
   */
  onInit: async ({ execute, record }) => {
    const id = record?.id as string | undefined;
    if (!id) return {};

    const c = await execute<ContratoActual | undefined>('leases.contracts.getDetail', {
      id,
    }).catch(() => undefined);
    const fin = texto(c?.end_date ?? record?.end_date);
    if (!fin) return {};

    const desde = masDias(fin, 1);
    return {
      startDate: desde,
      endDate: masMeses(desde, 36),
      rentAmount: texto(c?.rent_amount ?? record?.rent_amount),
      adjustmentIndex: texto(c?.adjustment_index ?? record?.adjustment_index),
      adjustmentMonths: texto(c?.adjustment_months ?? record?.adjustment_months),
    };
  },

  /**
   * Crea el contrato de la renovación. El anterior no se alarga: queda cerrado como
   * `renovado` y encadenado al nuevo, así la unidad conserva su historia de precios.
   */
  onSubmit: async (values, { execute, record }) => {
    const id = record?.id as string | undefined;
    if (!id) throw new Error('No se sabe qué contrato renovar.');

    await execute('leases.contracts.renew', {
      id,
      startDate: texto(values.startDate) || undefined,
      endDate: texto(values.endDate),
      rentAmount: texto(values.rentAmount),
      adjustmentIndex: texto(values.adjustmentIndex) || null,
      adjustmentMonths: Number(values.adjustmentMonths) || null,
      notes: texto(values.notes) || null,
    });
    await marcarUnidad(String(record?.unit_id ?? ''), 'ocupada');
  },
};
