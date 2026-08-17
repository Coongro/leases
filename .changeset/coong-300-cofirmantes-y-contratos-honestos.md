---
'@coongro/leases': minor
---

Se pueden registrar co-firmantes, consultar la cobranza ya no emite, y los contratos publicados dejan de prometer lo que no hacen

**Co-firmantes.** El kit no tenía forma de registrar a quien firma junto al inquilino
principal — ni por pantalla ni por API. La tabla existía y solo se la tocaba para dar de
baja en la cascada de rescisión. Ahora la ficha del contrato tiene «Quiénes firman», con
su alta y su baja, y la operación se niega a sumar un firmante a un contrato cerrado, a
anotar al inquilino principal como si fuera otra persona, y a repetir a alguien que ya
firma. El nombre se trae de `contacts` por join: duplicarlo lo dejaría viejo en cuanto
alguien corrija la persona.

**Consultar la cobranza del mes ya no emite.** `chargesForPeriod` tenía un
`generateIfMissing` que llamaba a la generación, y esa comodidad convertía una lectura en
una escritura encubierta: se publica declarada de lectura, así que la ve el perfil de
conexión de solo lectura como una consulta inofensiva y —por ser lectura— nunca tuvo que
correr de verdad para publicarse. Una rama que emite plata detrás de un contrato que
decía consultar. Emitir es `generateForPeriod`, que declara lo que hace. El acople existía
para cerrar la ventana de dos pantallas emitiendo el mismo mes, y esa ventana se cerró
sola cuando la generación pasó a ser incremental e idempotente por contrato.

**Contratos que prometían de más.** Las seis listas del plugin publicaban `limit` y
`offset` y ningún handler los implementaba: un agente pedía diez resultados y recibía
todos. Se sacaron. La de vencimientos además ocultaba los filtros que sí existen
(urgencia, tipo, incluir los ya vistos), que es justo lo que hace falta para preguntar qué
vence esta semana. Y los títulos y descripciones que había dejado el generador
—«Obtiene Contrato disponibles para el cliente actual»— se reescribieron para que digan
qué devuelve cada una.
