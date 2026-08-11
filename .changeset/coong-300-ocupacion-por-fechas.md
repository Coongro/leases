---
'@coongro/leases': patch
---

Firmar un contrato ya no ocupa la unidad antes de tiempo, y rescindir la libera el día que corresponde

Al firmar se marcaba la unidad como ocupada en el acto, sin mirar cuándo empezaba el
contrato: uno que arrancaba el mes siguiente la dejaba alquilada desde ese mismo día, así
que quedaba fuera de oferta estando libre. Y no había nada que la liberara al vencer.

Ahora se escriben las FECHAS que el contrato compromete —`occupied_from` y
`occupied_until` en la unidad— y `properties` deriva el estado contra el día de hoy. La
renovación corre el hasta; la rescisión lo fija en su fecha, no en el momento de
rescindir. Una migración completa las fechas de los contratos vigentes que ya existían.
