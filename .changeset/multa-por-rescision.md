---
'@coongro/leases': minor
---

Rescindir un contrato ahora resuelve la multa, en vez de dejarla «para hablarlo»

La rescisión guardaba la fecha de fin, liberaba la unidad y terminaba ahí. La multa por
rescisión anticipada —que el contrato tiene pactada en meses de alquiler— no aparecía en
ninguna parte: se cobraba por fuera del sistema, o no se cobraba. El dato estaba cargado
y no servía para nada.

Ahora el panel de rescisión **propone** el importe (meses pactados × alquiler vigente,
no el inicial: si el contrato se actualizó por índice, tres meses son tres meses de lo
que se paga hoy) y ofrece dos caminos: **cobrarla** o **no cobrarla**. El importe es
editable, porque en la práctica se negocia. Si el contrato no pactó multa, la opción
arranca en no cobrar: ofrecer cobrar una multa que nadie firmó sería inventar una deuda.

Cuando se cobra, la multa va donde se pueda cobrar: **al recibo del mes de la rescisión
si ya está emitido, o como concepto de ese mismo mes si todavía no**. Son dos caminos
porque la rescisión puede pasar antes o después de facturar el mes, y ninguno sirve para
el otro caso: agregar una línea a un recibo que no existe no cobra nada, y crear el
recibo con sólo la multa haría que la generación del mes lo encuentre hecho y no emita
el alquiler. Eligiendo uno solo, la multa se cobra exactamente una vez.

En un contrato en dólares la multa se convierte con el mismo criterio que el alquiler:
la cotización pactada gana sobre la del mercado.

Rescindir y resolver la multa son **una sola acción** (`leases.billing.terminateLease`):
separarlas deja el estado de la mitad —contrato rescindido, multa en el aire— que es
justamente el que se quiere evitar.
