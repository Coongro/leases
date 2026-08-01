/**
 * Lógica custom de «Inquilino» (InquilinoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`inquilino.view.ts`,
 * `use-inquilino.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 */

import type { CustomHandlers } from '@coongro/plugin-sdk';

/**
 * Campos del formulario que no son columnas de `contacts` y viajan en `metadata`.
 *
 * `contacts` es un plugin compartido: nacionalidad, estado civil, cónyuge o forma
 * jurídica son vocabulario de alquileres (los pide el contrato de locación), no
 * datos que cualquier kit necesite de un contacto.
 */
const EN_METADATA = [
  'kind',
  'nationality',
  'marital_status',
  'spouse_name',
  'spouse_document',
  'occupation',
  'legal_representative',
  'legal_form',
  'phone_alt',
  'city',
  'zip_code',
  'province',
] as const;

/** Columnas propias de `contacts` que el formulario edita directo. */
const EN_COLUMNAS = ['name', 'document_type', 'document_number', 'email', 'phone', 'address'];

const texto = (v: unknown): string => String(v ?? '').trim();

interface ContactoCompleto {
  id: string;
  metadata?: Record<string, unknown> | null;
  [k: string]: unknown;
}

export const customHandlers: CustomHandlers = {
  /**
   * Al abrir en modo edición, trae el contacto COMPLETO.
   *
   * El registro con el que se abre la ficha viene de `leases.contracts.listTenants`,
   * que es una fila de lista: trae el documento ya concatenado para mostrar
   * («CUIT 27-11402887-3») y no trae domicilio ni `metadata`. Prefillear con eso
   * dejaría media ficha en blanco y guardar borraría lo que no se cargó.
   */
  onInit: async ({ execute, record }) => {
    const id = texto(record?.id);
    if (!id) return {};

    const contacto = await execute<ContactoCompleto | undefined>('contacts.getById', { id });
    if (!contacto) return {};

    const inicial: Record<string, unknown> = {};
    for (const key of EN_COLUMNAS) {
      const v = contacto[key];
      if (v !== null && v !== undefined) inicial[key] = v;
    }
    const metadata = contacto.metadata ?? {};
    for (const key of EN_METADATA) {
      const v = metadata[key];
      if (v !== null && v !== undefined) inicial[key] = v;
    }
    return inicial;
  },

  /**
   * El inquilino NO es una entidad de este plugin: es un contacto con
   * `type: 'tenant'`. Por eso el alta se hace contra `contacts` y no contra un
   * repositorio propio — así la misma persona sirve para cualquier otro kit sin
   * quedar duplicada. Mismo criterio que el propietario en `properties`.
   */
  onSubmit: async (values, { execute, editingId }) => {
    // `metadata` es de todo el contacto, no de este formulario: ahí conviven los
    // datos de cobro que le puso «Propietario» y lo que guarde cualquier otro kit.
    // Mandarla armada de cero borraría todo eso, así que se parte de la actual y
    // solo se tocan las claves propias (vaciar una acá sí la quita).
    const actual = editingId
      ? await execute<ContactoCompleto | undefined>('contacts.getById', { id: editingId })
      : undefined;
    const metadata: Record<string, unknown> = { ...(actual?.metadata ?? {}) };
    for (const key of EN_METADATA) {
      const v = texto(values[key]);
      if (v) metadata[key] = v;
      else delete metadata[key];
    }

    const data = {
      name: texto(values.name),
      document_type: texto(values.document_type) || null,
      document_number: texto(values.document_number) || null,
      email: texto(values.email) || null,
      phone: texto(values.phone) || null,
      address: texto(values.address) || null,
      metadata,
    };

    // El aviso de guardado lo da el formulario: agregar otro toast acá los duplica.
    if (editingId) {
      // Al actualizar NO se toca `type`: la misma persona puede ser inquilina de una
      // unidad y propietaria de otra, y `contacts.type` guarda un solo rol. Pisarlo
      // desde acá la borraría de Propietarios.
      await execute('contacts.update', { id: editingId, data });
      return;
    }
    await execute('contacts.create', {
      data: {
        ...data,
        type: 'tenant',
        // `contacts.is_active` es NOT NULL y no tiene default: si no lo mandamos, el
        // insert muere en la base.
        is_active: true,
      },
    });
  },
};
