/**
 * Lógica custom de «Actualizaciones» (ActualizacionesView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`actualizaciones.view.ts`,
 * `use-actualizaciones.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import { formatDateKey, formatMoney, plural, type CustomHandlers } from '@coongro/plugin-sdk';
import { actions } from '@coongro/plugin-sdk';

import { aplicarAjuste, detectarAjustes } from '../../data/detectarAjustes.js';
import { impactoMensual, listarAjustes, type AdjustmentRow } from '../../data/listarAjustes.js';

export const customHandlers: CustomHandlers = {
  loadData: () => listarAjustes(),

  loadLiveValues: async ({ execute }) => {
    const rows = await listarAjustes();
    const pendientes = rows.filter((r: AdjustmentRow) => r.status === 'pending');
    const impacto = impactoMensual(rows);

    // Último valor del ICL guardado. Si nunca se bajó la serie todavía, se dice eso
    // en vez de mostrar un número viejo o inventado.
    const ultimo = await execute<{ value?: string; value_date?: string } | undefined>(
      'indices.values.lastValue',
      { indexCode: 'ICL' }
    ).catch(() => undefined);

    return {
      k1: {
        value: String(pendientes.length),
        sub: pendientes.length ? 'esperan tu confirmación' : 'no hay nada pendiente',
      },
      k2: {
        value: impacto > 0 ? `+${formatMoney(impacto)}` : formatMoney(0),
        sub: pendientes.length ? 'si aplicás todas' : 'sin actualizaciones pendientes',
      },
      k3: {
        value: ultimo?.value ? Number(ultimo.value).toFixed(2).replace('.', ',') : '—',
        sub: ultimo?.value_date
          ? `al ${formatDateKey(ultimo.value_date)}`
          : 'todavía sin datos del BCRA',
      },
    };
  },

  /**
   * Busca contratos que cumplieron su período y deja una propuesta por cada uno.
   * No cambia ningún alquiler: eso pasa recién al confirmar, fila por fila.
   */
  onAction: async (_actionId, { toast, reload }) => {
    const r = await detectarAjustes();
    // Lo recién calculado tiene que verse sin recargar la página.
    reload?.();

    if (r.proposed === 0 && r.failed.length === 0) {
      toast?.info('Nada que actualizar', 'Ningún contrato cumplió su período todavía.');
      return;
    }
    if (r.proposed > 0) {
      toast?.success(
        'Actualizaciones calculadas',
        `${plural(r.proposed, 'actualización queda pendiente', 'actualizaciones quedan pendientes')} de tu confirmación.`
      );
    }
    // Los que no se pudieron calcular se dicen: quedarse callado haría creer que
    // esos contratos no necesitaban ajuste.
    if (r.failed.length > 0) {
      toast?.warning(
        'Algunas no se pudieron calcular',
        `${r.failed[0].label}: ${r.failed[0].reason}` +
          (r.failed.length > 1 ? ` (y ${r.failed.length - 1} más)` : '')
      );
    }
  },
};

/** Confirma o descarta una actualización desde los botones de la fila. */
export async function onRowAction(
  accion: 'Aplicar' | 'Cancelar',
  row: AdjustmentRow,
  toast?: { success: (t: string, m: string) => void; info: (t: string, m: string) => void }
): Promise<void> {
  if (row.status !== 'pending') {
    toast?.info('Ya resuelta', 'Esta actualización no está pendiente.');
    return;
  }
  if (accion === 'Aplicar') {
    await aplicarAjuste({ id: row.id, leaseId: row.lease_id, newRent: row.new_rent });
    toast?.success(
      'Actualización aplicada',
      `El alquiler pasa a ${formatMoney(Number(row.new_rent))} desde el ${row.effective_date}.`
    );
    return;
  }
  await actions.execute('leases.adjustments.update', {
    id: row.id,
    data: { status: 'cancelled' },
  });
  toast?.info('Actualización cancelada', 'El alquiler queda como estaba.');
}
