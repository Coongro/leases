/**
 * La política de punitorios del tenant, leída DEL SERVIDOR (COONG-301).
 *
 * Hasta ahora la única forma de conocerla era `lateFeePolicy()`, que corre en el
 * navegador y viaja como parámetros del RPC. Mientras el único que cobraba era
 * un botón de la pantalla, alcanzaba. Deja de alcanzar cuando el que cobra es un
 * agente: sin pantalla no hay quién lea la configuración, y el handler terminaba
 * aplicando cero días de gracia sobre plata de una persona — la configuración
 * del tenant existía y nadie la miraba.
 *
 * Por qué no reusa `settings.gen.ts`: ese archivo importa `useSettings` del SDK
 * y con él, React. Importarlo desde un repositorio arrastraría el bundle del
 * navegador al proceso del servidor, que es justamente el error que este módulo
 * viene a corregir. Los defaults se duplican a propósito y hay un test que los
 * compara contra el manifest, así que la duplicación no puede desincronizarse en
 * silencio.
 */

import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { sql } from 'drizzle-orm';

import type { LateFeePolicy } from './late-fee.js';

/** Las mismas keys que declara el manifest. */
export const LATE_FEE_SETTING_KEYS = {
  graceDays: 'leases.lateFee.graceDays',
  apply: 'leases.lateFee.apply',
} as const;

/** Los mismos defaults que declara el manifest (verificado por test). */
export const LATE_FEE_DEFAULTS: LateFeePolicy = { graceDays: 0, apply: 'propose' };

/** El valor guardado es texto con JSON adentro; un valor viejo puede ser texto pelado. */
function decode(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function toGraceDays(raw: unknown): number {
  const value = decode(raw);
  const parsed = typeof value === 'number' ? value : Number(value);
  // Un valor corrupto no puede volverse gracia infinita ni negativa: se cae al
  // default, que es el mismo criterio del coercionador de la pantalla.
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : LATE_FEE_DEFAULTS.graceDays;
}

function toApply(raw: unknown): LateFeePolicy['apply'] {
  const value = decode(raw);
  return value === 'off' || value === 'propose' ? value : LATE_FEE_DEFAULTS.apply;
}

/** Convierte las filas crudas de `settings` en la política. Sin base de datos: testeable. */
export function readLateFeePolicy(values: Record<string, unknown>): LateFeePolicy {
  return {
    graceDays: toGraceDays(values[LATE_FEE_SETTING_KEYS.graceDays]),
    apply: toApply(values[LATE_FEE_SETTING_KEYS.apply]),
  };
}

/**
 * La política vigente del tenant. `overrides` gana cuando viene: la pantalla ya
 * la resolvió y no tiene sentido volver a leerla.
 *
 * Si la consulta falla, se usan los defaults en vez de propagar el error: no
 * poder leer la configuración no puede impedir cobrar una mora que el contrato
 * pactó. Queda anotado en la consola, no en silencio.
 */
export async function currentLateFeePolicy(
  db: ModuleDatabaseAPI,
  overrides: { graceDays?: number; applyLateFee?: 'propose' | 'off' } = {}
): Promise<LateFeePolicy> {
  if (overrides.graceDays !== undefined && overrides.applyLateFee !== undefined) {
    return { graceDays: Number(overrides.graceDays) || 0, apply: overrides.applyLateFee };
  }

  let values: Record<string, unknown> = {};
  try {
    const rows = (await db.ormQuery((tx) =>
      tx.execute(
        sql`select key, value from settings where key like 'leases.lateFee.%' and scope = 'workspace'`
      )
    )) as unknown as Array<{ key?: string; value?: unknown }>;
    values = Object.fromEntries(
      (rows ?? []).filter((row) => typeof row?.key === 'string').map((row) => [row.key, row.value])
    );
  } catch (error) {
    console.warn(
      '[leases] no se pudo leer la política de punitorios del tenant; se usan los valores por defecto.',
      error
    );
  }

  const stored = readLateFeePolicy(values);
  return {
    graceDays:
      overrides.graceDays !== undefined ? Number(overrides.graceDays) || 0 : stored.graceDays,
    apply: overrides.applyLateFee ?? stored.apply,
  };
}
