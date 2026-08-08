---
'@coongro/leases': patch
---

Cada acción de una vista se declara y se verifica por separado

En «Vencimientos» y «Cobranzas», el `onAction` resolvía dos operaciones distintas
—barrer la cartera y acusar un aviso; emitir el mes y cobrar un punitorio— pero solo
una quedaba declarada en el contrato headless. La otra existía únicamente como texto
en una precondición, así que ningún agente podía usarla y el Builder reportaba el
hook como orquestación.

Ahora cada operación vive en su propia rama `actionId === '...'` y tiene su entrada
`headless.handlers` con su `key`. Son operaciones distintas, no variantes de una:
acusar UN aviso y revisar la cartera entera no comparten ni el sujeto.

`chargeLateFee` pasa a devolver un tipo nombrado en vez de un genérico inline, que
el inventario del Builder no podía leer y marcaba como no verificable.
