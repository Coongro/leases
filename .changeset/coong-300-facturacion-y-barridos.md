---
'@coongro/leases': patch
---

El mes se emite contrato por contrato, los barridos dicen qué hicieron, y una actualización vieja ya no pisa el alquiler

**Contratos que quedaban sin facturar.** Emitir el mes miraba si el período tenía algún
cargo y, si lo tenía, no generaba ninguno más. Un contrato firmado después de emitir
quedaba sin factura para siempre y sin ningún aviso: la unidad se veía alquilada y al
inquilino no le llegaba nada que pagar. Ahora se emite contrato por contrato — la
generación ya era idempotente (cada cuenta lleva su `contrato:período` único), así que
correrla de más no cuesta nada y correrla de menos dejaba plata sin cobrar.

**Barridos que no decían nada.** Pasar los arreglos a cargo del inquilino a su recibo
devolvía listas vacías sin explicar por qué: no se distinguía «no había trabajo» de
«falta emitir el mes» ni de «algo falló». Ahora devuelve el motivo de cada arreglo que no
entró y un resumen en una línea, que es lo único que ve quien pidió el barrido. El motivo
ya se calculaba en cada salteo; lo que faltaba era no tirarlo.

**Actualizaciones obsoletas.** Confirmar una propuesta por índice escribía su monto sobre
el contrato sin mirar si el alquiler había cambiado desde que se propuso. Con una
propuesta vieja y un aumento acordado a mano después, confirmarla devolvía el alquiler a
la cuenta anterior. Ahora se compara contra el alquiler que la propuesta asumió y, si no
coincide, se explica con los dos montos y se pide volver a detectarla.
