---
'@coongro/leases': patch
---

Un contrato de precio fijo se puede guardar, y el saldo deja de decir «US$»

**«Índice de actualización» y «Se actualiza cada» eran obligatorios.** Un contrato cuyo
precio no se actualiza solo —frecuente en locales comerciales pactados en dólares— no
podía editarse nunca: cualquier cambio moría en «Revisá el formulario». Y al darlo de
alta obligaba a inventarle un índice, que después disparaba actualizaciones que nadie
pactó. Ahora el índice es opcional (su placeholder dice qué significa dejarlo vacío) y
el período sólo aparece cuando hay un índice elegido, que es cuando la pregunta tiene
sentido.

En la ficha, el **saldo del inquilino** se rotulaba con la moneda del contrato: mostraba
`US$ 1.887.000` sobre un saldo que estaba en pesos: los cargos se emiten convertidos.
Leído así, la deuda parecía mil veces más grande. Las **expensas** tenían el mismo
problema y la misma causa: las liquida el consorcio en pesos, no el contrato.
