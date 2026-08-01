import { settings } from '@coongro/plugin-sdk';

import { getSetting } from '../settings/settings.gen.js';

/**
 * Lectura de las settings del plugin desde el código que orquesta (src/data/).
 *
 * El hook `useLeasesSettings()` sirve dentro de un componente; acá se necesita el
 * valor en funciones sueltas, así que se piden por key y se pasan por la capa tipada
 * generada, que aplica el default y la coerción. Si el tenant nunca tocó la setting,
 * se obtiene el default declarado — nunca `undefined`.
 */
async function raw(keys: string[]): Promise<Record<string, unknown>> {
  const entries = await Promise.all(
    keys.map(async (k) => {
      try {
        return [k, await settings.get(k)] as const;
      } catch {
        // Una setting que todavía no existe en el tenant no es un error: se cae al
        // default declarado, que es exactamente lo que hace la capa tipada.
        return [k, undefined] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}

/** Días de anticipación con que un contrato se marca «por vencer». */
export async function expiryWarningDays(): Promise<number> {
  const v = await raw(['leases.contracts.expiryWarningDays']);
  return getSetting(v, 'leases.contracts.expiryWarningDays');
}

/** Días de gracia antes de que corra el punitorio, y si se calcula. */
export async function lateFeePolicy(): Promise<{ graceDays: number; apply: 'propose' | 'off' }> {
  const v = await raw(['leases.lateFee.graceDays', 'leases.lateFee.apply']);
  return {
    graceDays: getSetting(v, 'leases.lateFee.graceDays'),
    apply: getSetting(v, 'leases.lateFee.apply'),
  };
}

/** Valores con los que arranca un contrato nuevo. */
export async function contractDefaults(): Promise<{
  currency: string;
  dueDay: number;
  dueDayType: string;
  adjustmentIndex: string;
  adjustmentMonths: string;
}> {
  const v = await raw([
    'leases.contracts.defaultCurrency',
    'leases.contracts.defaultDueDay',
    'leases.contracts.defaultDueDayType',
    'leases.contracts.defaultAdjustmentIndex',
    'leases.contracts.defaultAdjustmentMonths',
  ]);
  return {
    currency: getSetting(v, 'leases.contracts.defaultCurrency'),
    dueDay: getSetting(v, 'leases.contracts.defaultDueDay'),
    dueDayType: getSetting(v, 'leases.contracts.defaultDueDayType'),
    adjustmentIndex: getSetting(v, 'leases.contracts.defaultAdjustmentIndex'),
    adjustmentMonths: getSetting(v, 'leases.contracts.defaultAdjustmentMonths'),
  };
}

/** Cuánta iniciativa toma el sistema al generar los cargos del mes. */
export async function chargeGenerationPolicy(): Promise<'manual' | 'ask' | 'auto'> {
  const v = await raw(['leases.charges.generation']);
  return getSetting(v, 'leases.charges.generation');
}

/** Con qué cotización se convierten a pesos los contratos pactados en dólares. */
export async function usdHouse(): Promise<string> {
  const v = await raw(['leases.contracts.usdHouse']);
  return getSetting(v, 'leases.contracts.usdHouse');
}
