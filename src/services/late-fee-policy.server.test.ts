/**
 * La política de punitorios leída del servidor (COONG-301).
 *
 * Importa porque hasta ahora solo existía del lado del navegador: un agente que
 * cobra mora sin poder leer la configuración del tenant aplica cero días de
 * gracia sobre plata de una persona.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  LATE_FEE_DEFAULTS,
  LATE_FEE_SETTING_KEYS,
  readLateFeePolicy,
} from './late-fee-policy.server.js';

describe('política de punitorios del tenant', () => {
  it('lee los valores guardados', () => {
    expect(
      readLateFeePolicy({
        [LATE_FEE_SETTING_KEYS.graceDays]: '5',
        [LATE_FEE_SETTING_KEYS.apply]: '"off"',
      })
    ).toEqual({ graceDays: 5, apply: 'off' });
  });

  it('tolera el valor sin comillas y el número crudo', () => {
    expect(
      readLateFeePolicy({
        [LATE_FEE_SETTING_KEYS.graceDays]: 3,
        [LATE_FEE_SETTING_KEYS.apply]: 'off',
      })
    ).toEqual({ graceDays: 3, apply: 'off' });
  });

  it('sin valores guardados usa los defaults', () => {
    expect(readLateFeePolicy({})).toEqual(LATE_FEE_DEFAULTS);
  });

  /**
   * Una gracia negativa cobraría mora antes del vencimiento, y una corrupta la
   * volvería NaN — que en el cálculo se propaga como un monto sin sentido.
   */
  it('un valor corrupto o negativo cae al default, no a algo raro', () => {
    expect(readLateFeePolicy({ [LATE_FEE_SETTING_KEYS.graceDays]: 'cinco' }).graceDays).toBe(
      LATE_FEE_DEFAULTS.graceDays
    );
    expect(readLateFeePolicy({ [LATE_FEE_SETTING_KEYS.graceDays]: '-10' }).graceDays).toBe(
      LATE_FEE_DEFAULTS.graceDays
    );
    expect(readLateFeePolicy({ [LATE_FEE_SETTING_KEYS.apply]: 'sí, cobrale' }).apply).toBe(
      LATE_FEE_DEFAULTS.apply
    );
  });

  /**
   * Los defaults están escritos dos veces —acá y en el manifest— porque este
   * módulo no puede importar `settings.gen.ts` sin arrastrar React al servidor.
   * Este test es lo que impide que esa duplicación se desincronice en silencio:
   * si alguien cambia el default en el manifest, se entera acá y no cuando un
   * tenant cobre una mora que no correspondía.
   */
  it('los defaults son los mismos que declara el manifest', () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'coongro.manifest.json'), 'utf8')
    ) as { contributes?: { settings?: unknown } };

    const declarados = new Map<string, unknown>();
    const recorrer = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(recorrer);
      if (!node || typeof node !== 'object') return;
      const entry = node as Record<string, unknown>;
      if (typeof entry.key === 'string' && 'default' in entry)
        declarados.set(entry.key, entry.default);
      Object.values(entry).forEach(recorrer);
    };
    recorrer(manifest.contributes?.settings);

    expect(declarados.get(LATE_FEE_SETTING_KEYS.graceDays)).toBe(LATE_FEE_DEFAULTS.graceDays);
    expect(declarados.get(LATE_FEE_SETTING_KEYS.apply)).toBe(LATE_FEE_DEFAULTS.apply);
  });
});
