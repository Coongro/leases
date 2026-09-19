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

import { formatDateKey, formatMoney, plural, type CustomHandlers } from '@coongro/plugin-sdk';

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

/** Lo que informa el servidor sobre la diferencia de una actualización. */
type RetroactiveResult =
  | { status: 'sin_diferencia' }
  | { status: 'no_corresponde'; reason: string }
  | { status: 'propuesta'; periods: string[]; amount: string; label: string; detail: string }
  | { status: 'cobrada'; where: 'recibo' | 'concepto'; periods: string[]; amount: string };

/** Aplicar una actualización devuelve, además, qué pasó con su diferencia. */
interface AplicacionResult {
  applied: true;
  retroactive?: RetroactiveResult;
}

/** Mínimo de un toast, para no acoplar estos avisos al tipo completo del motor. */
type Avisos =
  | {
      success: (t: string, m: string) => void;
      info: (t: string, m: string) => void;
      warning: (t: string, m: string) => void;
    }
  | undefined;

/** Dónde entró la diferencia, dicho como lo diría una persona. */
function donde(where: 'recibo' | 'concepto'): string {
  return where === 'recibo' ? 'en el próximo recibo impago' : 'como concepto del mes que viene';
}

/**
 * Qué pasó al aplicar. La diferencia sin cobrar se avisa con `warning` y con el
 * número: es plata que queda sin reclamar hasta que alguien apriete el otro botón, y
 * un aviso verde haría creer que no quedó nada pendiente.
 */
function contarAplicacion(r: AplicacionResult, toast: Avisos): void {
  const dif = r.retroactive;
  if (dif?.status === 'propuesta') {
    toast?.warning(
      'Actualización aplicada, queda una diferencia',
      `${dif.detail} Son ${formatMoney(Number(dif.amount))} sin cobrar: usá «Cobrar diferencia» en esta misma fila.`
    );
    return;
  }
  if (dif?.status === 'cobrada') {
    toast?.success(
      'Actualización aplicada y diferencia cobrada',
      `${formatMoney(Number(dif.amount))} entraron ${donde(dif.where)}.`
    );
    return;
  }
  toast?.success('Actualización aplicada', 'El alquiler del contrato pasa al valor nuevo.');
}

/** Qué pasó al cobrar la diferencia, incluido el caso de que ya estuviera cobrada. */
function contarDiferencia(r: RetroactiveResult, toast: Avisos): void {
  if (r.status === 'cobrada') {
    toast?.success(
      'Diferencia cobrada',
      `${formatMoney(Number(r.amount))} entraron ${donde(r.where)}.`
    );
    return;
  }
  if (r.status === 'sin_diferencia') {
    toast?.info(
      'No hay diferencia',
      'Esta actualización no dejó meses facturados al alquiler anterior.'
    );
    return;
  }
  toast?.info('No se cobró', r.status === 'no_corresponde' ? r.reason : 'No corresponde.');
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
   * Toda acción de esta vista pasa por acá, y por eso ramifica por `actionId`.
   *
   * Antes ignoraba cuál se había apretado y corría siempre la detección: los botones
   * «Aplicar» y «Cancelar» de cada fila NO hacían nada —el motor delega en este handler
   * cuando existe, así que tampoco ejecutaba la acción por su cuenta— y encima el aviso
   * decía «Actualización aplicada». El alquiler seguía igual y nadie se enteraba.
   */
  onAction: async (actionId, { execute, toast, record, reload }) => {
    const id = String(record?.id ?? '');

    if (actionId === 'leases.billing.applyAdjustment') {
      if (!id) return;
      const r = await execute<AplicacionResult>('leases.billing.applyAdjustment', { id });
      reload?.();
      contarAplicacion(r, toast);
      return;
    }

    if (actionId === 'leases.billing.chargeRetroactive') {
      if (!id) return;
      const r = await execute<RetroactiveResult>('leases.billing.chargeRetroactive', { id });
      reload?.();
      contarDiferencia(r, toast);
      return;
    }

    if (actionId === 'leases.adjustments.cancel') {
      if (!id) return;
      await execute('leases.adjustments.cancel', { id });
      reload?.();
      toast?.info('Actualización descartada', 'El alquiler queda como estaba.');
      return;
    }
    // Lo que queda es el botón de la cabecera: busca contratos que cumplieron su
    // período y deja una propuesta por cada uno. No cambia ningún alquiler.
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
