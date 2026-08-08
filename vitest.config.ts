import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * Los repositorios de leases importan tablas de los plugins vecinos
 * (`@coongro/contacts/server`, `@coongro/properties/server`) para poder hacer
 * los joins en la misma consulta. En runtime esos paquetes los resuelve el
 * plugin loader; vitest no sabe nada de eso y fallaba al cargar el archivo,
 * así que toda la capa de repositorios quedaba sin poder testearse — incluidas
 * las comprobaciones que cortan antes de tocar la base.
 *
 * Se apunta al `dist` de cada vecino, que es lo que el loader también entrega.
 */
const vecino = (plugin: string, entrada = 'index') =>
  resolve(__dirname, '..', plugin, 'dist', `${entrada}.js`);

export default defineConfig({
  resolve: {
    alias: [
      { find: '@coongro/contacts/server', replacement: vecino('contacts', 'server') },
      { find: '@coongro/properties/server', replacement: vecino('properties', 'server') },
      { find: '@coongro/billing/server', replacement: vecino('billing', 'server') },
      { find: '@coongro/indices/server', replacement: vecino('indices', 'server') },
      { find: '@coongro/maintenance/server', replacement: vecino('maintenance', 'server') },
    ],
  },
});
