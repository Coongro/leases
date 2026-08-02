---
'@coongro/leases': minor
---

feat: la suba pactada queda en el historial y los arreglos del inquilino entran en su recibo (COONG-275)

Dos agujeros por los que se perdía plata o rastro de plata.

**Una suba acordada a mano no dejaba huella.** El alquiler se podía cambiar editando el contrato,
pero eso solo pisaba el número: los cargos ya emitidos quedaban sin explicación y la ficha no
mostraba nada. Ahora una edición que cambia el monto se anota en el mismo historial que las
actualizaciones por índice, con el valor anterior, el nuevo, la variación y desde cuándo rige —
identificada como **«Pactada»** para distinguirla de las que calcula el ICL. Nace aplicada, porque
el cambio ya lo decidió quien escribió el monto. Volver a guardar el formulario sin tocar el precio
no anota nada.

**Un arreglo a cargo del inquilino lo terminaba pagando el propietario.** El campo «Lo paga: el
inquilino» de una orden de trabajo no era más que una anotación. Ahora ese gasto entra en su recibo,
con la regla con la que liquida una administración: **el primer recibo que todavía no se cobró**.

- Si el cargo del mes sigue impago, la línea va ahí.
- Si ya se cobró —entero o en parte—, no se toca: el gasto espera al mes siguiente. Sumarle plata a
  un recibo que la otra persona dio por cerrado es la forma de romper la confianza en el número.
- Si el único cargo impago está vencido, tampoco: el gasto quedaría devengando el punitorio del
  contrato desde antes de que el arreglo existiera.

Cargarlo dos veces no duplica, y corregir la orden retira la línea del recibo mientras nadie haya
pagado contra él. Corre al generar los cargos del mes y en un barrido diario a las 8, así un arreglo
cerrado no espera a que alguien se acuerde de facturar.
