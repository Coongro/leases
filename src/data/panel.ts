import { actions } from '@coongro/plugin-sdk';

import { cargosDelPeriodo, totalesDelPeriodo } from './cargosDelPeriodo.js';

/**
 * Datos del panel: el estado del negocio en una pantalla.
 *
 * Cruza los cuatro plugins del kit —propiedades, contratos, cobranza e índices— y
 * los resume. Todo sale de la misma fuente que cada vista de detalle, así que el
 * panel no puede decir algo distinto de lo que se ve al entrar.
 */

interface UnitRow {
  status?: string;
}
interface LeaseRow {
  id: string;
  state?: string;
  end_date?: string;
  unit?: string | null;
  property?: string | null;
  tenant?: string | null;
}
interface AdjustmentRow {
  status?: string;
  index_code?: string;
  rate_percent?: string | null;
  new_rent?: string;
  lease_id?: string;
}
interface BuildingRow {
  unit_count?: number;
  occupied_count?: number;
}

export interface PanelData {
  propiedades: number;
  unidades: number;
  ocupadas: number;
  vacantes: number;
  ocupacionPct: number;
  contratosActivos: number;
  porVencer: LeaseRow[];
  ajustesPendientes: Array<{ unit: string; index: string; new_rent: string }>;
  facturado: number;
  cobrado: number;
  porCobrar: number;
  vencido: number;
  cargosImpagos: number;
}

/** «ICL · +12,81%» — el índice con su variación, si ya está calculada. */
function etiquetaIndice(code?: string, rate?: string | null): string {
  const base = code ?? '';
  if (rate === null || rate === undefined || rate === '') return base;
  return `${base} · +${String(rate).replace('.', ',')}%`;
}

export async function datosDelPanel(period: string): Promise<PanelData> {
  const [buildings, units, leases, adjustments, cargos] = await Promise.all([
    actions.execute<BuildingRow[]>('properties.buildings.list'),
    actions.execute<UnitRow[]>('properties.units.list'),
    actions.execute<LeaseRow[]>('leases.contracts.list'),
    actions.execute<AdjustmentRow[]>('leases.adjustments.list'),
    cargosDelPeriodo(period),
  ]);

  const unidades = (units ?? []).length;
  const ocupadas = (units ?? []).filter((u) => u.status === 'ocupada').length;
  const activos = (leases ?? []).filter((l) => l.state === 'vigente' || l.state === 'por_vencer');
  const t = totalesDelPeriodo(cargos);

  const porContrato = new Map((leases ?? []).map((l) => [l.id, l]));

  return {
    propiedades: (buildings ?? []).length,
    unidades,
    ocupadas,
    vacantes: unidades - ocupadas,
    // Sin unidades cargadas la ocupación no es 0%: es que todavía no hay nada que medir.
    ocupacionPct: unidades > 0 ? Math.round((ocupadas / unidades) * 100) : 0,
    contratosActivos: activos.length,
    porVencer: (leases ?? [])
      .filter((l) => l.state === 'por_vencer')
      .sort((a, b) => String(a.end_date).localeCompare(String(b.end_date))),
    ajustesPendientes: (adjustments ?? [])
      .filter((a) => a.status === 'pending')
      .map((a) => {
        const l = porContrato.get(String(a.lease_id));
        return {
          unit: [l?.property, l?.unit].filter(Boolean).join(' · ') || '—',
          index: etiquetaIndice(a.index_code, a.rate_percent),
          new_rent: a.new_rent ?? '0',
        };
      }),
    facturado: t.facturado,
    cobrado: t.cobrado,
    porCobrar: t.porCobrar,
    vencido: t.vencido,
    cargosImpagos: t.cargos - t.saldados,
  };
}

/**
 * Serie del año para el gráfico: cobrado contra impago, mes a mes.
 *
 * Pide los 12 meses en paralelo. Es una vista de resumen que se abre una vez al día,
 * no una lista que se recorre — la simplicidad vale más que ahorrar consultas.
 */
export async function serieDelAnio(
  year: number
): Promise<Array<{ label: string; paid: number; unpaid: number }>> {
  const meses = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  const hasta = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;

  const periodos = Array.from(
    { length: hasta },
    (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`
  );
  const resultados = await Promise.all(periodos.map((p) => cargosDelPeriodo(p)));

  return resultados.map((rows, i) => {
    const t = totalesDelPeriodo(rows);
    return { label: meses[i], paid: t.cobrado, unpaid: t.facturado - t.cobrado };
  });
}
