---
'@coongro/leases': patch
---

Las operaciones que mueven la plata dicen qué les falta antes de tocar la base

Firmar un contrato sin plazo o sin alquiler, renovarlo sin decir hasta cuándo, rescindirlo sin fecha
o generar un mes sin período morían con errores de la base —«invalid input syntax for type numeric»,
«Cannot read properties of undefined»— que no dicen qué falta ni sobre qué contrato. Ahora lo dicen,
y cortan antes de escribir.

Además, un concepto dado de baja deja de leerse por su id: antes desaparecía de la lista pero quien
lo pidiera directo lo recibía igual y podía seguir operando sobre algo que ya no existe.
