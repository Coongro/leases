/**
 * Lógica custom de «Inquilino» (InquilinoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`inquilino.view.ts`,
 * `use-inquilino.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 *
 * **Los dos hooks son adaptadores.** Las reglas —qué va en columnas y qué en
 * `metadata`, no pisar lo que otro rol le cargó al mismo contacto, fijar el tipo solo al
 * crear— viven en `leases.contracts.saveTenant` y `.getTenant`. Así el formulario y el
 * Copilot ejecutan lo mismo: si la lógica viviera acá, el Copilot tendría que
 * reimplementarla y la primera diferencia sería un dato borrado.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';

export const customHandlers: CustomHandlers = {
  /** Abre el formulario con el inquilino ya cargado, incluidos sus datos personales. */
  onInit: ({ execute, editingId }) =>
    editingId
      ? execute<Record<string, unknown>>('leases.contracts.getTenant', { id: editingId })
      : Promise.resolve({}),

  onSubmit: (values, { execute, editingId }) =>
    execute('leases.contracts.saveTenant', { id: editingId, data: values }),
};
