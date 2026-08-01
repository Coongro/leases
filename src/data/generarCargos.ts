import { convertToArs, describeRate } from '@coongro/indices';
import { actions } from '@coongro/plugin-sdk';

import {
  generateCharges,
  type GenerationResult,
  type MoneyConverter,
} from '../services/charge-generation.js';
import type { ExpenseSettlement } from '../services/expenses.js';
import type { LeaseCharge } from '../services/lease-charges.js';

import { usdHouse } from './settings.js';

/**
 * Genera los cargos de un período desde la vista de Cobranzas.
 *
 * La orquestación entre plugins vive acá y no en el repositorio: es el patrón del
 * repo (ver `purchases/src/data/`), porque `actions.execute` es el puente del host y
 * un repositorio del servidor no lo tiene.
 *
 * El cálculo —qué contratos entran, con qué vencimiento y qué líneas— está en
 * `services/charge-generation.ts`, sin dependencias del navegador ni de la base, que
 * es lo que permite testearlo. Acá solo se traen los contratos y se le pasa el
 * `execute` para que hable con `billing`.
 */

/** Lo que devuelve `indices.fx.rate`: la cotización del día y de dónde salió. */
interface FxRate {
  rate: string;
  rateDate: string;
  house: string;
}

/**
 * Conversor para los contratos pactados en moneda extranjera.
 *
 * Pide la cotización UNA vez por corrida y solo si algún contrato la necesita: todos
 * los cargos que se emiten juntos quedan convertidos con el mismo valor del día, que
 * además es lo que hace explicable la tanda («los de agosto salieron al dólar del 1°»).
 *
 * La multiplicación se hace acá y no por RPC: es una cuenta, y cruzar la red por cada
 * importe solo agrega demoras y formas de fallar. Lo que sí sale de `indices` es el
 * criterio —el redondeo y el texto de la constancia—, para que no haya dos versiones.
 */
function conversorDeMoneda(house: string): MoneyConverter {
  let cotizacion: FxRate | null = null;

  return async (amount, currency) => {
    cotizacion ??= await actions.execute<FxRate>('indices.fx.rate', { currency: 'USD', house });
    return {
      subtotal: convertToArs(amount, cotizacion.rate),
      detail: describeRate({
        amount,
        currency,
        rate: cotizacion.rate,
        rateDate: cotizacion.rateDate,
        house: cotizacion.house,
      }),
    };
  };
}

/**
 * Liquidaciones de expensas del mes, indexadas por edificio.
 *
 * Viven en `properties`, así que el cruce es acá. Si la consulta falla, se sigue sin
 * ellas: cada contrato cae a lo pactado y la línea lo aclara. Frenar la facturación del
 * mes entero porque el consorcio no cargó su liquidación sería peor.
 */
async function liquidacionesDelPeriodo(period: string): Promise<Map<string, ExpenseSettlement>> {
  try {
    const filas = await actions.execute<ExpenseSettlement[]>(
      'properties.buildingExpenses.forPeriod',
      {
        period,
      }
    );
    return new Map((filas ?? []).map((f) => [String(f.building_id), f]));
  } catch {
    return new Map();
  }
}

/**
 * Conceptos recurrentes de cada contrato (ABL, agua, bonificaciones), por `lease_id`.
 *
 * Se piden todos de una y se agrupan acá: una consulta por contrato multiplicaría los
 * viajes sin ganar nada, porque igual se facturan todos juntos.
 */
async function conceptosPorContrato(): Promise<Map<string, LeaseCharge[]>> {
  const filas = await actions.execute<LeaseCharge[]>('leases.charges.list');
  const porContrato = new Map<string, LeaseCharge[]>();
  for (const f of filas ?? []) {
    const id = String(f.lease_id ?? '');
    if (!id) continue;
    porContrato.set(id, [...(porContrato.get(id) ?? []), f]);
  }
  return porContrato;
}

export async function generarCargosDelPeriodo(period: string): Promise<GenerationResult> {
  const [leases, house, settlements, extras] = await Promise.all([
    actions.execute<Parameters<typeof generateCharges>[0]['leases']>('leases.contracts.list'),
    usdHouse(),
    liquidacionesDelPeriodo(period),
    conceptosPorContrato(),
  ]);

  return generateCharges({
    period,
    leases: Array.isArray(leases) ? leases : [],
    execute: (id, args) => actions.execute(id, args),
    convertir: conversorDeMoneda(house),
    settlements,
    extras,
  });
}
