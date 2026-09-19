---
'@coongro/leases': patch
---

El arreglo que paga el inquilino se pone al día cuando cambia su costo

El egreso al proveedor ya se resincronizaba si el costo de la orden cambiaba; el recupero
al inquilino no. Una orden presupuestada en $50.000 que termina costando $65.000 se le
pagaba entera al plomero y se le recuperaban $50.000 al inquilino: los $15.000 los
absorbía el propietario, que es exactamente lo contrario de lo que significa «a cargo del
inquilino».

Ahora el barrido pone al día lo que ya está en un recibo, y lo dice en su resumen. Un
recibo que YA recibió un pago no se toca — el mismo criterio que usa el retiro, y por la
misma razón: la otra persona pagó contra un total, y cambiárselo después le deja un saldo
que nadie decidió.
