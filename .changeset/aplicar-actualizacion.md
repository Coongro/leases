---
'@coongro/leases': patch
---

Los botones «Aplicar» y «Cancelar» de una actualización no hacían nada

En la pantalla de Actualizaciones, confirmar una actualización mostraba «Actualización
aplicada» y **no aplicaba nada**: el alquiler del contrato seguía igual. Lo mismo con
«Cancelar».

La causa: el motor de la vista, cuando el archivo de lógica define `onAction`, delega
en él TODA acción y no ejecuta ninguna por su cuenta. Y ese `onAction` ignoraba cuál se
había apretado — corría siempre la detección de actualizaciones, que es lo que hace el
botón de la cabecera. La lógica correcta existía en un `onRowAction` exportado que no
llamaba nadie.

Ahora cada botón hace lo suyo, y el aviso dice lo que realmente pasó.
