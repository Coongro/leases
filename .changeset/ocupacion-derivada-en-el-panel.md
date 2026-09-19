---
'@coongro/leases': patch
---

El panel cuenta las unidades ocupadas por sus fechas, no por la columna

La ocupación del panel salía de contar las unidades con `status = 'ocupada'`. Esa columna
guarda la marca que pone quien administra («no disponible», «en recambio»), no si la unidad
está alquilada: eso se deriva de las fechas del contrato. Con la cartera llena, el panel
podía decir 0 % de ocupación.

Ahora cuenta `occupancy`, que es el campo donde `properties` publica la ocupación ya
resuelta contra la fecha de hoy.
