/**
 * Lógica custom de «Actualizaciones» (ActualizacionesView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`actualizaciones.view.ts`,
 * `use-actualizaciones.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 *
 * Los tres puntos son adaptadores: la cuenta la hace el servidor
 * (`leases.adjustments.overview` / `.detect` / `.apply`) y acá solo se decide cómo
 * contarla. Es la misma detección que corre el cron todas las mañanas, así que el
 * botón y el reloj no pueden dar resultados distintos.
 */

import {
  actions,
  formatDateKey,
  formatMoney,
  plural,
  type CustomHandlers,
} from '@coongro/plugin-sdk';

/** Una actualización con su contrato ya resuelto, como la lista el servidor. */
export interface AdjustmentRow {
  id: string;
  lease_id: string;
  index_code: string;
  status: string;
  effective_date: string;
  previous_rent: string;
  new_rent: string;
  unit?: string | null;
  property?: string | null;
  tenant?: string | null;
}

interface AdjustmentsOverview {
  pendientes: number;
  impacto: number;
  /** Último valor guardado del índice de referencia, para saber si la serie está al día. */
  ultimoIndice?: { value?: string; value_date?: string };
}

interface DetectionResult {
  proposed: number;
  failed: Array<{ label: string; reason: string }>;
}

export const customHandlers: CustomHandlers = {
  loadData: ({ execute }) => execute<AdjustmentRow[]>('leases.adjustments.listDetailed'),

  loadLiveValues: async ({ execute }) => {
    const o = await execute<AdjustmentsOverview>('leases.adjustments.overview');
    const ultimo = o.ultimoIndice;

    return {
      k1: {
        value: String(o.pendientes),
        sub: o.pendientes ? 'esperan tu confirmación' : 'no hay nada pendiente',
      },
      k2: {
        value: o.impacto > 0 ? `+${formatMoney(o.impacto)}` : formatMoney(0),
        sub: o.pendientes ? 'si aplicás todas' : 'sin actualizaciones pendientes',
      },
      k3: {
        // Si nunca se bajó la serie, se dice eso en vez de mostrar un número viejo.
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
  onAction: async (_actionId, { execute, toast, reload }) => {
    const r = await execute<DetectionResult>('leases.adjustments.detect');
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
    // El ajuste y el alquiler del contrato cambian juntos, en el servidor: aplicar uno
    // sin el otro dejaría al sistema facturando el valor viejo.
    await actions.execute('leases.adjustments.apply', { id: row.id });
    toast?.success(
      'Actualización aplicada',
      `El alquiler pasa a ${formatMoney(Number(row.new_rent))} desde el ${row.effective_date}.`
    );
    return;
  }
  await actions.execute('leases.adjustments.cancel', { id: row.id });
  toast?.info('Actualización cancelada', 'El alquiler queda como estaba.');
}
