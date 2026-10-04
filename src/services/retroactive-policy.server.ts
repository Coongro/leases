/**
 * Qué hacer con la diferencia de una actualización confirmada tarde, leído DEL
 * SERVIDOR.
 *
 * Mismo motivo que `late-fee-policy.server.ts`: quien aplica una actualización puede
 * ser el Copilot, y ahí no hay pantalla que lea la configuración por él. Y mismo motivo
 * para no reusar `settings.gen.ts`, que importa React: un test ata estos defaults al
 * manifest para que las dos copias no se desincronicen en silencio.
 */

import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { sql } from 'drizzle-orm';

/** `ask` propone y espera; `auto` cobra sola; `off` no cobra diferencias. */
export type RetroactivePolicy = 'ask' | 'auto' | 'off';

/** La misma key que declara el manifest. */
export const RETROACTIVE_SETTING_KEY = 'leases.adjustments.retroactive';

/**
 * El mismo default que declara el manifest (verificado por test).
 *
 * `ask` y no `auto` porque el kit calcula el ajuste con el último índice publicado
 * —así que llegar tarde no es cosa del calendario sino de que nadie lo confirmó—, y
 * porque cobrar meses hacia atrás es de las pocas cosas que el inquilino no ve venir.
 */
export const RETROACTIVE_DEFAULT: RetroactivePolicy = 'ask';

/** El valor guardado es texto con JSON adentro; un valor viejo puede ser texto pelado. */
function decode(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Convierte la fila cruda de `settings` en la política. Sin base de datos: testeable. */
export function readRetroactivePolicy(values: Record<string, unknown>): RetroactivePolicy {
  const value = decode(values[RETROACTIVE_SETTING_KEY]);
  return value === 'auto' || value === 'off' || value === 'ask' ? value : RETROACTIVE_DEFAULT;
}

/**
 * La política vigente del tenant.
 *
 * Si la consulta falla se cae al default, que es el más conservador: proponer. No poder
 * leer la configuración no puede terminar en un cargo que nadie miró.
 */
export async function currentRetroactivePolicy(
  db: ModuleDatabaseAPI,
  override?: RetroactivePolicy
): Promise<RetroactivePolicy> {
  if (override) return override;

  try {
    const rows = (await db.ormQuery((tx) =>
      tx.execute(
        sql`select key, value from settings where key = ${RETROACTIVE_SETTING_KEY} and scope = 'workspace'`
      )
    )) as unknown as Array<{ key?: string; value?: unknown }>;
    const values = Object.fromEntries(
      (rows ?? []).filter((row) => typeof row?.key === 'string').map((row) => [row.key, row.value])
    );
    return readRetroactivePolicy(values);
  } catch (error) {
    console.warn(
      '[leases] no se pudo leer la política de diferencias retroactivas; se propone, que es lo conservador.',
      error
    );
    return RETROACTIVE_DEFAULT;
  }
}
