/**
 * Lógica custom de «Cobranzas» (CobranzasFidelidadView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`cobranzas-fidelidad.view.ts`,
 * `use-cobranzas-fidelidad.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';
import { formatMoney, periodLabel, plural, toast } from '@coongro/plugin-sdk';

import { chargeGenerationPolicy, lateFeePolicy, usdHouse } from '../../data/settings.js';

/** Período que se está mirando. Arranca en el mes corriente. */
const mesActual = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
};
let periodo = mesActual();

/**
 * Aplica la política de generación del mes en curso (`leases.charges.generation`).
 *
 * Solo actúa cuando el período que se está mirando es el mes actual y todavía no
 * tiene cargos: para meses pasados generar sin pedirlo sería reescribir historia.
 *
 * - `manual`: no hace nada — el botón está ahí para eso.
 * - `ask`: avisa una vez que faltan, sin generarlos.
 * - `auto`: los genera y lo dice (nunca en silencio: la persona tiene que saber
 *   que ese mes ya quedó facturado).
 *
 * La generación es idempotente, así que este camino no puede duplicar nada.
 */
let avisado = '';

/** Una fila de la tabla, tal como la devuelve `leases.billing.chargesForPeriod`. */
type Fila = Record<string, unknown>;

/** Los totales del mes, tal como los devuelve `leases.billing.periodSummary`. */
interface Totales {
  facturado: number;
  cobrado: number;
  porCobrar: number;
  vencido: number;
  cargos: number;
  saldados: number;
  vencidos: number;
}

/** Lo que devuelve la emisión del mes: cuántos se crearon y cuántos ya existían. */
interface GeneracionResult {
  created: number;
  skipped: number;
}

/** Lo que devuelve el cobro del punitorio: si hubo algo que cobrar, y por cuánto. */
interface PunitorioResult {
  charged: boolean;
  amount: string;
  detail: string;
}

export const customHandlers: CustomHandlers = {
  /**
   * Los cargos del mes, con el punitorio que le correspondería a cada uno. Se
   * calcula acá y no en la tabla porque depende de la política del negocio (una
   * setting) y del porcentaje pactado en cada contrato: dos datos que la fila
   * cruda no trae juntos.
   */
  loadData: async ({ execute }) => {
    const [politica, generacion] = await Promise.all([lateFeePolicy(), chargeGenerationPolicy()]);
    // Emitir el mes al abrir solo se pide cuando el negocio lo configuró así Y se está
    // mirando el mes en curso: para un mes pasado, generar sin que lo pidan sería
    // reescribir historia.
    const emitir = generacion === 'auto' && periodo === mesActual();

    // Emitir y leer son dos llamadas y no un flag de la lectura: `chargesForPeriod` se
    // publica como capability de lectura, y una lectura que además emite queda visible
    // para el perfil `readonly` como si solo consultara. Correr de más es gratis — la
    // generación es incremental y saltea los contratos que ya tienen su cargo.
    if (emitir) {
      await execute('leases.billing.generateForPeriod', {
        period: periodo,
        usdHouse: await usdHouse(),
      });
    }

    const filas = await execute<Fila[]>('leases.billing.chargesForPeriod', {
      period: periodo,
      graceDays: politica.graceDays,
      applyLateFee: politica.apply,
    });

    // `ask`: se avisa una vez por período que el mes está sin emitir. Repetirlo en cada
    // recarga sería ruido, y emitirlo sin permiso no es lo que el negocio pidió.
    if (
      generacion === 'ask' &&
      filas.length === 0 &&
      periodo === mesActual() &&
      avisado !== periodo
    ) {
      avisado = periodo;
      toast.info(
        `Faltan los cargos de ${periodLabel(periodo, true)}`,
        'Generalos con el botón de arriba cuando quieras.'
      );
    }
    return filas;
  },

  /** Cambiar de mes trae los cargos de ese mes. */
  onPeriodChange: ({ period, reload }) => {
    periodo = period;
    reload();
  },

  /**
   * Los indicadores piden sus propios datos en vez de leer los de la tabla: las dos
   * cargas arrancan a la vez al montar, así que compartir una variable dejaba los
   * totales en cero hasta la siguiente recarga.
   */
  loadLiveValues: async ({ execute }) => {
    const t = await execute<Totales>('leases.billing.periodSummary', { period: periodo });
    return {
      k1: {
        value: formatMoney(t.facturado),
        sub: t.cargos ? plural(t.cargos, 'cargo del período', 'cargos del período') : 'sin cargos',
      },
      k2: {
        value: formatMoney(t.cobrado),
        sub: t.saldados ? plural(t.saldados, 'cargo saldado', 'cargos saldados') : 'sin cobros',
      },
      k3: { value: formatMoney(t.porCobrar), sub: 'aún no vencido' },
      k4: {
        value: formatMoney(t.vencido),
        sub: t.vencidos ? plural(t.vencidos, 'cargo vencido', 'cargos vencidos') : 'sin atrasos',
      },
    };
  },

  /**
   * Dos operaciones del período, cada una en su propia rama `actionId === '...'`:
   * emitir el mes entero y cobrarle el punitorio a UN cargo. Separadas así, el
   * contrato headless declara y verifica una `key` por rama, y el agente ve las dos
   * capacidades en vez de un solo botón ambiguo.
   */
  onAction: async (actionId, { execute, toast, record, reload }) => {
    // Cobrar el punitorio de una fila: lo propone la tabla, lo confirma la persona.
    if (actionId === 'leases.billing.chargeLateFee') {
      if (!record?.id) return;
      // El monto lo calcula el servidor con el saldo y el porcentaje del contrato: la
      // pantalla elige el cargo, no cuánto se cobra.
      const politica = await lateFeePolicy();
      const r = await execute<PunitorioResult>('leases.billing.chargeLateFee', {
        accountId: String(record.id),
        graceDays: politica.graceDays,
        applyLateFee: politica.apply,
      });
      if (!r.charged) {
        toast?.info('Sin punitorio', 'Este cargo no tiene punitorio para cobrar.');
        return;
      }
      toast?.success(
        'Punitorio agregado',
        `Se sumaron ${formatMoney(Number(r.amount))} a la cuenta por ${r.detail || 'mora'}.`
      );
      reload?.();
      return;
    }

    // Emitir el mes entero. Es idempotente: si ya estaban generados no se duplican, y
    // por eso el aviso distingue cuántos se crearon de cuántos ya existían — que el
    // botón "no haga nada" es un resultado válido y hay que decirlo.
    if (actionId === 'leases.billing.generateForPeriod') {
      const r = await execute<GeneracionResult>('leases.billing.generateForPeriod', {
        period: periodo,
        usdHouse: await usdHouse(),
      });
      if (r.created === 0 && r.skipped === 0) {
        toast?.info('Sin contratos', `Ningún contrato corresponde a ${periodo}.`);
        return;
      }
      if (r.created === 0) {
        toast?.info('Ya estaban generados', `Los ${r.skipped} cargos de ${periodo} ya existían.`);
        return;
      }
      toast?.success(
        'Cargos generados',
        r.skipped > 0
          ? `${r.created} nuevos; ${r.skipped} ya existían.`
          : plural(r.created, 'cargo generado', 'cargos generados')
      );
    }
  },
};
