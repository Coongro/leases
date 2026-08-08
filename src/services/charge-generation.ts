import { calcDueDate, type DateKey } from './due-date.js';
import { expensesForPeriod, type ExpenseSettlement } from './expenses.js';
import { getHolidays } from './holidays.js';
import { chargeLinesForPeriod, type LeaseCharge } from './lease-charges.js';

/**
 * Generación de los cargos del mes.
 *
 * Por cada contrato vigente en el período se abre UNA cuenta por cobrar en `billing`,
 * con el alquiler vigente y las expensas como líneas, y con el vencimiento calculado
 * según lo que pactó el contrato (día fijo o N-ésimo día hábil).
 *
 * **Idempotente**: la cuenta se identifica con `source_ref = "<leaseId>:<período>"`, así
 * que correr la generación dos veces para el mismo mes no duplica nada. Es la regla
 * más importante de todo el kit — un cargo duplicado le reclama al inquilino plata que
 * no debe, y limpiarlo después es peor que no haberlo generado.
 *
 * Lo que se cobra vive en `billing`; acá solo se decide cuánto y cuándo.
 */

/** `receivable` + este source: así se distinguen los alquileres del resto de las cuentas. */
export const RENT_SOURCE = 'rent';

/**
 * Un contrato sin moneda declarada es en pesos: es lo que era antes de que existieran
 * los contratos en dólares, y los que ya estaban cargados no tienen el campo.
 */
export function esMonedaExtranjera(currency: string | null | undefined): boolean {
  const c = String(currency ?? 'ARS').toUpperCase();
  return c !== '' && c !== 'ARS';
}

/**
 * Pasa un importe a la moneda en la que se cobra, y explica cómo.
 *
 * Lo inyecta `src/data/`: la cotización cruza a `indices` y esta capa no habla con
 * otros plugins —es la que tiene que poder probarse sin red—. Sin conversor, un
 * contrato en dólares no se emite: ver `generateCharges`.
 */
export type MoneyConverter = (
  amount: string,
  currency: string
) => Promise<{ subtotal: string; detail: string }>;

interface LeaseForCharges {
  id: string;
  tenant_contact_id: string;
  status: string;
  start_date: DateKey;
  end_date: DateKey;
  termination_date?: DateKey | null;
  rent_amount: string;
  expenses_amount?: string | null;
  currency: string;
  due_day: number;
  due_day_type: string;
  unit?: string | null;
  property?: string | null;
  /** Edificio de la unidad: por ahí se busca la liquidación del mes. */
  building_id?: string | null;
  /** Porcentaje del total de expensas que le toca a la unidad. */
  share_pct?: string | null;
}

export interface GenerationResult {
  period: string;
  created: number;
  skipped: number;
  /** Contratos que no entraron, con el motivo — para poder explicarlo en la vista. */
  details: Array<{
    leaseId: string;
    label: string;
    status: 'creada' | 'ya_existía' | 'fuera_de_período';
  }>;
}

/** Primer y último día del período `YYYY-MM`. */
function periodRange(period: string): { first: DateKey; last: DateKey } {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) throw new Error(`Período inválido: "${period}" (se esperaba YYYY-MM)`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { first: `${period}-01`, last: `${period}-${String(lastDay).padStart(2, '0')}` };
}

/**
 * ¿Este contrato se cobra en este período?
 *
 * Se cobra si estuvo vigente aunque sea un día del mes: un contrato que arranca el 20
 * de agosto genera el cargo de agosto. Lo que no se cobra es lo que todavía no empezó,
 * lo que ya terminó, y lo que está en borrador o rescindido antes del período.
 */
export function appliesToPeriod(lease: LeaseForCharges, period: string): boolean {
  if (lease.status === 'borrador') return false;
  const { first, last } = periodRange(period);
  if (lease.start_date > last) return false;
  const fin = lease.termination_date ?? lease.end_date;
  return !(fin < first);
}

