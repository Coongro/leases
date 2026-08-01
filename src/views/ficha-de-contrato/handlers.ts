/**
 * Lógica custom de «Ficha de contrato» (FichaDeContratoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`ficha-de-contrato.view.ts`,
 * `use-ficha-de-contrato.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import {
  formatDateKey,
  formatMoney,
  type CustomHandlers,
  type LiveValues,
} from '@coongro/plugin-sdk';
/** El contrato, como viene dentro de la ficha. */
interface LeaseDetail {
  unit?: string | null;
  property?: string | null;
  tenant?: string | null;
  state?: string;
  start_date?: string;
  end_date?: string;
  rent_amount?: string;
  expenses_amount?: string | null;
  currency?: string;
  due_day?: number;
  due_day_type?: string;
  adjustment_index?: string | null;
  adjustment_months?: number | null;
  late_fee_percent?: string | null;
  penalty_months?: number | null;
  deposit_amount?: string | null;
  deposit_status?: string | null;
}

interface AdjustmentOfLease {
  index_code: string;
  status: string;
  effective_date: string;
  rate_percent?: string | null;
  previous_rent: string;
  new_rent: string;
}

interface GuaranteeRow {
  type?: string;
  notes?: string | null;
  guarantor_contact_id?: string | null;
}

/** La ficha completa, tal como la devuelve `leases.billing.contractFile`. */
interface FichaContrato {
  contrato: LeaseDetail;
  garantia?: GuaranteeRow;
  cargos: Array<Record<string, unknown>>;
  saldo: number;
  impagos: number;
}

/** El contrato puede estar pactado en dólares: la moneda viaja con el monto. */
const monto = (v: unknown, moneda?: string) => formatMoney(v, moneda === 'USD' ? 'USD' : 'ARS');

/** Cuánto falta para una fecha, en palabras: «2 años», «8 meses», «12 días». */
function faltaPara(dk?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dk ?? ''));
  if (!m) return '—';
  const fin = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const hoy = new Date();
  const desde = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.round((fin - desde) / 86400000);
  if (dias < 0) return 'Terminado';
  if (dias < 31) return `${dias} día${dias === 1 ? '' : 's'}`;
  const meses = Math.round(dias / 30.4);
  if (meses < 24) return `${meses} mes${meses === 1 ? '' : 'es'}`;
  return `${Math.floor(meses / 12)} años`;
}

const TIPO_GARANTIA: Record<string, string> = {
  garante_propietario: 'Garante propietario',
  garante_recibo_sueldo: 'Garante con recibo de sueldo',
  deposito: 'Depósito en garantía',
  seguro_caucion: 'Seguro de caución',
};
const ESTADO_DEPOSITO: Record<string, string> = {
  pendiente: 'Pendiente',
  recibido: 'Recibido',
  parcial: 'Recibido parcial',
  devuelto: 'Devuelto',
  retenido_alquiler: 'Retenido por alquileres',
  retenido_reparaciones: 'Retenido por reparaciones',
};
/**
 * Etiqueta y color de cada estado. Son EXACTAMENTE los mismos que usa la lista de
 * contratos: el mismo contrato tiene que verse igual en los dos lados — si en la
 * lista está en gris y al entrar aparece en verde, uno de los dos está mintiendo.
 */
const ESTADO_CONTRATO: Record<string, { label: string; tone: LiveValues['badgeTone'] }> = {
  borrador: { label: 'Borrador', tone: 'neutral' },
  por_comenzar: { label: 'Por comenzar', tone: 'neutral' },
  vigente: { label: 'Vigente', tone: 'success' },
  por_vencer: { label: 'Por vencer', tone: 'warning' },
  terminado: { label: 'Terminado', tone: 'outline' },
  renovado: { label: 'Renovado', tone: 'outline' },
  rescindido: { label: 'Rescindido', tone: 'outline' },
};

