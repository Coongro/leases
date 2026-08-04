/**
 * Lógica custom de «Panel de alquileres» (DashboardAlquileresFidelidadView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`dashboard-alquileres-fidelidad.view.ts`,
 * `use-dashboard-alquileres-fidelidad.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import { formatMoney, plural, type CustomHandlers } from '@coongro/plugin-sdk';

import { lateFeePolicy } from '../../data/settings.js';

const mesActual = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
let periodo = mesActual();

/** El estado del negocio, tal como lo devuelve `leases.billing.dashboard`. */
interface Panel {
  propiedades: number;
  unidades: number;
  ocupadas: number;
  vacantes: number;
  ocupacionPct: number;
  contratosActivos: number;
  porVencer: Array<{
    unit: string | null;
    property: string | null;
    tenant: string | null;
    end_date: string;
  }>;
  ajustesPendientes: Array<{ unit: string; index: string; new_rent: string }>;
  facturado: number;
  cobrado: number;
  porCobrar: number;
  vencido: number;
  cargosImpagos: number;
}

/** Un mes del gráfico anual, tal como lo devuelve `leases.billing.yearSeries`. */
interface PuntoDelAnio {
  label: string;
  paid: number;
  unpaid: number;
}

/** «en 47 días» / «vence mañana» — el tiempo que queda dicho como lo diría una persona. */
function faltan(dk?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dk ?? ''));
  if (!m) return '';
  const hoy = new Date();
  const dias = Math.round(
    (Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) -
      Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) /
      86400000
  );
  if (dias < 0) return 'ya vencido';
  if (dias === 0) return 'vence hoy';
  if (dias === 1) return 'vence mañana';
  return `en ${dias} días`;
}

/** Qué decir bajo «contratos activos»: el que vence primero, o por qué no hay ninguno. */
function subtituloContratos(
  d: { contratosActivos: number },
  proximo?: { property?: string | null; unit?: string | null; end_date?: string }
): string {
  if (proximo) {
    const donde = [proximo.property, proximo.unit].filter(Boolean).join(' · ');
    return `${donde} ${faltan(proximo.end_date)}`;
  }
  return d.contratosActivos > 0 ? 'ninguno por vencer' : 'sin contratos vigentes';
}

export const customHandlers: CustomHandlers = {
  onPeriodChange: ({ period, reload }) => {
    periodo = period;
    reload();
  },

  loadLiveValues: async ({ execute }) => {
    const politica = await lateFeePolicy();
    const d = await execute<Panel>('leases.billing.dashboard', {
      period: periodo,
      graceDays: politica.graceDays,
      applyLateFee: politica.apply,
    });
    const proximo = d.porVencer[0];

    return {
      k1: {
        value: d.unidades > 0 ? `${d.ocupacionPct}%` : '—',
        sub:
          d.unidades > 0
            ? `${d.ocupadas} de ${plural(d.unidades, 'unidad ocupada', 'unidades ocupadas')}`
            : 'todavía no hay unidades cargadas',
      },
      k2: { value: String(d.contratosActivos), sub: subtituloContratos(d, proximo) },
      k3: {
        value: formatMoney(d.porCobrar + d.vencido),
        sub: d.cargosImpagos
          ? plural(d.cargosImpagos, 'cargo sin saldar', 'cargos sin saldar')
          : 'todo cobrado',
      },
      k4: {
        value: formatMoney(d.vencido),
        sub: d.vencido > 0 ? 'pasó la fecha de pago' : 'sin atrasos',
      },

      'kv_mes.Facturado': { value: formatMoney(d.facturado) },
      'kv_mes.Cobrado': { value: formatMoney(d.cobrado) },
      'kv_mes.Por cobrar': { value: formatMoney(d.porCobrar) },
      'kv_mes.Saldo del mes': { value: formatMoney(d.porCobrar + d.vencido) },

      'kv_cartera.Propiedades': { value: String(d.propiedades) },
      'kv_cartera.Unidades': { value: String(d.unidades) },
      'kv_cartera.Ocupadas': { value: String(d.ocupadas) },
      'kv_cartera.Vacantes': { value: String(d.vacantes) },
    };
  },

  loadDataFor: {
    tbl_venc: async ({ execute }) => {
      const d = await execute<Panel>('leases.billing.dashboard', { period: periodo });
      return d.porVencer.map((l) => ({
        tenant: l.tenant ?? '—',
        unit: [l.property, l.unit].filter(Boolean).join(' · '),
        end_date: l.end_date,
      }));
    },
    tbl_aj: async ({ execute }) => {
      const d = await execute<Panel>('leases.billing.dashboard', { period: periodo });
      return d.ajustesPendientes;
    },
  },

  loadChartFor: {
    // El año, mes a mes: cada barra se parte en lo cobrado y lo que quedó impago.
    chart_anio: async ({ execute }) => {
      const serie = await execute<PuntoDelAnio[]>('leases.billing.yearSeries', {
        year: Number(periodo.slice(0, 4)),
      });
      return serie.map((m) => ({
        label: m.label,
        parts: [
          { key: 'paid', label: 'Cobrado', value: m.paid },
          { key: 'unpaid', label: 'Impago', value: m.unpaid },
        ],
      }));
    },

    // El mes elegido: en qué estado está lo facturado. Los colores son los mismos
    // que usan los indicadores de arriba — el vencido es rojo en toda la vista.
    chart_mes: async ({ execute }) => {
      const d = await execute<Panel>('leases.billing.dashboard', { period: periodo });
      return [
        { label: 'Cobrado', value: d.cobrado, color: 'var(--cg-teal)' },
        { label: 'Por cobrar', value: d.porCobrar, color: 'var(--cg-gold)' },
        { label: 'Vencido', value: d.vencido, color: 'var(--cg-danger)' },
      ];
    },
  },
};