export async function generateCharges({
  period,
  leases,
  execute,
  logger,
  convertir,
  settlements,
  extras,
}: {
  period: string;
  leases: LeaseForCharges[];
  execute: <T = unknown>(id: string, args?: unknown) => Promise<T>;
  logger?: { warn: (msg: string, meta?: unknown) => void };
  /** Cómo pasar a pesos un contrato pactado en otra moneda. */
  convertir?: MoneyConverter;
  /**
   * Liquidaciones de expensas del período, por `building_id`. Las trae `src/data/`
   * porque viven en otro plugin. Sin esto, cada contrato cae a lo pactado.
   */
  settlements?: Map<string, ExpenseSettlement>;
  /**
   * Conceptos recurrentes por contrato (ABL, agua, bonificaciones), indexados por
   * `lease_id`. Cada uno entra como línea propia con su tipo, o no entra si no está
   * vigente en el período.
   */
  extras?: Map<string, LeaseCharge[]>;
}): Promise<GenerationResult> {
  // Sin período no hay mes que facturar. Se comprueba acá, en la puerta, porque
  // el primer uso está diez líneas más abajo (`period.slice`) y sin esto un
  // llamado sin período —o con «agosto» en vez de «2026-08»— moría con
  // «Cannot read properties of undefined (reading 'slice')»: un stack que no
  // dice qué falta, sobre la operación que emite los recibos del mes.
  if (!/^\d{4}-\d{2}$/.test(String(period ?? ''))) {
    throw new Error(
      `«${period ?? 'sin valor'}» no es un período válido: se espera el mes como «2026-08».`
    );
  }
  const year = Number(period.slice(0, 4));
  const holidays = await getHolidays(year, logger);

  const result: GenerationResult = { period, created: 0, skipped: 0, details: [] };

  for (const lease of leases) {
    const label = [lease.property, lease.unit].filter(Boolean).join(' · ') || lease.id;

    if (!appliesToPeriod(lease, period)) {
      result.details.push({ leaseId: lease.id, label, status: 'fuera_de_período' });
      continue;
    }

    const dueDate = calcDueDate(
      period,
      lease.due_day,
      lease.due_day_type === 'business' ? 'business' : 'fixed',
      holidays
    );

    // Un contrato en dólares se cobra en pesos: se convierte al emitir y se deja
    // asentado con qué cotización, para que el importe pueda explicarse después.
    const enPesos = async (amount: string): Promise<{ subtotal: string; detail: string }> => {
      if (!esMonedaExtranjera(lease.currency)) return { subtotal: amount, detail: '' };
      if (!convertir) {
        // Emitirlo sin convertir cobraría 1.200 pesos donde el contrato dice 1.200
        // dólares. Preferible que el cargo falte, y se vea que faltó.
        throw new Error(
          `El contrato ${label} está en ${lease.currency} y no hay cotización disponible para convertirlo.`
        );
      }
      const { subtotal, detail } = await convertir(amount, lease.currency);
      return { subtotal, detail: detail ? ` · ${detail}` : '' };
    };

    const alquiler = await enPesos(lease.rent_amount);
    const lines: Array<{ description: string; subtotal: string; sourceType: string }> = [
      {
        description: `Alquiler ${period}${alquiler.detail}`,
        subtotal: alquiler.subtotal,
        sourceType: RENT_SOURCE,
      },
    ];
    // Las expensas van como línea aparte y no sumadas al alquiler: se actualizan por
    // su cuenta (las fija el consorcio) y el inquilino tiene derecho a ver el desglose.
    //
    // El importe sale de la liquidación del mes repartida por alícuota; si el consorcio
    // todavía no liquidó, se cobra lo pactado en el contrato y la línea lo aclara.
    const expensasDelMes = expensesForPeriod({
      lease,
      period,
      settlement: settlements?.get(String(lease.building_id ?? '')) ?? null,
    });
    if (expensasDelMes.amount) {
      const expensas = await enPesos(expensasDelMes.amount);
      const comoSeCalculo = expensasDelMes.detail ? ` · ${expensasDelMes.detail}` : '';
      lines.push({
        description: `Expensas ${period}${comoSeCalculo}${expensas.detail}`,
        subtotal: expensas.subtotal,
        sourceType: 'expenses',
      });
    }

    // Conceptos que se pactaron aparte del alquiler: cada uno con su tipo declarado,
    // así la cuenta corriente distingue un ABL de un servicio y de una bonificación.
    for (const extra of chargeLinesForPeriod({ charges: extras?.get(lease.id) ?? [], period })) {
      // El signo se saca antes de convertir y se repone después: una bonificación es
      // un importe negativo, y la conversión de moneda no tiene por qué saber eso
      // (rechaza negativos a propósito, para que un error de carga no pase inadvertido).
      const negativo = extra.subtotal.startsWith('-');
      const enMoneda = await enPesos(negativo ? extra.subtotal.slice(1) : extra.subtotal);
      lines.push({
        description: `${extra.description}${enMoneda.detail}`,
        subtotal: negativo ? `-${enMoneda.subtotal}` : enMoneda.subtotal,
        sourceType: extra.sourceType,
      });
    }

    const res = await execute<{ created: boolean }>('billing.accounts.openForSource', {
      source: RENT_SOURCE,
      sourceRef: `${lease.id}:${period}`,
      contactId: lease.tenant_contact_id,
      dueDate,
      direction: 'receivable',
      notes: `${label} · ${period}`,
      lines,
    });

    if (res?.created) {
      result.created += 1;
      result.details.push({ leaseId: lease.id, label, status: 'creada' });
    } else {
      result.skipped += 1;
      result.details.push({ leaseId: lease.id, label, status: 'ya_existía' });
    }
  }

  return result;
}
