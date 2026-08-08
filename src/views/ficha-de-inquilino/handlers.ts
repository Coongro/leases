/**
 * Lógica custom de «Ficha de inquilino» (FichaDeInquilinoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`ficha-de-inquilino.view.ts`,
 * `use-ficha-de-inquilino.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import {
  formatDateKey,
  formatMoney,
  plural,
  type CustomHandlers,
  type LiveValues,
} from '@coongro/plugin-sdk';

/** Antigüedad como la diría una persona: «11 meses», «2 años y 3 meses». */
function antiguedad(desde?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(desde ?? ''));
  if (!m) return '—';
  const hoy = new Date();
  let meses = (hoy.getFullYear() - Number(m[1])) * 12 + (hoy.getMonth() + 1 - Number(m[2]));
  if (hoy.getDate() < Number(m[3])) meses -= 1;
  if (meses < 1) return 'menos de un mes';
  if (meses < 12) return plural(meses, 'mes', 'meses');
  const años = Math.floor(meses / 12);
  const resto = meses % 12;
  return resto === 0
    ? plural(años, 'año', 'años')
    : `${plural(años, 'año', 'años')} y ${plural(resto, 'mes', 'meses')}`;
}

/** Estado del inquilino en la cabecera: lo que importa es si hoy alquila o no. */
function estado(f: { vigente?: unknown; contratos: unknown[] }): {
  badge: string;
  badgeTone: LiveValues['badgeTone'];
} {
  if (f.vigente) return { badge: 'Con contrato vigente', badgeTone: 'success' };
  if (f.contratos.length > 0) return { badge: 'Sin contrato vigente', badgeTone: 'neutral' };
  return { badge: 'Todavía sin contrato', badgeTone: 'outline' };
}

/** Un contrato en la ficha: el que está vigente y los que ya pasaron. */
interface ContratoDeInquilino {
  id: string;
  unit: string | null;
  property: string | null;
  start_date: string;
  end_date: string;
  rent_amount: string;
  state: string;
}

/** La ficha del inquilino, tal como la devuelve `leases.billing.tenantFile`. */
interface FichaInquilino {
  contratos: ContratoDeInquilino[];
  cargos: Array<Record<string, unknown>>;
  vigente?: ContratoDeInquilino;
  desde?: string;
  facturado: number;
  cobrado: number;
  saldo: number;
  impagos: number;
}

export const customHandlers: CustomHandlers = {
  loadLiveValues: async ({ execute, record }) => {
    const id = String(record?.id ?? '');
    if (!id) return {};
    const f = await execute<FichaInquilino>('leases.billing.tenantFile', { tenantId: id });
    const e = estado(f);
    const donde = [f.vigente?.property, f.vigente?.unit].filter(Boolean).join(' · ');
    const doc = String(record?.document ?? '');

    return {
      hdr: {
        name: String(record?.name ?? 'Inquilino'),
        avatar: String(record?.name ?? 'Inquilino'),
        sub: [doc, donde].filter(Boolean).join(' · ') || 'Sin datos de contacto',
        badge: e.badge,
        badgeTone: e.badgeTone,
      },
      k1: {
        value: f.vigente ? formatMoney(Number(f.vigente.rent_amount ?? 0)) : '—',
        sub: donde || 'no alquila ninguna unidad hoy',
      },
      k2: {
        value: formatMoney(f.saldo),
        sub: f.impagos ? plural(f.impagos, 'cargo sin saldar', 'cargos sin saldar') : 'al día',
      },
      k3: {
        value: antiguedad(f.desde),
        sub: f.desde ? `desde el ${formatDateKey(f.desde)}` : 'sin contratos',
      },

      'kv_datos.Documento': { value: doc || '—' },
      'kv_datos.Teléfono': { value: String(record?.phone ?? '') || '—' },
      'kv_datos.Email': { value: String(record?.email ?? '') || '—' },
      'kv_datos.Domicilio': { value: donde || '—' },

      'kv_hist.Contratos firmados': { value: String(f.contratos.length) },
      'kv_hist.Primer contrato': { value: f.desde ? formatDateKey(f.desde) : '—' },
      'kv_hist.Cargos emitidos': { value: String(f.cargos.length) },
      'kv_hist.Total cobrado': { value: formatMoney(f.cobrado) },
    };
  },

  loadDataFor: {
    tbl_contratos: async ({ execute, record }) => {
      const f = await execute<FichaInquilino>('leases.billing.tenantFile', {
        tenantId: String(record?.id ?? ''),
      });
      return f.contratos;
    },
    tbl_cargos: async ({ execute, record }) => {
      const f = await execute<FichaInquilino>('leases.billing.tenantFile', {
        tenantId: String(record?.id ?? ''),
      });
      return f.cargos;
    },
  },
};
