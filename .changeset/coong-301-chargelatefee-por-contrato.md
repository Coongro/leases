---
'@coongro/leases': minor
---

Cobrar la mora vuelve a ser posible desde el canal agentic: se pide por contrato, cobra todos los cargos vencidos y siempre dice qué hizo.

La capability publicaba `id` y el handler leía `accountId`, así que por MCP el argumento nunca llegaba y la operación devolvía «no cobré» con el motivo vacío — nunca pudo cobrar, y la certificación la daba por buena porque el resultado era coherente con lo que la propia operación reportaba.

Ahora el input es `leaseId` (el contrato, que es lo que existe para quien administra; el id de una cuenta interna no se puede pedir sin haber mirado la pantalla) con `period` opcional para acotar a un mes. Con varios meses vencidos cobra sobre todos los cargos con saldo.

La política de gracia se lee de las settings del tenant **en el servidor**: antes solo existía del lado del navegador y viajaba como parámetros del RPC, así que un agente cobraba con cero días de gracia sobre plata de una persona.

Y `detail` ya no vuelve vacío nunca: distingue «al día», «dentro de los N días de gracia», «sin punitorio pactado», «sin saldo pendiente» y «ya cobrado hoy». Ese último caso además dejó de reportarse como cobro: la línea no se duplicaba, pero la respuesta decía haber cobrado un monto que nunca se agregó.
