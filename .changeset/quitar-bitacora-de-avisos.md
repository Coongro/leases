---
'@coongro/leases': minor
---

feat: se quita la bitácora de avisos hasta que exista un canal de envío (COONG-275)

`module_leases_notice_logs` existía desde el diseño original del kit: la bitácora inmutable de qué
se le comunicó al inquilino y cuándo, para poder sostener una intimación. Llegó a v1 con **cero
filas, ningún escritor y ninguna vista** — solo dos capabilities publicadas (`leases.notices.list`
y `getById`) que leían una tabla que nadie llenaba.

El motivo por el que quedó vacía no era falta de pantalla: el core **no tiene canal de envío**. El
motor de notificaciones materializa todo in-app, en la campana; el campo `channels` se persiste
pero el dispatcher nunca lo lee. No hay email, SMS ni WhatsApp en ninguna parte. Registrar "se le
avisó" sin haber podido avisar es un respaldo que no respalda nada — y peor, uno que en un reclamo
se presenta como si lo fuera.

Se quita la tabla en vez de dejarla esperando. Una tabla vacía con capabilities publicadas le
ofrece a un agente leer y escribir avisos que nunca salieron; el costo de traerla de vuelta cuando
el canal exista es una migración, y para entonces su forma va a depender de cómo se envíe.

`module_leases_expiry_alerts` no se toca y no la reemplaza: es estado recalculable —qué hay que
renovar— y se puede marcar como visto. Justo lo contrario de una bitácora.
