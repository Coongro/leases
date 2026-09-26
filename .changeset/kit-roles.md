---
'@coongro/leases': minor
---

Los contratos declaran quién puede verlos, gestionarlos y cobrar alquileres

El plugin declara sus permisos (`contributes.permissions`, generados con el Coongro Builder) y trae `src/permissions/permissions.gen.ts` con las constantes para chequearlos en código. En Coongro Standalone, cada usuario ve y hace solo lo que le permiten sus roles; el dueño, todo. Rescindir un contrato queda dentro de «Gestionar contratos».

Las vistas del Builder se regeneraron: los botones que abren una pantalla o ejecutan una acción que el rol no permite ya no se muestran. Necesita un Core con `useAccess` en el plugin-sdk (Coongro/coongro-core#687).
