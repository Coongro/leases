/**
 * Lógica custom de «Concepto del contrato» (ConceptoDelContratoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`concepto-del-contrato.view.ts`,
 * `use-concepto-del-contrato.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 *
 * El contrato completo (con la documentación de cada punto) está en
 * `CustomHandlers` de `@coongro/plugin-sdk`. De ahí salen también
 * `formatMoney`, `formatDateKey`, `periodLabel`, `plural` y `sharedLoad`
 * (comparte una consulta entre los bloques que se montan a la vez).
 */
import type { CustomHandlers } from '@coongro/plugin-sdk';

export const customHandlers: CustomHandlers = {
  /**
   * Cómo se lee un contrato en el desplegable.
   *
   * Sin esto el select muestra el UUID, que no le dice nada a nadie: hay que elegir el
   * contrato por la unidad y el inquilino, que es como se lo nombra en la vida real.
   */
  refLabel: (row) => {
    const donde = [row.property, row.unit].filter(Boolean).join(' · ');
    const quien = String(row.tenant ?? '').trim();
    if (donde && quien) return `${donde} — ${quien}`;
    return donde || quien || String(row.id ?? '');
  },

  // Botones con acción de servidor (`record` = la fila, si es acción de fila):
  // onAction: async (actionId, { execute, record, toast, reload }) => { ... },
};
