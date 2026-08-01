/**
 * Lógica custom de «Inquilinos» (InquilinosView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`inquilinos.view.ts`,
 * `use-inquilinos.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';
import { actions } from '@coongro/plugin-sdk';

/**
 * Los inquilinos salen de `listTenants`: son los contactos que firmaron al menos un
 * contrato, con su unidad actual y si hoy alquilan. No es una entidad propia —un
 * inquilino ES un contacto— así que la lista se arma con esa consulta y no con el
 * `.list` de una tabla que no existe.
 */
export const customHandlers: CustomHandlers = {
  loadData: () => actions.execute<unknown[]>('leases.contracts.listTenants'),
};
