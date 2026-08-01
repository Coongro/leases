/**
 * @coongro/leases — Plugin lifecycle entry point
 *
 * activate() se invoca cuando el plugin se carga en un tenant.
 * Usar para seeds, listeners, o inicialización one-time.
 */

import type { ModuleActivationContext } from '@coongro/plugin-sdk';

// Devuelve una promesa (el loader la espera) pero sin `async`: recién scaffoldeado
// no hay nada que aguardar, y un `async` sin `await` no pasa el lint.
export function activate({ api }: ModuleActivationContext): Promise<void> {
  api.logger.info('Plugin activated');
  return Promise.resolve();
}
