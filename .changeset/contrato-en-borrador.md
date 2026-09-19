---
'@coongro/leases': minor
---

Un contrato se puede guardar como borrador

El estado `borrador` existía en todas partes menos donde se necesitaba. La lógica ya sabía
tratarlo: un borrador no se factura, no genera actualizaciones y no le bloquea la unidad a
otro contrato. Los filtros de Contratos y de la ficha del inquilino lo ofrecían. Pero el
único camino que escribe un contrato fijaba «vigente» a mano, así que ese filtro siempre
daba vacío y la opción no existía.

Ahora el formulario tiene **Estado del contrato**: «Firmado · empieza a facturar» (el
default, el caso de todos los días) o «Borrador · todavía no se firma». Sirve para lo que
pasa siempre: el contrato se carga antes de estar firmado —falta que el garante traiga los
papeles— y hasta entonces no puede facturar ni tomar la unidad.

Y el mismo campo lo activa: al editarlo y pasarlo a firmado, empieza a facturar y la
unidad queda comprometida. Un borrador no le escribe las fechas a la unidad, justamente
para no mostrarla alquilada por algo que quizá no se firme.

Los otros estados —rescindido, renovado— siguen sin entrar por acá: tienen su propia
acción, porque significan cosas que pasaron, no que se eligen.
