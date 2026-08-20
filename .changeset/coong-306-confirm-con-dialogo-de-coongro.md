---
'@coongro/leases': patch
---

Confirmar «Generar cargos del mes» y «Revisar vencimientos» ya no abre el cuadro del navegador

Los dos botones preguntaban con `window.confirm`: el cuadro propio del navegador, que
ignora los tokens y el modo oscuro, muestra el dominio arriba y se despacha sin leerlo.
Ahora preguntan con el mismo diálogo de Coongro que ya usaba el borrado de una fila, con
la etiqueta del botón como título y como verbo de confirmación.

Son vistas generadas: el arreglo es del codegen del Builder (COONG-306) y acá solo se
regeneran. Cancelar no ejecuta nada; confirmar ejecuta la acción una sola vez.
