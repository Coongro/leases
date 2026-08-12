/**
 * Lógica custom de «Co-firmante del contrato» (CoFirmanteDelContratoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`co-firmante-del-contrato.view.ts`,
 * `use-co-firmante-del-contrato.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 * Cada punto que implementes debe clasificarse en `spec.json > headless.handlers`
 * como query, command, presentation o uiOnly. Builder lo muestra durante el
 * desarrollo y evita que la funcionalidad desaparezca de Copilot/MCP.
 *
 * El contrato completo (con la documentación de cada punto) está en
 * `CustomHandlers` de `@coongro/plugin-sdk`. De ahí salen también
 * `formatMoney`, `formatDateKey`, `periodLabel`, `plural` y `sharedLoad`
 * (comparte una consulta entre los bloques que se montan a la vez).
 */
import type { CustomHandlers } from '@coongro/plugin-sdk';

/** Lo que devuelve el alta: si se sumó a alguien nuevo o se corrigió uno que ya estaba. */
interface Guardado {
  id: string;
  created: boolean;
}

const texto = (v: unknown): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || undefined;
};

export const customHandlers: CustomHandlers = {
  /**
   * Guarda por la operación de negocio y no por el `create` del scaffolder: es la que
   * se niega a sumar un firmante a un contrato cerrado, a duplicar a alguien que ya
   * firma y a anotar al inquilino principal como si fuera otra persona. El create
   * crudo acepta las tres cosas, y por eso no se publica.
   */
  onSubmit: async (values, { execute, record, toast }) => {
    const r = await execute<Guardado>('leases.coTenants.save', {
      id: texto(record?.id),
      leaseId: texto(values.leaseId),
      contactId: texto(values.contactId),
      role: texto(values.role),
      notes: texto(values.notes),
    });

    // El aviso distingue el alta de la corrección: quien venía a «agregar a la
    // esposa» tiene que poder ver si la sumó o si solo cambió un vínculo existente.
    toast?.success(
      r.created ? 'Co-firmante sumado' : 'Co-firmante actualizado',
      r.created
        ? 'Queda como firmante del contrato junto al inquilino principal.'
        : 'Se guardaron los cambios del vínculo.'
    );
  },

  // Valores con los que abre el formulario (solo rellenan lo vacío).
  // `record` = registro en edición; `parentRecord` = ficha desde la que se abrió
  // (el campo ref que apunta a su entidad ya se llena solo si el match es único):
  // onInit: async ({ execute, record, parentRecord }) => ({ leaseId: record?.leaseId ?? '' }),

  // Botones con acción de servidor (`record` = la fila, si es acción de fila):
  // DeclarÃ¡ una entrada headless.handlers por rama usando el mismo `key`:
  // onAction: async (actionId, { execute, record, toast, reload }) => {
  //   if (actionId === '<action-key>') {
  //     await execute('<prefix>.<command>', { id: record?.id });
  //     reload();
  //   }
  // },
};
