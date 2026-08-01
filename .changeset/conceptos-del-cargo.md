---
'@coongro/leases': minor
---

feat: facturar ABL, servicios y descuentos además del alquiler (COONG-275)

El plan definía siete tipos de línea (`rent | expensas | abl | servicio | punitorio | descuento | otro`)
pero solo se podían emitir tres. Un propietario que le cobra el ABL o el agua al inquilino los
cobraba por fuera del sistema, y la cuenta corriente mentía.

Ahora un contrato tiene sus **conceptos recurrentes** (`leases.charges`), que se suman como líneas
propias al generar el mes:

```
Alquiler 2026-09                            586.612   rent
Expensas 2026-09 · estimadas según contrato  72.000   expenses
ABL 2026-09                                  18.000   abl
Aguas Santafesinas 2026-09                    9.500   servicio
Bonificación por pago adelantado 2026-09    -15.000   descuento
```

Tres cosas se resolvieron distinto de la fuente (LocaCentral `monthlybillingmanager.js`), porque su
enfoque falla en silencio:

- **El tipo se elige, no se adivina.** Allá lo deducen del título con `includes()`, así que
  «Impuesto municipal» cae en «otro» y «Luz de emergencia del palier» se clasifica como servicio de
  luz. Acá el tipo es del concepto.
- **Un descuento es un concepto con signo negativo**, en la misma lista y con la misma vigencia que
  el resto — no un campo aparte del contrato como su `promo`/`notepromo`.
- **Los conceptos se dan de baja con `valid_to`, no se borran.** Una cochera que se cobró seis meses
  deja de facturarse conservando el registro de por qué se cobró.

Un importe en cero no genera línea, y los montos se redondean a peso entero como el resto del kit.
