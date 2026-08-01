/**
 * Test de ejemplo (vitest). Borrá este archivo al agregar los tuyos.
 *
 * Corré: `npm test` (una vez) o `npm run test:watch`.
 * vitest descubre *.test.ts / *.spec.ts en src/ automáticamente.
 * Los tests NO se emiten a dist (excluidos en tsconfig).
 */
import { describe, it, expect } from 'vitest';

describe('ejemplo', () => {
  it('verifica la infra de tests', () => {
    expect(1 + 1).toBe(2);
  });
});
