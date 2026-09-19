---
'@coongro/leases': patch
---

La píldora de estado de un recibo decía «closed»

Las tres tablas que muestran los cargos —Cobranzas, la ficha del contrato y la del
inquilino— traducían `open` y `overdue`, y dejaban pasar `closed` en crudo, que es el
estado más frecuente: 28 de los 39 recibos del entorno de prueba. Encima traducían
`paid` y `partial`, que **billing nunca escribe**: los únicos estados que una cuenta
llega a tener son `open`, `closed` y `overdue`.

Ahora las tres dicen lo mismo y sólo lo que existe: **Emitido**, **Vencido**,
**Cerrado**. Si el recibo se cobró entero o quedó algo se lee en la columna «Cobrado»,
que está al lado — la píldora dice en qué etapa está el recibo, no cuánta plata entró.
