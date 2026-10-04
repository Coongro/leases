import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  RETROACTIVE_DEFAULT,
  RETROACTIVE_SETTING_KEY,
  readRetroactivePolicy,
} from './retroactive-policy.server.js';

describe('readRetroactivePolicy', () => {
  it('lee el valor guardado, venga como JSON o como texto pelado', () => {
    expect(readRetroactivePolicy({ [RETROACTIVE_SETTING_KEY]: '"auto"' })).toBe('auto');
    expect(readRetroactivePolicy({ [RETROACTIVE_SETTING_KEY]: 'off' })).toBe('off');
  });

  it('un valor corrupto cae al default, que es proponer', () => {
    // Lo conservador: nunca terminar en un cargo que nadie miró.
    expect(readRetroactivePolicy({ [RETROACTIVE_SETTING_KEY]: 'cualquiera' })).toBe('ask');
    expect(readRetroactivePolicy({})).toBe('ask');
  });

  /**
   * El default está escrito dos veces —acá y en el manifest— porque este módulo no
   * puede importar `settings.gen.ts` sin arrastrar React al servidor. Este test es lo
   * que impide que esa duplicación se desincronice en silencio.
   */
  it('el default del servidor es el mismo que declara el manifest', () => {
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

    expect(declarados.get(RETROACTIVE_SETTING_KEY)).toBe(RETROACTIVE_DEFAULT);
  });
});