export const customHandlers: CustomHandlers = {
  loadLiveValues: async ({ execute, record }) => {
    const id = record?.id as string | undefined;
    if (!id) return {};
    const f = await execute<FichaContrato | undefined>('leases.billing.contractFile', {
      leaseId: id,
    });
    if (!f) return {};
    const { contrato: c, garantia: g, cargos, saldo, impagos } = f;

    const indice = c.adjustment_index && c.adjustment_index !== 'fijo' ? c.adjustment_index : null;
    const cadaMeses = Number(c.adjustment_months ?? 0);

    return {
      hdr: {
        name: [c.property, c.unit].filter(Boolean).join(' · ') || 'Contrato',
        sub: [c.tenant, `del ${formatDateKey(c.start_date)} al ${formatDateKey(c.end_date)}`]
          .filter(Boolean)
          .join(' · '),
        badge: ESTADO_CONTRATO[c.state ?? '']?.label ?? 'Contrato',
        badgeTone: ESTADO_CONTRATO[c.state ?? '']?.tone ?? 'neutral',
        avatar: c.unit ?? 'Contrato',
      },
      k1: {
        value: monto(c.rent_amount, c.currency),
        sub: c.currency === 'USD' ? 'en dólares' : 'en pesos',
      },
      k2: {
        // La fecha exacta del próximo ajuste la calcula el plugin de índices (F4);
        // hasta entonces se dice lo que el contrato pactó, que ya es información.
        value: indice ? `Cada ${cadaMeses} meses` : 'Sin ajuste',
        sub: indice ? `Por ${indice}` : 'El precio no se actualiza solo',
      },
      k3: {
        // El saldo sale de los cargos reales de este contrato, no de la tabla de
        // contratos: la plata la lleva billing y ésta es la misma cuenta que se ve
        // en Cobranzas.
        value: monto(saldo, c.currency),
        sub: impagos
          ? `${impagos} cargo${impagos === 1 ? '' : 's'} sin saldar`
          : cargos.length
            ? 'al día'
            : 'sin cargos generados',
      },
      k4: { value: faltaPara(c.end_date), sub: formatDateKey(c.end_date) },

      'kv_cond.Moneda': { value: c.currency === 'USD' ? 'Dólares (USD)' : 'Pesos (ARS)' },
      'kv_cond.Alquiler inicial': { value: monto(c.rent_amount, c.currency) },
      'kv_cond.Expensas': {
        value: c.expenses_amount ? monto(c.expenses_amount, c.currency) : 'No corresponde',
      },
      'kv_cond.Vence el': {
        value:
          c.due_day_type === 'business' ? `${c.due_day}° día hábil` : `${c.due_day} de cada mes`,
      },
      'kv_cond.Punitorio': {
        value: c.late_fee_percent ? `${c.late_fee_percent}% diario` : 'Sin punitorio',
      },
      'kv_cond.Multa rescisión': {
        value: c.penalty_months
          ? `${c.penalty_months} ${Number(c.penalty_months) === 1 ? 'mes' : 'meses'} de alquiler`
          : 'Sin multa',
      },

      'kv_gar.Tipo': { value: TIPO_GARANTIA[g?.type ?? ''] ?? 'Sin garantía cargada' },
      'kv_gar.Garante': { value: g?.notes ?? '—' },
      'kv_gar.Depósito': {
        value: c.deposit_amount ? monto(c.deposit_amount, c.currency) : 'Sin depósito',
      },
      'kv_gar.Estado': {
        value:
          ESTADO_DEPOSITO[c.deposit_status ?? ''] ??
          (c.deposit_amount ? 'Sin registrar' : 'No corresponde'),
      },
    };
  },

  loadDataFor: {
    /** Las actualizaciones de ESTE contrato, de la más reciente a la más vieja. */
    tbl_ajustes: async ({ execute, record }) => {
      const id = String(record?.id ?? '');
      if (!id) return [];
      const todas = await execute<AdjustmentOfLease[]>('leases.adjustments.forLease', {
        leaseId: id,
      });
      return (todas ?? []).map((a) => ({
        date: a.effective_date,
        index: a.index_code,
        // La variación se guarda con punto; en la tabla se lee con coma.
        rate: String(a.rate_percent ?? '').replace('.', ','),
        previous_rent: a.previous_rent,
        new_rent: a.new_rent,
        status: a.status,
      }));
    },

    /** Los cargos de ESTE contrato: los mismos que muestra Cobranzas. */
    tbl_cargos: ({ execute, record }) =>
      execute<Record<string, unknown>[]>('leases.billing.chargesForLease', {
        leaseId: String(record?.id ?? ''),
      }),

    /** Los conceptos pactados que se suman al alquiler cada mes: ABL, agua, descuentos. */
    tbl_conceptos: ({ execute, record }) =>
      execute<Record<string, unknown>[]>('leases.charges.forLease', {
        leaseId: String(record?.id ?? ''),
      }),
  },
};
