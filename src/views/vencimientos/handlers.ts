/**
 * Lógica custom de «Vencimientos» (VencimientosView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`vencimientos.view.ts`,
 * `use-vencimientos.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 *
 * Los tres puntos son adaptadores: el barrido y la cuenta los hace el servidor
 * (`leases.expiries.scan` / `.list` / `.pendingCount`) y acá solo se decide cómo
 * contarlo. Es el mismo barrido que corre solo cada mañana, así que el botón y el
 * reloj no pueden dar resultados distintos.
 */
import { formatDateKey, plural, type CustomHandlers } from '@coongro/plugin-sdk';

/** Un vencimiento abierto, como lo lista el servidor. */
interface ExpiryRow {
  id: string;
  kind: string;
  level: string;
  expires_at: string;
  label: string;
  message: string;
  last_seen_at?: string | null;
}

interface PendingCount {
  vencidos: number;
  porVencer: number;
  /** Cuándo se revisó por última vez: un «0 vencidos» sin fecha no dice nada. */
  lastScan?: string;
}

interface ScanSummary {
  scanned: number;
  detected: number;
  created: number;
  resolved: number;
}

export const customHandlers: CustomHandlers = {
  loadData: ({ execute }) => execute<ExpiryRow[]>('leases.expiries.list'),

  loadLiveValues: async ({ execute }) => {
    const c = await execute<PendingCount>('leases.expiries.pendingCount');
    const ultima = c.lastScan;

    return {
      k1: {
        value: String(c.vencidos),
        sub: c.vencidos ? 'hay que resolverlos ya' : 'nada vencido',
      },
      k2: {
        value: String(c.porVencer),
        sub: c.porVencer ? 'entran en la ventana de aviso' : 'nada en la ventana',
      },
      k3: {
        value: ultima ? formatDateKey(ultima.slice(0, 10)) : '—',
        sub: ultima ? 'se revisa sola cada mañana' : 'todavía sin revisar',
      },
    };
  },

  /**
   * Dos acciones distintas: revisar toda la cartera (el botón de arriba) y decir «ya lo
   * sé» sobre una fila. El acuse saca el aviso de la lista pero no lo borra: si el
   * vencimiento cambia —se renovó y volvió a vencer— el barrido lo reabre solo.
   */
  onAction: async (actionId, { execute, record, toast, reload }) => {
    if (actionId === 'leases.expiries.acknowledge') {
      if (!record?.id) return;
      await execute('leases.expiries.acknowledge', { id: String(record.id) });
      reload?.();
      return;
    }

    const r = await execute<ScanSummary>('leases.expiries.scan');
    reload?.();

    if (r.detected === 0) {
      toast?.success('Todo al día', `Se revisaron ${r.scanned} registros y no vence nada.`);
      return;
    }
    // Se distingue lo nuevo de lo que ya estaba: que el botón "no encuentre nada nuevo"
    // es un resultado válido y hay que poder decirlo.
    const partes = [
      r.created > 0 ? `${plural(r.created, 'aviso nuevo', 'avisos nuevos')}` : '',
      r.resolved > 0 ? `${plural(r.resolved, 'resuelto', 'resueltos')}` : '',
    ].filter(Boolean);
    toast?.info(
      `${plural(r.detected, 'vencimiento pendiente', 'vencimientos pendientes')}`,
      partes.length ? partes.join(' · ') : 'Sin cambios desde la última revisión.'
    );
  },
};
