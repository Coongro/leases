---
'@coongro/leases': minor
---

feat: las actualizaciones por índice se detectan solas todas las mañanas (COONG-275)

Hasta ahora la detección existía pero había que ir a Actualizaciones y apretar un botón. Un contrato
que cumplía su aniversario en agosto y que nadie miraba hasta octubre se seguía facturando al valor
viejo, y esa plata no se recupera.

- Tarea programada diaria (7 AM) con `scope: "tenant"`: la plataforma la corre una vez por cada
  tenant que tenga el plugin, con la base ya apuntada a ese cliente.
- Reusa `IndexValueRepository.quote()` de `@coongro/indices`, que baja la serie del BCRA si falta —
  no hay una segunda copia de esa integración acá.
- **No cambia ningún alquiler**: la propuesta nace `pending` con los dos valores del índice
  guardados, y una persona la confirma. Lo que toca plata se propone, no se aplica solo.
- Idempotente: las fechas ya propuestas o aplicadas no se vuelven a proponer, así que correrla de
  nuevo no duplica nada.
- Un contrato cuyo índice todavía no se publicó se anota y se reintenta al día siguiente, sin frenar
  a los demás.
- El plugin pasa a `runtime: "eager"`, que es lo que exige un cron para no apagarse cuando el plugin
  sale del cache.
