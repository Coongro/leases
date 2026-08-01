/**
 * Lógica custom de «Cobranzas» (CobranzasFidelidadView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`cobranzas-fidelidad.view.ts`,
 * `use-cobranzas-fidelidad.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';
import { formatMoney, periodLabel, plural, sharedLoad, toast } from '@coongro/plugin-sdk';

import {
  cargosDelPeriodo,
  totalesDelPeriodo,
  type ChargeRow,
} from '../../data/cargosDelPeriodo.js';
import { generarCargosDelPeriodo } from '../../data/generarCargos.js';
import { cobrarPunitorio, politicaPunitorios, proponerPunitorio } from '../../data/punitorios.js';
import { chargeGenerationPolicy } from '../../data/settings.js';

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

/**
 * Los cargos del período, ya pasados por la política. La tabla y los indicadores
 * piden lo mismo al montarse: `sharedLoad` comparte la consulta EN CURSO, así la
 * generación automática la dispara una sola y los dos ven el resultado.
 */
const cargos = (period: string): Promise<ChargeRow[]> =>
  sharedLoad(`cobranzas:${period}`, () =>
    cargosDelPeriodo(period).then(aplicarPoliticaDeGeneracion)
  );

async function aplicarPoliticaDeGeneracion(rows: ChargeRow[]): Promise<ChargeRow[]> {
  if (rows.length > 0 || periodo !== mesActual()) return rows;

  const politica = await chargeGenerationPolicy();
  if (politica === 'manual') return rows;

  if (politica === 'ask') {
    // Un aviso por período: repetirlo en cada recarga sería ruido.
    if (avisado !== periodo) {
      avisado = periodo;
      toast.info(
        `Faltan los cargos de ${periodLabel(periodo, true)}`,
        'Generalos con el botón de arriba cuando quieras.'
      );
    }
    return rows;
  }

  const r = await generarCargosDelPeriodo(periodo);
  if (r.created === 0) return rows;
  const cuantos = r.created === 1 ? 'Se generó 1 cargo' : `Se generaron ${r.created} cargos`;
  toast.success(
    'Cargos generados',
    `${cuantos} de ${periodLabel(periodo, true)}, sin que tuvieras que pedirlo.`
  );
  return cargosDelPeriodo(periodo);
}

export const customHandlers: CustomHandlers = {
  /**
   * Los cargos del mes, con el punitorio que le correspondería a cada uno. Se
   * calcula acá y no en la tabla porque depende de la política del negocio (una
   * setting) y del porcentaje pactado en cada contrato: dos datos que la fila
   * cruda no trae juntos.
   */
  loadData: async () => {
    const [rows, politica] = await Promise.all([cargos(periodo), politicaPunitorios()]);
    return rows.map((r: ChargeRow) => {
      const p = proponerPunitorio(r, politica);
      return {
        ...r,
        late_fee: p.amount === '0' ? '' : p.amount,
        late_fee_detail: p.detail,
        // Marca qué filas admiten el botón de cobro (lo lee `showWhenColumn`).
        late_fee_state: Number(p.amount) > 0 ? 'proponer' : 'no',
      };
    });
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
  loadLiveValues: async () => {
    const t = totalesDelPeriodo(await cargos(periodo));
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
   * Genera los cargos del período. Es idempotente: si ya estaban generados no se
   * duplican, y por eso el aviso distingue cuántos se crearon de cuántos ya existían
   * — que el botón "no haga nada" es un resultado válido y hay que decirlo.
   */
  onAction: async (actionId, { toast, record, reload }) => {
    // Cobrar el punitorio de una fila: lo propone la tabla, lo confirma la persona.
    if (actionId === 'leases.lateFee.charge') {
      const monto = String(record?.late_fee ?? '');
      if (!record?.id || !monto || Number(monto) <= 0) {
        toast?.info('Sin punitorio', 'Este cargo no tiene punitorio para cobrar.');
        return;
      }
      await cobrarPunitorio({
        accountId: String(record.id),
        amount: monto,
        detail: String(record.late_fee_detail ?? ''),
      });
      toast?.success(
        'Punitorio agregado',
        `Se sumaron ${formatMoney(Number(monto))} a la cuenta por ${String(record.late_fee_detail ?? 'mora')}.`
      );
      reload?.();
      return;
    }

    const r = await generarCargosDelPeriodo(periodo);
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
  },
};
